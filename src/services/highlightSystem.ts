/**
 * Highlight System
 *
 * Provides visual highlighting effects for Voice Stocks navigation.
 * Includes spotlight, scroll-to, point-to, and pulse animations.
 */

import type {
  SpotlightOptions,
  ScrollOptions,
  HighlightInstance,
} from '../types/voiceStocks';

// Local type for internal state management
interface HighlightState {
  activeHighlights: Map<string, HighlightInstance>;
  isDimmed: boolean;
}

// CSS class prefix for highlight elements
const CSS_PREFIX = 'vs-highlight';

// Default options
const DEFAULT_SPOTLIGHT_OPTIONS: SpotlightOptions = {
  style: 'glow',
  color: '#3B82F6',
  duration: 3000,
  dimBackground: true,
  pulseAnimation: true,
};

const DEFAULT_SCROLL_OPTIONS: ScrollOptions = {
  position: 'center',
  behavior: 'smooth',
  offset: 80, // Account for fixed headers
};

export class HighlightSystem {
  private static instance: HighlightSystem;
  private state: HighlightState;
  private styleElement: HTMLStyleElement | null = null;
  private observers: Map<string, ResizeObserver> = new Map();

  private constructor() {
    this.state = {
      activeHighlights: new Map(),
      isDimmed: false,
    };
    this.injectStyles();
  }

  static getInstance(): HighlightSystem {
    if (!HighlightSystem.instance) {
      HighlightSystem.instance = new HighlightSystem();
    }
    return HighlightSystem.instance;
  }

  /**
   * Spotlight an element with a glowing highlight effect
   */
  spotlight(element: HTMLElement, options: Partial<SpotlightOptions> = {}): string {
    const opts = { ...DEFAULT_SPOTLIGHT_OPTIONS, ...options };
    const id = this.generateId();

    // Clear any existing highlight on this element
    this.clearElement(element);

    // Dim background if requested
    if (opts.dimBackground) {
      this.dimBackground(true);
    }

    // Create highlight overlay
    const overlay = this.createOverlay(element, opts);
    document.body.appendChild(overlay);

    // Track element position
    const observer = this.observeElement(element, overlay);

    // Store instance
    const instance: HighlightInstance = {
      id,
      element,
      style: opts.style,
      overlayElement: overlay,
      cleanup: () => {
        overlay.remove();
        observer.disconnect();
        this.observers.delete(id);
        if (opts.dimBackground) {
          this.dimBackground(false);
        }
      },
    };

    this.state.activeHighlights.set(id, instance);

    // Auto-remove after duration
    if (opts.duration && opts.duration > 0) {
      setTimeout(() => this.remove(id), opts.duration);
    }

    return id;
  }

  /**
   * Scroll element into view with smooth animation
   */
  scrollTo(element: HTMLElement, options: Partial<ScrollOptions> = {}): Promise<void> {
    const opts = { ...DEFAULT_SCROLL_OPTIONS, ...options };

    return new Promise((resolve) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      let targetY: number;
      switch (opts.position) {
        case 'top':
          targetY = rect.top + window.scrollY - opts.offset!;
          break;
        case 'bottom':
          targetY = rect.bottom + window.scrollY - viewportHeight + opts.offset!;
          break;
        case 'center':
        default:
          targetY = rect.top + window.scrollY - (viewportHeight / 2) + (rect.height / 2);
          break;
      }

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: opts.behavior,
      });

      // Wait for scroll to complete (approximate)
      const scrollDuration = opts.behavior === 'smooth' ? 500 : 0;
      setTimeout(resolve, scrollDuration);
    });
  }

  /**
   * Point to an element with an animated arrow
   */
  pointTo(element: HTMLElement, duration: number = 3000): string {
    const id = this.generateId();

    // Clear any existing highlight on this element
    this.clearElement(element);

    // Create arrow element
    const arrow = this.createArrow(element);
    document.body.appendChild(arrow);

    // Track position
    const observer = this.observeElement(element, arrow, true);

    const instance: HighlightInstance = {
      id,
      element,
      style: 'arrow',
      overlayElement: arrow,
      cleanup: () => {
        arrow.remove();
        observer.disconnect();
        this.observers.delete(id);
      },
    };

    this.state.activeHighlights.set(id, instance);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  /**
   * Create a pulsing ring around an element
   */
  pulse(element: HTMLElement, duration: number = 2000): string {
    const id = this.generateId();

    // Clear any existing highlight on this element
    this.clearElement(element);

    // Create pulse ring
    const ring = this.createPulseRing(element);
    document.body.appendChild(ring);

    // Track position
    const observer = this.observeElement(element, ring);

    const instance: HighlightInstance = {
      id,
      element,
      style: 'outline',
      overlayElement: ring,
      cleanup: () => {
        ring.remove();
        observer.disconnect();
        this.observers.delete(id);
      },
    };

    this.state.activeHighlights.set(id, instance);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  /**
   * Scroll to and highlight an element in sequence
   */
  async scrollAndHighlight(
    element: HTMLElement,
    scrollOptions?: Partial<ScrollOptions>,
    highlightOptions?: Partial<SpotlightOptions>
  ): Promise<string> {
    await this.scrollTo(element, scrollOptions);
    return this.spotlight(element, highlightOptions);
  }

  /**
   * Remove a specific highlight by ID
   */
  remove(id: string): void {
    const instance = this.state.activeHighlights.get(id);
    if (instance) {
      instance.cleanup();
      this.state.activeHighlights.delete(id);
    }
  }

  /**
   * Clear all highlights from an element
   */
  clearElement(element: HTMLElement): void {
    for (const [id, instance] of this.state.activeHighlights) {
      if (instance.element === element) {
        instance.cleanup();
        this.state.activeHighlights.delete(id);
      }
    }
  }

  /**
   * Clear all active highlights
   */
  clearAll(): void {
    for (const instance of this.state.activeHighlights.values()) {
      instance.cleanup();
    }
    this.state.activeHighlights.clear();
    this.dimBackground(false);
  }

  /**
   * Get current highlight state
   */
  getState(): Readonly<HighlightState> {
    return this.state;
  }

  /**
   * Check if an element is currently highlighted
   */
  isHighlighted(element: HTMLElement): boolean {
    for (const instance of this.state.activeHighlights.values()) {
      if (instance.element === element) {
        return true;
      }
    }
    return false;
  }

  /**
   * Destroy the highlight system
   */
  destroy(): void {
    this.clearAll();
    this.styleElement?.remove();
    this.styleElement = null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(): string {
    return `${CSS_PREFIX}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private injectStyles(): void {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = `${CSS_PREFIX}-styles`;
    this.styleElement.textContent = `
      /* Dim overlay */
      .${CSS_PREFIX}-dim {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 9998;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .${CSS_PREFIX}-dim.hidden {
        opacity: 0;
      }

      /* Spotlight glow */
      .${CSS_PREFIX}-spotlight {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .${CSS_PREFIX}-spotlight.glow {
        box-shadow: 0 0 0 4px var(--highlight-color, #3B82F6),
                    0 0 20px 10px var(--highlight-color, #3B82F6);
      }

      .${CSS_PREFIX}-spotlight.outline {
        border: 3px solid var(--highlight-color, #3B82F6);
        box-shadow: 0 0 10px var(--highlight-color, #3B82F6);
      }

      .${CSS_PREFIX}-spotlight.pulse {
        animation: ${CSS_PREFIX}-pulse-anim 1.5s ease-in-out infinite;
      }

      @keyframes ${CSS_PREFIX}-pulse-anim {
        0%, 100% {
          box-shadow: 0 0 0 4px var(--highlight-color, #3B82F6),
                      0 0 20px 10px rgba(59, 130, 246, 0.5);
        }
        50% {
          box-shadow: 0 0 0 6px var(--highlight-color, #3B82F6),
                      0 0 40px 20px rgba(59, 130, 246, 0.8);
        }
      }

      /* Pointing arrow */
      .${CSS_PREFIX}-arrow {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        width: 60px;
        height: 40px;
        animation: ${CSS_PREFIX}-bounce 0.6s ease-in-out infinite;
      }

      .${CSS_PREFIX}-arrow svg {
        width: 100%;
        height: 100%;
        fill: var(--highlight-color, #3B82F6);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      @keyframes ${CSS_PREFIX}-bounce {
        0%, 100% {
          transform: translateX(0);
        }
        50% {
          transform: translateX(10px);
        }
      }

      /* Pulse ring */
      .${CSS_PREFIX}-ring {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        border-radius: 8px;
        border: 2px solid var(--highlight-color, #3B82F6);
        animation: ${CSS_PREFIX}-ring-expand 1s ease-out infinite;
      }

      @keyframes ${CSS_PREFIX}-ring-expand {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(1.3);
        }
      }

      /* Ensure highlighted elements stay above dim overlay */
      .${CSS_PREFIX}-elevated {
        position: relative;
        z-index: 9999;
      }
    `;

    document.head.appendChild(this.styleElement);
  }

  private dimBackground(dim: boolean): void {
    let dimElement = document.querySelector(`.${CSS_PREFIX}-dim`);

    if (dim) {
      if (!dimElement) {
        dimElement = document.createElement('div');
        dimElement.className = `${CSS_PREFIX}-dim`;
        document.body.appendChild(dimElement);
      }
      dimElement.classList.remove('hidden');
      this.state.isDimmed = true;
    } else {
      if (dimElement) {
        dimElement.classList.add('hidden');
        setTimeout(() => dimElement?.remove(), 300);
      }
      this.state.isDimmed = false;
    }
  }

  private createOverlay(element: HTMLElement, options: SpotlightOptions): HTMLDivElement {
    const rect = element.getBoundingClientRect();
    const padding = 4;

    const overlay = document.createElement('div');
    overlay.className = `${CSS_PREFIX}-spotlight ${options.style}`;

    if (options.pulseAnimation) {
      overlay.classList.add('pulse');
    }

    overlay.style.setProperty('--highlight-color', options.color || '#3B82F6');
    overlay.style.left = `${rect.left - padding}px`;
    overlay.style.top = `${rect.top - padding}px`;
    overlay.style.width = `${rect.width + padding * 2}px`;
    overlay.style.height = `${rect.height + padding * 2}px`;

    // Elevate the original element
    element.classList.add(`${CSS_PREFIX}-elevated`);

    return overlay;
  }

  private createArrow(element: HTMLElement): HTMLDivElement {
    const rect = element.getBoundingClientRect();

    const arrow = document.createElement('div');
    arrow.className = `${CSS_PREFIX}-arrow`;

    // Position arrow to the left of the element
    arrow.style.left = `${rect.left - 70}px`;
    arrow.style.top = `${rect.top + rect.height / 2 - 20}px`;

    arrow.innerHTML = `
      <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 20 L40 20 L40 10 L60 20 L40 30 L40 20" />
      </svg>
    `;

    return arrow;
  }

  private createPulseRing(element: HTMLElement): HTMLDivElement {
    const rect = element.getBoundingClientRect();
    const padding = 8;

    const ring = document.createElement('div');
    ring.className = `${CSS_PREFIX}-ring`;

    ring.style.left = `${rect.left - padding}px`;
    ring.style.top = `${rect.top - padding}px`;
    ring.style.width = `${rect.width + padding * 2}px`;
    ring.style.height = `${rect.height + padding * 2}px`;

    return ring;
  }

  private observeElement(
    element: HTMLElement,
    overlay: HTMLElement,
    isArrow: boolean = false
  ): ResizeObserver {
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      const padding = isArrow ? 0 : 4;

      if (isArrow) {
        overlay.style.left = `${rect.left - 70}px`;
        overlay.style.top = `${rect.top + rect.height / 2 - 20}px`;
      } else {
        overlay.style.left = `${rect.left - padding}px`;
        overlay.style.top = `${rect.top - padding}px`;
        overlay.style.width = `${rect.width + padding * 2}px`;
        overlay.style.height = `${rect.height + padding * 2}px`;
      }
    };

    // Update on resize
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);

    // Update on scroll
    const scrollHandler = () => updatePosition();
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Extend cleanup to remove scroll listener
    const originalDisconnect = observer.disconnect.bind(observer);
    observer.disconnect = () => {
      originalDisconnect();
      window.removeEventListener('scroll', scrollHandler);
      element.classList.remove(`${CSS_PREFIX}-elevated`);
    };

    return observer;
  }
}

// Singleton instance
export const highlightSystem = HighlightSystem.getInstance();

// Convenience functions
export function spotlight(element: HTMLElement, options?: Partial<SpotlightOptions>): string {
  return highlightSystem.spotlight(element, options);
}

export function scrollTo(element: HTMLElement, options?: Partial<ScrollOptions>): Promise<void> {
  return highlightSystem.scrollTo(element, options);
}

export function pointTo(element: HTMLElement, duration?: number): string {
  return highlightSystem.pointTo(element, duration);
}

export function pulse(element: HTMLElement, duration?: number): string {
  return highlightSystem.pulse(element, duration);
}

export function scrollAndHighlight(
  element: HTMLElement,
  scrollOptions?: Partial<ScrollOptions>,
  highlightOptions?: Partial<SpotlightOptions>
): Promise<string> {
  return highlightSystem.scrollAndHighlight(element, scrollOptions, highlightOptions);
}

export function clearHighlights(): void {
  highlightSystem.clearAll();
}
