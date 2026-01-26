/**
 * Guided Tour Service
 *
 * Manages guided tours through a webpage, combining DOM Navigator
 * and Highlight System to walk users through content.
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

// Default tour configuration
const DEFAULT_STEP_DURATION = 5000;

export class GuidedTourService {
  private static instance: GuidedTourService;
  private state: TourState;
  private stepTimeout: ReturnType<typeof setTimeout> | null = null;
  private onStepChangeCallbacks: Set<(step: TourStep | null, index: number) => void> = new Set();
  private onTourEndCallbacks: Set<() => void> = new Set();
  private onSpeakCallbacks: Set<(text: string) => void> = new Set();

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
          description: 'Use the navigation menu to jump to different sections of the page.',
          action: 'highlight',
          voiceScript: 'At the top you\'ll find the navigation menu. You can use these links to quickly jump to any section.',
        });
      }
    }

    // Section steps
    for (const section of pageMap.sections) {
      if (steps.length >= maxSteps) break;

      // Skip very small sections
      if (section.boundingRect.height < 150) continue;

      const stepInfo = this.createStepFromSection(section);
      if (stepInfo) {
        steps.push(stepInfo);
      }
    }

    // Contact/form step (if present)
    const contactForm = pageMap.forms.find(f =>
      f.name?.toLowerCase().includes('contact') ||
      f.element.id.toLowerCase().includes('contact')
    );
    if (contactForm && steps.length < maxSteps) {
      steps.push({
        id: 'tour-contact',
        target: this.getSelector(contactForm.element),
        title: 'Contact',
        description: 'Use this form to get in touch.',
        action: 'spotlight',
        voiceScript: 'Here\'s the contact form. You can fill this out to send a message.',
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

    // Execute step
    await this.executeStep(step);

    // Notify callbacks
    this.notifyStepChange(step, nextIndex);
  }

  /**
   * Move to the previous step
   */
  async previousStep(): Promise<void> {
    if (!this.state.tourConfig || !this.state.isActive) return;

    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    const prevIndex = this.state.currentStepIndex - 1;

    if (prevIndex < 0) return;

    this.state.currentStepIndex = prevIndex;
    const step = this.state.tourConfig.steps[prevIndex];

    await this.executeStep(step);
    this.notifyStepChange(step, prevIndex);
  }

  /**
   * Skip to a specific step by ID or index
   */
  async skipToStep(stepIdOrIndex: string | number): Promise<void> {
    if (!this.state.tourConfig || !this.state.isActive) return;

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

    await this.executeStep(step);
    this.notifyStepChange(step, index);
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
      callback();
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
    await this.sleep(100);

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

    // Speak voice script
    if (step.voiceScript) {
      for (const callback of this.onSpeakCallbacks) {
        callback(step.voiceScript);
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
    let voiceScript = '';

    // Generate contextual descriptions
    if (titleLower.includes('hero') || section.level === 1) {
      description = 'The main introduction to this page.';
      voiceScript = `This is the main section. ${title}.`;
    } else if (titleLower.includes('about')) {
      description = 'Learn more about the background and story.';
      voiceScript = 'Here\'s the about section where you can learn more about the background and experience.';
    } else if (titleLower.includes('project') || titleLower.includes('work') || titleLower.includes('portfolio')) {
      description = 'Browse through the portfolio of work and projects.';
      voiceScript = 'The projects section showcases the work. You can explore different projects here.';
    } else if (titleLower.includes('skill') || titleLower.includes('technolog') || titleLower.includes('expertise')) {
      description = 'Technical skills and areas of expertise.';
      voiceScript = 'This section covers the technical skills and technologies used.';
    } else if (titleLower.includes('experience') || titleLower.includes('career')) {
      description = 'Professional experience and career history.';
      voiceScript = 'Here you can see the professional experience and career journey.';
    } else if (titleLower.includes('contact')) {
      description = 'Get in touch or send a message.';
      voiceScript = 'The contact section. You can reach out here.';
    } else {
      description = `The ${title} section of this page.`;
      voiceScript = `Here's the ${title} section.`;
    }

    return {
      id: `tour-${section.id}`,
      target: this.getSelector(section.element),
      title,
      description,
      action: 'spotlight',
      voiceScript,
    };
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;

    // Try data attributes
    const dataSection = element.getAttribute('data-section');
    if (dataSection) return `[data-section="${dataSection}"]`;

    // Build a selector based on tag and class
    const tag = element.tagName.toLowerCase();
    const firstClass = element.className?.split(' ')[0];

    if (firstClass) {
      return `${tag}.${firstClass}`;
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
      callback(step, index);
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
