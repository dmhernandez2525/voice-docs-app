/**
 * Guided Tour Service
 *
 * Manages guided tours through a webpage, combining DOM Navigator
 * and Highlight System to walk users through content.
 * Uses AI-generated voice scripts for dynamic, contextual narration.
 */

import type {
  TourConfig,
  TourStep,
  PageMap,
} from '../types/voiceStocks';

// Internal tour state type
interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  tourConfig: TourConfig | null;
  completedSteps: string[];
}
import { getVoiceStocksDOMNavigator } from './domNavigator';
import {
  highlightSystem,
  scrollAndHighlight,
  clearHighlights,
} from './highlightSystem';
import { generateActionResponse } from './browserAI';

// Default tour configuration - longer base duration for comprehensive tours
// This can be adjusted by the TourPlayer's speed control
const DEFAULT_STEP_DURATION = 8000;

export class GuidedTourService {
  private static instance: GuidedTourService;
  private state: TourState;
  private stepTimeout: ReturnType<typeof setTimeout> | null = null;
  private onStepChangeCallbacks: Set<(step: TourStep | null, index: number) => void> = new Set();
  private onTourEndCallbacks: Set<() => void> = new Set();
  private onSpeakCallbacks: Set<(text: string) => void> = new Set();
  private isTransitioning: boolean = false; // Debounce flag to prevent rapid transitions

  private constructor() {
    this.state = {
      isActive: false,
      currentStepIndex: -1,
      tourConfig: null,
      completedSteps: [],
    };
  }

  static getInstance(): GuidedTourService {
    if (!GuidedTourService.instance) {
      GuidedTourService.instance = new GuidedTourService();
    }
    return GuidedTourService.instance;
  }

  /**
   * Generate a tour from the current page structure
   */
  generateTourFromPage(options?: {
    includeNav?: boolean;
    maxSteps?: number;
  }): TourConfig {
    const navigator = getVoiceStocksDOMNavigator();
    const pageMap = navigator.generatePageMap();

    const steps: TourStep[] = [];
    const includeNav = options?.includeNav ?? true;
    const maxSteps = options?.maxSteps ?? 10;

    // Navigation step (if present and requested)
    if (includeNav && pageMap.navigation.length > 0) {
      const navElement = pageMap.navigation[0].element.closest('nav') ||
                         pageMap.navigation[0].element.parentElement;
      if (navElement instanceof HTMLElement) {
        steps.push({
          id: 'tour-nav',
          target: this.getSelector(navElement),
          title: 'Navigation',
          description: 'The navigation menu with links to quickly jump to any section of the page.',
          action: 'highlight',
        });
      }
    }

    // Section steps - sort by visual position (top to bottom)
    const sortedSections = [...pageMap.sections].sort((a, b) => {
      // Sort by vertical position first, then horizontal
      const topDiff = a.boundingRect.top - b.boundingRect.top;
      if (Math.abs(topDiff) > 50) return topDiff; // Significant vertical difference
      return a.boundingRect.left - b.boundingRect.left;
    });

    for (const section of sortedSections) {
      if (steps.length >= maxSteps) break;

      // Skip very small sections
      if (section.boundingRect.height < 150) continue;

      const stepInfo = this.createStepFromSection(section);
      if (stepInfo) {
        steps.push(stepInfo);
      }
    }

    // Contact/form step (if present)
    const contactForm = pageMap.forms.find(f => {
      // Safety check: ensure name is a string before calling toLowerCase
      const formName = typeof f.name === 'string' ? f.name.toLowerCase() : '';
      const formId = f.element.id?.toLowerCase() || '';
      return formName.includes('contact') || formId.includes('contact');
    });
    if (contactForm && steps.length < maxSteps) {
      steps.push({
        id: 'tour-contact',
        target: this.getSelector(contactForm.element),
        title: 'Contact Form',
        description: 'A form for getting in touch directly.',
        action: 'spotlight',
      });
    }

    return {
      id: `auto-tour-${Date.now()}`,
      name: 'Page Tour',
      description: 'A guided tour of this page',
      steps,
    };
  }

  /**
   * Start a tour with given configuration
   */
  async startTour(config: TourConfig): Promise<void> {
    if (this.state.isActive) {
      this.endTour();
    }

    this.state = {
      isActive: true,
      currentStepIndex: -1,
      tourConfig: config,
      completedSteps: [],
    };

    // Start first step
    await this.nextStep();
  }

  /**
   * Start an auto-generated tour of the current page
   */
  async startAutoTour(): Promise<void> {
    const config = this.generateTourFromPage();
    await this.startTour(config);
  }

  /**
   * Move to the next step
   */
  async nextStep(): Promise<void> {
    if (!this.state.tourConfig || !this.state.isActive) return;

    // Prevent rapid transitions
    if (this.isTransitioning) return;

    // Clear any pending timeout
    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    const nextIndex = this.state.currentStepIndex + 1;

    if (nextIndex >= this.state.tourConfig.steps.length) {
      this.endTour();
      return;
    }

    // Mark current step as completed
    if (this.state.currentStepIndex >= 0) {
      const currentStep = this.state.tourConfig.steps[this.state.currentStepIndex];
      this.state.completedSteps.push(currentStep.id);
    }

    this.state.currentStepIndex = nextIndex;
    const step = this.state.tourConfig.steps[nextIndex];

    // Set transitioning flag
    this.isTransitioning = true;

    try {
      // Execute step
      await this.executeStep(step);

      // Notify callbacks
      this.notifyStepChange(step, nextIndex);
    } finally {
      // Clear transitioning flag after a delay
      setTimeout(() => {
        this.isTransitioning = false;
      }, 600);
    }
  }

  /**
   * Move to the previous step
   */
  async previousStep(): Promise<void> {
    if (!this.state.tourConfig || !this.state.isActive) return;

    if (this.isTransitioning) return;

    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    const prevIndex = this.state.currentStepIndex - 1;

    if (prevIndex < 0) return;

    this.state.currentStepIndex = prevIndex;
    const step = this.state.tourConfig.steps[prevIndex];

    // Set transitioning flag
    this.isTransitioning = true;

    try {
      await this.executeStep(step);
      this.notifyStepChange(step, prevIndex);
    } finally {
      setTimeout(() => {
        this.isTransitioning = false;
      }, 600);
    }
  }

  /**
   * Skip to a specific step by ID or index
   */
  async skipToStep(stepIdOrIndex: string | number): Promise<void> {
    if (!this.state.tourConfig || !this.state.isActive) return;

    if (this.isTransitioning) return;

    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    let index: number;

    if (typeof stepIdOrIndex === 'string') {
      index = this.state.tourConfig.steps.findIndex(s => s.id === stepIdOrIndex);
      if (index === -1) return;
    } else {
      index = stepIdOrIndex;
      if (index < 0 || index >= this.state.tourConfig.steps.length) return;
    }

    this.state.currentStepIndex = index;
    const step = this.state.tourConfig.steps[index];

    // Set transitioning flag
    this.isTransitioning = true;

    try {
      await this.executeStep(step);
      this.notifyStepChange(step, index);
    } finally {
      setTimeout(() => {
        this.isTransitioning = false;
      }, 600);
    }
  }

  /**
   * Skip to a section by name (fuzzy match)
   */
  async skipToSection(sectionName: string): Promise<boolean> {
    if (!this.state.tourConfig) return false;

    const nameLower = sectionName.toLowerCase();

    // Find matching step
    const matchIndex = this.state.tourConfig.steps.findIndex(step =>
      step.title.toLowerCase().includes(nameLower) ||
      step.id.toLowerCase().includes(nameLower)
    );

    if (matchIndex >= 0) {
      await this.skipToStep(matchIndex);
      return true;
    }

    return false;
  }

  /**
   * End the current tour
   */
  endTour(): void {
    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    clearHighlights();

    this.state = {
      isActive: false,
      currentStepIndex: -1,
      tourConfig: null,
      completedSteps: [],
    };

    // Notify callbacks
    for (const callback of this.onTourEndCallbacks) {
      try {
        callback();
      } catch { /* ignore callback errors */ }
    }
    this.notifyStepChange(null, -1);
  }

  /**
   * Pause the tour (stop auto-advance)
   */
  pause(): void {
    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }
  }

  /**
   * Resume the tour (restart auto-advance timer)
   */
  resume(duration?: number): void {
    if (!this.state.isActive || !this.state.tourConfig) return;

    const effectiveDuration = duration ?? DEFAULT_STEP_DURATION;
    this.stepTimeout = setTimeout(() => this.nextStep(), effectiveDuration);
  }

  /**
   * Get current tour state
   */
  getState(): Readonly<TourState> {
    return this.state;
  }

  /**
   * Get current step
   */
  getCurrentStep(): TourStep | null {
    if (!this.state.tourConfig || this.state.currentStepIndex < 0) {
      return null;
    }
    return this.state.tourConfig.steps[this.state.currentStepIndex] || null;
  }

  /**
   * Get tour progress
   */
  getProgress(): { current: number; total: number; percent: number } {
    if (!this.state.tourConfig) {
      return { current: 0, total: 0, percent: 0 };
    }

    const current = this.state.currentStepIndex + 1;
    const total = this.state.tourConfig.steps.length;
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percent };
  }

  /**
   * Register callback for step changes
   */
  onStepChange(callback: (step: TourStep | null, index: number) => void): () => void {
    this.onStepChangeCallbacks.add(callback);
    return () => this.onStepChangeCallbacks.delete(callback);
  }

  /**
   * Register callback for tour end
   */
  onTourEnd(callback: () => void): () => void {
    this.onTourEndCallbacks.add(callback);
    return () => this.onTourEndCallbacks.delete(callback);
  }

  /**
   * Register callback for voice scripts (TTS integration)
   */
  onSpeak(callback: (text: string) => void): () => void {
    this.onSpeakCallbacks.add(callback);
    return () => this.onSpeakCallbacks.delete(callback);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async executeStep(step: TourStep): Promise<void> {
    // Find target element
    const element = document.querySelector(step.target);
    if (!(element instanceof HTMLElement)) {
      console.warn(`[GuidedTour] Target not found: ${step.target}`);
      return;
    }

    // Clear previous highlights
    clearHighlights();

    // Wait a moment for visual transition
    await this.sleep(200);

    // Execute highlight action
    switch (step.action) {
      case 'spotlight':
        await scrollAndHighlight(element, { position: 'center' }, { dimBackground: true });
        break;
      case 'scroll':
        await highlightSystem.scrollTo(element, { position: 'center' });
        break;
      case 'point':
        await highlightSystem.scrollTo(element, { position: 'center' });
        highlightSystem.pointTo(element);
        break;
      case 'highlight':
      default:
        await scrollAndHighlight(element, { position: 'center' }, { dimBackground: false });
        break;
    }

    // Generate voice script dynamically using AI
    const voiceScript = await generateActionResponse('tour_step', {
      section: step.title,
      description: step.description,
    });

    // Speak voice script
    if (voiceScript) {
      for (const callback of this.onSpeakCallbacks) {
        try {
          callback(voiceScript);
        } catch { /* ignore callback errors */ }
      }
    }

    // Set auto-advance timer (if not waiting for interaction)
    if (!step.waitForInteraction) {
      this.stepTimeout = setTimeout(() => this.nextStep(), DEFAULT_STEP_DURATION);
    }
  }

  private createStepFromSection(
    section: PageMap['sections'][0]
  ): TourStep | null {
    const title = section.title;
    if (!title || title === 'Untitled Section') return null;

    const titleLower = title.toLowerCase();
    let description = '';

    // Provide contextual descriptions that the AI will use to generate dynamic voice scripts
    if (titleLower.includes('hero') || section.level === 1) {
      description = 'The main introduction showcasing the website\'s purpose. Features call-to-action buttons for exploring content.';
    } else if (titleLower.includes('about')) {
      description = 'Background information and story. Learn more about who is behind this website.';
    } else if (titleLower.includes('project') || titleLower.includes('work') || titleLower.includes('portfolio')) {
      description = 'A collection of projects showcasing work and capabilities. Each card provides details and may have live demos.';
    } else if (titleLower.includes('skill') || titleLower.includes('technolog') || titleLower.includes('expertise')) {
      description = 'Technical expertise breakdown showing proficiency in various technologies and tools.';
    } else if (titleLower.includes('experience') || titleLower.includes('career') || titleLower.includes('professional')) {
      description = 'Professional timeline showing career history and work experience.';
    } else if (titleLower.includes('contact')) {
      description = 'Ways to connect: contact form, social links, and direct contact information.';
    } else if (titleLower.includes('service') || titleLower.includes('offer')) {
      description = 'Services offered and what this website can help you with.';
    } else if (titleLower.includes('testimonial') || titleLower.includes('review')) {
      description = 'Reviews and testimonials from clients or colleagues.';
    } else if (titleLower.includes('faq') || titleLower.includes('question')) {
      description = 'Frequently asked questions with helpful answers.';
    } else if (titleLower.includes('blog') || titleLower.includes('article') || titleLower.includes('post')) {
      description = 'Blog posts or articles with insights and knowledge sharing.';
    } else if (titleLower.includes('pricing') || titleLower.includes('plan')) {
      description = 'Pricing information and available plans or packages.';
    } else if (titleLower.includes('feature')) {
      description = 'Key features and capabilities highlighted.';
    } else if (titleLower.includes('team') || titleLower.includes('member')) {
      description = 'Team members and their roles.';
    } else {
      description = `The ${title} section of this page.`;
    }

    return {
      id: `tour-${section.id}`,
      target: this.getSelector(section.element),
      title,
      description,
      action: 'spotlight',
      waitForInteraction: false, // TourPlayer manages timing now
    };
  }

  private getSelector(element: HTMLElement): string {
    // Use CSS.escape for IDs with special characters
    if (element.id) return `#${CSS.escape(element.id)}`;

    // Try data attributes (escape for special characters)
    const dataSection = element.getAttribute('data-section');
    if (dataSection) return `[data-section="${CSS.escape(dataSection)}"]`;

    // Build a selector based on tag and class
    const tag = element.tagName.toLowerCase();
    // Handle SVG elements where className is SVGAnimatedString
    const className = typeof element.className === 'string' ? element.className : '';
    const firstClass = className.trim().split(/\s+/)[0];

    if (firstClass) {
      return `${tag}.${CSS.escape(firstClass)}`;
    }

    // Fallback to nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      return `${tag}:nth-child(${index})`;
    }

    return tag;
  }

  private notifyStepChange(step: TourStep | null, index: number): void {
    for (const callback of this.onStepChangeCallbacks) {
      try {
        callback(step, index);
      } catch { /* ignore callback errors */ }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const guidedTour = GuidedTourService.getInstance();

// Convenience functions
export function startTour(config: TourConfig): Promise<void> {
  return guidedTour.startTour(config);
}

export function startAutoTour(): Promise<void> {
  return guidedTour.startAutoTour();
}

export function nextTourStep(): Promise<void> {
  return guidedTour.nextStep();
}

export function previousTourStep(): Promise<void> {
  return guidedTour.previousStep();
}

export function endTour(): void {
  guidedTour.endTour();
}

export function getTourState(): Readonly<TourState> {
  return guidedTour.getState();
}

export function getTourProgress(): { current: number; total: number; percent: number } {
  return guidedTour.getProgress();
}
