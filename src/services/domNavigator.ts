import type {
  DOMSelectors,
  DOMElementInfo,
  PageStructure,
  NavigationTarget,
  NavigationConfig,
  DocumentationContent,
} from '../types/widget';

// Default selectors for common website structures
const defaultSelectors: Required<DOMSelectors> = {
  contentSelector: 'main, [role="main"], article, .content, #content',
  navSelector: 'nav, [role="navigation"], .nav, .navbar, .sidebar',
  headingSelectors: ['h1', 'h2', 'h3', 'h4'],
  sectionSelector: 'section, [role="region"], .section, [data-section]',
  ignoreSelectors: [
    'script', 'style', 'noscript', 'iframe', 'svg',
    '[aria-hidden="true"]', '.hidden', '[hidden]',
    '.voicedocs-widget', // Don't index our own widget
  ],
};

/**
 * DOM Navigator - Reads and navigates website DOM
 */
export class DOMNavigator {
  private selectors: Required<DOMSelectors>;
  private config: NavigationConfig;
  private pageStructure: PageStructure | null = null;
  private elementCache: Map<string, HTMLElement> = new Map();

  constructor(
    selectors: DOMSelectors = {},
    config: NavigationConfig = {}
  ) {
    this.selectors = { ...defaultSelectors, ...selectors };
    this.config = config;
  }

  /**
   * Analyze the current page structure
   */
  analyzePage(): PageStructure {
    const structure: PageStructure = {
      title: document.title,
      url: window.location.href,
      headings: this.findHeadings(),
      sections: this.findSections(),
      links: this.findNavigableLinks(),
      navItems: this.findNavItems(),
    };

    this.pageStructure = structure;
    return structure;
  }

  /**
   * Extract content from the page for AI context
   */
  extractPageContent(): DocumentationContent[] {
    const contents: DocumentationContent[] = [];
    const contentArea = this.findContentArea();

    if (!contentArea) {
      // Fallback to body
      contents.push({
        id: 'page-content',
        title: document.title,
        content: this.getTextContent(document.body),
        type: 'page',
        url: window.location.href,
      });
      return contents;
    }

    // Extract main content
    contents.push({
      id: 'main-content',
      title: document.title,
      content: this.getTextContent(contentArea),
      type: 'page',
      url: window.location.href,
    });

    // Extract individual sections
    const sections = contentArea.querySelectorAll(this.selectors.sectionSelector);
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
      const title = heading?.textContent?.trim() || `Section ${index + 1}`;
      const id = section.id || `section-${index}`;

      contents.push({
        id,
        title,
        content: this.getTextContent(section),
        type: 'section',
        elementId: section.id || undefined,
        url: section.id ? `${window.location.pathname}#${section.id}` : undefined,
      });
    });

    // Extract headings as navigable points
    this.selectors.headingSelectors.forEach(selector => {
      const headings = document.querySelectorAll(selector);
      headings.forEach((heading, index) => {
        const id = heading.id || `heading-${selector}-${index}`;
        contents.push({
          id,
          title: heading.textContent?.trim() || '',
          content: this.getSurroundingContent(heading as HTMLElement),
          type: 'section',
          elementId: heading.id || undefined,
        });
      });
    });

    return contents;
  }

  /**
   * Navigate to a target on the page
   */
  async navigateTo(target: NavigationTarget): Promise<boolean> {
    // Use custom navigation if provided
    if (this.config.customNavigate) {
      return this.config.customNavigate(target);
    }

    try {
      switch (target.type) {
        case 'element':
          return this.scrollToElement(target.target);

        case 'section':
          return this.scrollToSection(target.target);

        case 'url':
          return this.navigateToUrl(target.target);

        case 'page':
          return this.navigateToPage(target.target);

        default:
          return false;
      }
    } finally {
      this.config.onNavigate?.(target);
    }
  }

  /**
   * Scroll to an element by ID or selector
   */
  scrollToElement(idOrSelector: string): boolean {
    if (!this.config.enableScrollTo) return false;

    let element = this.elementCache.get(idOrSelector);

    if (!element) {
      element = document.getElementById(idOrSelector) ||
                document.querySelector(idOrSelector) as HTMLElement;

      if (element) {
        this.elementCache.set(idOrSelector, element);
      }
    }

    if (!element) return false;

    const offset = this.config.scrollOffset || 0;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: this.config.smoothScroll ? 'smooth' : 'auto',
    });

    // Focus the element for accessibility
    element.focus({ preventScroll: true });

    return true;
  }

  /**
   * Scroll to a section by name (fuzzy match)
   */
  scrollToSection(sectionName: string): boolean {
    const normalizedName = sectionName.toLowerCase().trim();

    // First, try exact ID match
    if (this.scrollToElement(normalizedName)) return true;

    // Try to find by heading text
    const allHeadings = document.querySelectorAll(
      this.selectors.headingSelectors.join(', ')
    );

    for (const heading of allHeadings) {
      const headingText = heading.textContent?.toLowerCase().trim() || '';

      if (headingText === normalizedName || headingText.includes(normalizedName)) {
        // Find the section containing this heading
        const section = heading.closest('section') || heading.parentElement;
        const targetId = heading.id || section?.id;

        if (targetId) {
          return this.scrollToElement(targetId);
        }

        // Scroll to the heading itself
        const offset = this.config.scrollOffset || 0;
        const rect = heading.getBoundingClientRect();
        window.scrollTo({
          top: rect.top + window.scrollY - offset,
          behavior: this.config.smoothScroll ? 'smooth' : 'auto',
        });
        return true;
      }
    }

    // Try nav items
    const navItems = document.querySelectorAll(`${this.selectors.navSelector} a`);
    for (const item of navItems) {
      const text = item.textContent?.toLowerCase().trim() || '';
      if (text === normalizedName || text.includes(normalizedName)) {
        const href = (item as HTMLAnchorElement).getAttribute('href');
        if (href?.startsWith('#')) {
          return this.scrollToElement(href.slice(1));
        }
        (item as HTMLAnchorElement).click();
        return true;
      }
    }

    return false;
  }

  /**
   * Navigate to a URL
   */
  navigateToUrl(url: string): boolean {
    if (!this.config.enablePageNavigation) return false;

    try {
      // Handle hash links
      if (url.startsWith('#')) {
        return this.scrollToElement(url.slice(1));
      }

      // Handle relative URLs
      if (url.startsWith('/') || !url.includes('://')) {
        window.location.href = new URL(url, window.location.origin).href;
        return true;
      }

      // Handle absolute URLs (same origin)
      const urlObj = new URL(url);
      if (urlObj.origin === window.location.origin) {
        window.location.href = url;
        return true;
      }

      // External URLs - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to a page by name (fuzzy match)
   */
  navigateToPage(pageName: string): boolean {
    const normalizedName = pageName.toLowerCase().trim();

    // Look for matching nav links
    const navLinks = document.querySelectorAll('a[href]');

    for (const link of navLinks) {
      const text = link.textContent?.toLowerCase().trim() || '';
      const href = (link as HTMLAnchorElement).getAttribute('href') || '';

      if (
        text === normalizedName ||
        text.includes(normalizedName) ||
        href.toLowerCase().includes(normalizedName)
      ) {
        (link as HTMLAnchorElement).click();
        return true;
      }
    }

    return false;
  }

  /**
   * Find all navigable headings
   */
  private findHeadings(): DOMElementInfo[] {
    const headings: DOMElementInfo[] = [];
    const selector = this.selectors.headingSelectors.join(', ');

    document.querySelectorAll(selector).forEach((el, index) => {
      if (this.shouldIgnore(el)) return;

      const id = el.id || `heading-${index}`;
      headings.push({
        id,
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        type: 'heading',
        selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
        rect: el.getBoundingClientRect(),
      });
    });

    return headings;
  }

  /**
   * Find all sections
   */
  private findSections(): DOMElementInfo[] {
    const sections: DOMElementInfo[] = [];

    document.querySelectorAll(this.selectors.sectionSelector).forEach((el, index) => {
      if (this.shouldIgnore(el)) return;

      const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
      const id = el.id || `section-${index}`;

      sections.push({
        id,
        tagName: el.tagName.toLowerCase(),
        text: heading?.textContent?.trim() || `Section ${index + 1}`,
        type: 'section',
        selector: el.id ? `#${el.id}` : `.section:nth-of-type(${index + 1})`,
        rect: el.getBoundingClientRect(),
      });
    });

    return sections;
  }

  /**
   * Find all navigable links
   */
  private findNavigableLinks(): DOMElementInfo[] {
    const links: DOMElementInfo[] = [];

    document.querySelectorAll('a[href]').forEach((el, index) => {
      if (this.shouldIgnore(el)) return;

      const href = (el as HTMLAnchorElement).getAttribute('href') || '';
      if (!href || href === '#') return;

      links.push({
        id: el.id || `link-${index}`,
        tagName: 'a',
        text: el.textContent?.trim() || href,
        type: 'link',
        selector: el.id ? `#${el.id}` : `a[href="${href}"]`,
      });
    });

    return links;
  }

  /**
   * Find navigation items
   */
  private findNavItems(): DOMElementInfo[] {
    const items: DOMElementInfo[] = [];

    document.querySelectorAll(`${this.selectors.navSelector} a, ${this.selectors.navSelector} button`).forEach((el, index) => {
      if (this.shouldIgnore(el)) return;

      items.push({
        id: el.id || `nav-item-${index}`,
        tagName: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        type: 'nav-item',
        selector: el.id ? `#${el.id}` : `nav a:nth-of-type(${index + 1})`,
      });
    });

    return items;
  }

  /**
   * Find the main content area
   */
  private findContentArea(): Element | null {
    const selectors = this.selectors.contentSelector.split(',').map(s => s.trim());

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && !this.shouldIgnore(el)) return el;
    }

    return null;
  }

  /**
   * Get text content, ignoring certain elements
   */
  private getTextContent(element: Element): string {
    const clone = element.cloneNode(true) as Element;

    // Remove ignored elements
    this.selectors.ignoreSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    return clone.textContent?.trim().replace(/\s+/g, ' ') || '';
  }

  /**
   * Get content surrounding a heading
   */
  private getSurroundingContent(heading: HTMLElement): string {
    const content: string[] = [];

    // Get the heading text
    content.push(heading.textContent?.trim() || '');

    // Get following siblings until next heading
    let sibling = heading.nextElementSibling;
    while (sibling && !sibling.matches('h1, h2, h3, h4, h5, h6')) {
      const text = this.getTextContent(sibling);
      if (text) content.push(text);
      sibling = sibling.nextElementSibling;
    }

    return content.join('\n\n');
  }

  /**
   * Check if element should be ignored
   */
  private shouldIgnore(element: Element): boolean {
    return this.selectors.ignoreSelectors.some(selector =>
      element.matches(selector) || element.closest(selector)
    );
  }

  /**
   * Get available navigation targets for voice commands
   */
  getAvailableTargets(): string[] {
    if (!this.pageStructure) {
      this.analyzePage();
    }

    const targets: string[] = [];

    this.pageStructure?.headings.forEach(h => {
      if (h.text) targets.push(h.text);
    });

    this.pageStructure?.sections.forEach(s => {
      if (s.text) targets.push(s.text);
    });

    this.pageStructure?.navItems.forEach(n => {
      if (n.text) targets.push(n.text);
    });

    return [...new Set(targets)];
  }

  /**
   * Find best match for a navigation query
   */
  findBestMatch(query: string): NavigationTarget | null {
    const normalizedQuery = query.toLowerCase().trim();

    if (!this.pageStructure) {
      this.analyzePage();
    }

    // Check headings
    for (const heading of this.pageStructure?.headings || []) {
      if (heading.text.toLowerCase().includes(normalizedQuery)) {
        return {
          type: 'element',
          target: heading.selector,
          label: heading.text,
        };
      }
    }

    // Check sections
    for (const section of this.pageStructure?.sections || []) {
      if (section.text.toLowerCase().includes(normalizedQuery)) {
        return {
          type: 'section',
          target: section.id,
          label: section.text,
        };
      }
    }

    // Check nav items
    for (const item of this.pageStructure?.navItems || []) {
      if (item.text.toLowerCase().includes(normalizedQuery)) {
        return {
          type: 'page',
          target: item.text,
          label: item.text,
        };
      }
    }

    return null;
  }

  /**
   * Highlight an element temporarily
   */
  highlightElement(selector: string, duration = 2000): void {
    const element = document.querySelector(selector);
    if (!element) return;

    const originalOutline = (element as HTMLElement).style.outline;
    const originalTransition = (element as HTMLElement).style.transition;

    (element as HTMLElement).style.transition = 'outline 0.3s ease';
    (element as HTMLElement).style.outline = '3px solid #6366f1';

    setTimeout(() => {
      (element as HTMLElement).style.outline = originalOutline;
      (element as HTMLElement).style.transition = originalTransition;
    }, duration);
  }
}

// ============================================================================
// Voice Stocks Extensions
// ============================================================================

import type {
  PageMap,
  Section as VSSection,
  NavItem as VSNavItem,
  ButtonInfo,
  FormInfo,
  FormFieldInfo,
  MediaInfo,
  LandmarkInfo,
  ElementContext,
} from '../types/voiceStocks';

/**
 * Extended DOM Navigator with Voice Stocks capabilities
 */
export class VoiceStocksDOMNavigator extends DOMNavigator {
  private vsPageMap: PageMap | null = null;
  private vsIdCounter = 0;
  private mutationObserver: MutationObserver | null = null;

  constructor(selectors?: DOMSelectors, config?: NavigationConfig) {
    super(selectors, config);
    this.setupMutationObserver();
  }

  /**
   * Generate a Voice Stocks PageMap with comprehensive element mapping
   */
  generatePageMap(root: HTMLElement = document.body): PageMap {
    this.vsPageMap = {
      sections: this.scanVSSections(root),
      navigation: this.scanVSNavigation(root),
      buttons: this.scanVSButtons(root),
      forms: this.scanVSForms(root),
      media: this.scanVSMedia(root),
      landmarks: this.scanVSLandmarks(root),
      lastUpdated: Date.now(),
    };

    return this.vsPageMap;
  }

  /**
   * Get the current PageMap, regenerating if stale
   */
  getVSPageMap(): PageMap {
    if (!this.vsPageMap || Date.now() - this.vsPageMap.lastUpdated > 5000) {
      return this.generatePageMap();
    }
    return this.vsPageMap;
  }

  /**
   * Find element by semantic description with AI-friendly matching
   */
  findElementByDescription(description: string): HTMLElement | null {
    const map = this.getVSPageMap();
    const descLower = description.toLowerCase();

    // Build searchable items from all element types
    const searchables: Array<{ element: HTMLElement; text: string; score: number }> = [];

    map.sections.forEach((s) => {
      const text = `${s.title} ${s.description || ''}`.toLowerCase();
      searchables.push({ element: s.element, text, score: this.matchScore(descLower, text) });
    });

    map.navigation.forEach((n) => {
      searchables.push({ element: n.element, text: n.text.toLowerCase(), score: this.matchScore(descLower, n.text.toLowerCase()) });
    });

    map.buttons.forEach((b) => {
      const text = `${b.text} ${b.ariaLabel || ''}`.toLowerCase();
      searchables.push({ element: b.element, text, score: this.matchScore(descLower, text) });
    });

    map.landmarks.forEach((l) => {
      const text = `${l.role} ${l.label || ''}`.toLowerCase();
      searchables.push({ element: l.element, text, score: this.matchScore(descLower, text) });
    });

    // Sort by score and return best match
    searchables.sort((a, b) => b.score - a.score);

    if (searchables.length > 0 && searchables[0].score > 0.3) {
      return searchables[0].element;
    }

    // Fallback to CSS selector or ID
    try {
      const bySelector = document.querySelector(description);
      if (bySelector instanceof HTMLElement) return bySelector;
    } catch {
      // Invalid selector
    }

    const byId = document.getElementById(description);
    if (byId) return byId;

    return null;
  }

  /**
   * Get detailed context about what an element does
   */
  getElementContext(element: HTMLElement): ElementContext {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role') || this.inferElementRole(element);
    const ariaLabel = element.getAttribute('aria-label');
    const text = element.textContent?.trim().substring(0, 100) || '';

    let purpose = ariaLabel || '';
    let interactionHint = '';

    switch (tagName) {
      case 'a':
        purpose = purpose || `Link to ${(element as HTMLAnchorElement).href || 'another page'}`;
        interactionHint = 'Click to navigate';
        break;
      case 'button':
        purpose = purpose || text || 'Interactive button';
        interactionHint = 'Click to activate';
        break;
      case 'input':
        purpose = purpose || this.inferInputPurpose(element as HTMLInputElement);
        interactionHint = 'Enter information';
        break;
      case 'form':
        purpose = purpose || 'Form for submitting information';
        interactionHint = 'Fill out and submit';
        break;
      case 'nav':
        purpose = purpose || 'Navigation menu';
        interactionHint = 'Browse available links';
        break;
      case 'section':
      case 'article':
      case 'div':
        purpose = purpose || this.inferSectionPurpose(element);
        interactionHint = 'Read content';
        break;
      default:
        purpose = purpose || role || `${tagName} element`;
        interactionHint = 'Interact with element';
    }

    return {
      element,
      purpose,
      interactionHint,
      relatedElements: this.findRelatedElementIds(element),
      path: this.buildCssPath(element),
    };
  }

  /**
   * Find elements matching a capability (project-search, contact, navigate, etc.)
   */
  findElementsForCapability(capability: string): HTMLElement[] {
    const map = this.getVSPageMap();
    const capLower = capability.toLowerCase();
    const results: HTMLElement[] = [];

    const matchers: Record<string, (map: PageMap) => HTMLElement[]> = {
      contact: (m) => {
        const section = m.sections.find((s) =>
          s.title.toLowerCase().includes('contact') || s.id.toLowerCase().includes('contact')
        );
        const form = m.forms.find((f) =>
          f.name?.toLowerCase().includes('contact') || f.element.id.toLowerCase().includes('contact')
        );
        return [section?.element, form?.element].filter((e): e is HTMLElement => !!e);
      },
      projects: (m) =>
        m.sections
          .filter((s) =>
            ['project', 'portfolio', 'work'].some((k) =>
              s.title.toLowerCase().includes(k) || s.id.toLowerCase().includes(k)
            )
          )
          .map((s) => s.element),
      about: (m) =>
        m.sections
          .filter((s) =>
            ['about', 'bio', 'introduction'].some((k) =>
              s.title.toLowerCase().includes(k) || s.id.toLowerCase().includes(k)
            )
          )
          .map((s) => s.element),
      skills: (m) =>
        m.sections
          .filter((s) =>
            ['skill', 'expertise', 'technologies', 'tech stack'].some((k) =>
              s.title.toLowerCase().includes(k) || s.id.toLowerCase().includes(k)
            )
          )
          .map((s) => s.element),
      navigation: (m) => m.navigation.map((n) => n.element),
    };

    for (const [key, finder] of Object.entries(matchers)) {
      if (capLower.includes(key)) {
        results.push(...finder(map));
      }
    }

    if (results.length === 0) {
      const element = this.findElementByDescription(capability);
      if (element) results.push(element);
    }

    return results;
  }

  /**
   * Invalidate the Voice Stocks page map cache
   */
  invalidateVSCache(): void {
    this.vsPageMap = null;
  }

  /**
   * Clean up resources
   */
  destroyVS(): void {
    this.mutationObserver?.disconnect();
    this.vsPageMap = null;
  }

  // ============================================================================
  // Private Scanning Methods
  // ============================================================================

  private scanVSSections(root: HTMLElement): VSSection[] {
    const sections: VSSection[] = [];
    const seen = new Set<HTMLElement>();

    // Semantic sections
    root.querySelectorAll('section, article, main, aside, header, footer, [role="region"]').forEach((el) => {
      if (el instanceof HTMLElement && !seen.has(el)) {
        seen.add(el);
        sections.push(this.createVSSection(el));
      }
    });

    // Sections by ID (common portfolio pattern)
    root.querySelectorAll('[id]').forEach((el) => {
      if (el instanceof HTMLElement && !seen.has(el) && this.isLikelySection(el)) {
        seen.add(el);
        sections.push(this.createVSSection(el));
      }
    });

    return sections;
  }

  private scanVSNavigation(root: HTMLElement): VSNavItem[] {
    const items: VSNavItem[] = [];

    root.querySelectorAll('nav a, [role="navigation"] a, header a').forEach((el) => {
      if (el instanceof HTMLAnchorElement) {
        const href = el.getAttribute('href') || '';
        items.push({
          id: this.generateVSId('nav'),
          element: el,
          text: el.textContent?.trim() || el.getAttribute('aria-label') || 'Link',
          href: href || undefined,
          isExternal: href.startsWith('http') && !href.includes(window.location.hostname),
          isActive: el.classList.contains('active') || el.getAttribute('aria-current') === 'page',
        });
      }
    });

    return items;
  }

  private scanVSButtons(root: HTMLElement): ButtonInfo[] {
    const buttons: ButtonInfo[] = [];

    root.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach((el) => {
      if (el instanceof HTMLElement) {
        const isInput = el instanceof HTMLInputElement;
        buttons.push({
          id: this.generateVSId('btn'),
          element: el,
          text: isInput ? (el as HTMLInputElement).value : el.textContent?.trim() || '',
          ariaLabel: el.getAttribute('aria-label') || undefined,
          type: this.getButtonType(el),
          isDisabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
        });
      }
    });

    return buttons;
  }

  private scanVSForms(root: HTMLElement): FormInfo[] {
    const forms: FormInfo[] = [];

    root.querySelectorAll('form').forEach((form) => {
      if (form instanceof HTMLFormElement) {
        const fields: FormFieldInfo[] = [];

        form.querySelectorAll('input, textarea, select').forEach((input) => {
          if (input instanceof HTMLElement) {
            const inputEl = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            let label: string | undefined;

            if (input.id) {
              const labelEl = form.querySelector(`label[for="${input.id}"]`);
              label = labelEl?.textContent?.trim();
            }

            const placeholder = 'placeholder' in inputEl ? inputEl.placeholder : undefined;

            fields.push({
              id: input.id || inputEl.name || this.generateVSId('field'),
              element: input,
              name: inputEl.name || input.id || '',
              type: input.tagName.toLowerCase() === 'input' ? (input as HTMLInputElement).type : input.tagName.toLowerCase(),
              label,
              placeholder: placeholder || undefined,
              isRequired: inputEl.required || input.getAttribute('aria-required') === 'true',
            });
          }
        });

        forms.push({
          id: this.generateVSId('form'),
          element: form,
          name: form.name || form.id || undefined,
          action: form.action || undefined,
          fields,
        });
      }
    });

    return forms;
  }

  private scanVSMedia(root: HTMLElement): MediaInfo[] {
    const media: MediaInfo[] = [];

    root.querySelectorAll('img, video, audio, iframe').forEach((el) => {
      if (el instanceof HTMLElement) {
        const tagName = el.tagName.toLowerCase();
        let type: MediaInfo['type'] = 'image';
        if (tagName === 'video') type = 'video';
        else if (tagName === 'audio') type = 'audio';
        else if (tagName === 'iframe') type = 'iframe';

        media.push({
          id: this.generateVSId('media'),
          element: el,
          type,
          src: (el as HTMLImageElement).src || undefined,
          alt: (el as HTMLImageElement).alt || undefined,
          title: el.title || undefined,
        });
      }
    });

    return media;
  }

  private scanVSLandmarks(root: HTMLElement): LandmarkInfo[] {
    const landmarks: LandmarkInfo[] = [];
    const roles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search', 'form', 'region'];

    roles.forEach((role) => {
      root.querySelectorAll(`[role="${role}"]`).forEach((el) => {
        if (el instanceof HTMLElement) {
          landmarks.push({
            id: this.generateVSId('landmark'),
            element: el,
            role,
            label: el.getAttribute('aria-label') || undefined,
          });
        }
      });
    });

    // Semantic HTML5 elements
    const semanticMappings: Record<string, string> = {
      header: 'banner',
      nav: 'navigation',
      main: 'main',
      aside: 'complementary',
      footer: 'contentinfo',
    };

    Object.entries(semanticMappings).forEach(([tag, role]) => {
      root.querySelectorAll(tag).forEach((el) => {
        if (el instanceof HTMLElement && !el.hasAttribute('role') && !landmarks.some((l) => l.element === el)) {
          landmarks.push({
            id: this.generateVSId('landmark'),
            element: el,
            role,
            label: el.getAttribute('aria-label') || undefined,
          });
        }
      });
    });

    return landmarks;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createVSSection(el: HTMLElement): VSSection {
    const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
    const title = heading?.textContent?.trim() || el.getAttribute('aria-label') || el.id || el.tagName.toLowerCase();

    return {
      id: el.id || this.generateVSId('section'),
      element: el,
      title,
      description: el.getAttribute('aria-description') || undefined,
      boundingRect: el.getBoundingClientRect(),
      children: Array.from(el.children).filter((c) => c.id).map((c) => c.id),
      level: heading ? parseInt(heading.tagName[1]) : 0,
    };
  }

  private generateVSId(prefix: string): string {
    return `vs-${prefix}-${++this.vsIdCounter}`;
  }

  private matchScore(query: string, text: string): number {
    if (!query || !text) return 0;
    if (text.includes(query)) return 1;

    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    let matched = 0;

    queryWords.forEach((qw) => {
      if (textWords.some((tw) => tw.includes(qw) || qw.includes(tw))) matched++;
    });

    return matched / queryWords.length;
  }

  private inferElementRole(el: HTMLElement): string {
    const roleMap: Record<string, string> = {
      button: 'button',
      a: 'link',
      input: 'textbox',
      nav: 'navigation',
      main: 'main',
      header: 'banner',
      footer: 'contentinfo',
    };
    return roleMap[el.tagName.toLowerCase()] || 'generic';
  }

  private inferInputPurpose(input: HTMLInputElement): string {
    const type = input.type;
    const name = input.name?.toLowerCase() || '';

    if (type === 'email' || name.includes('email')) return 'Email input';
    if (type === 'password') return 'Password input';
    if (type === 'tel' || name.includes('phone')) return 'Phone input';
    if (name.includes('name')) return 'Name input';
    if (type === 'search') return 'Search input';

    return `${type || 'text'} input`;
  }

  private inferSectionPurpose(el: HTMLElement): string {
    const id = el.id?.toLowerCase() || '';
    const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';

    if (id.includes('hero') || className.includes('hero')) return 'Hero section';
    if (id.includes('about') || className.includes('about')) return 'About section';
    if (id.includes('project') || className.includes('project')) return 'Projects section';
    if (id.includes('skill') || className.includes('skill')) return 'Skills section';
    if (id.includes('contact') || className.includes('contact')) return 'Contact section';

    return 'Content section';
  }

  private findRelatedElementIds(el: HTMLElement): string[] {
    const related: string[] = [];
    ['aria-labelledby', 'aria-describedby', 'aria-controls'].forEach((attr) => {
      const value = el.getAttribute(attr);
      if (value) related.push(...value.split(' '));
    });
    return related.filter((id) => document.getElementById(id));
  }

  private buildCssPath(el: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = el;

    while (current && current !== document.body) {
      const selector = current.tagName.toLowerCase();
      if (current.id) {
        path.unshift(`#${current.id}`);
        break;
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  private getButtonType(el: HTMLElement): ButtonInfo['type'] {
    if (el.tagName.toLowerCase() === 'a') return 'link';
    const type = (el as HTMLButtonElement).type;
    if (type === 'submit') return 'submit';
    if (type === 'reset') return 'reset';
    return 'button';
  }

  private isLikelySection(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    if (rect.height < 100 || rect.width < 200) return false;

    const text = el.textContent?.trim() || '';
    if (text.length < 50) return false;

    const id = el.id.toLowerCase();
    const keywords = ['hero', 'about', 'project', 'skill', 'experience', 'education', 'contact', 'portfolio', 'work', 'service'];
    return keywords.some((kw) => id.includes(kw));
  }

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(() => {
      this.invalidateVSCache();
    });

    if (typeof document !== 'undefined' && document.body) {
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id', 'class', 'aria-label', 'role'],
      });
    }
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

let navigatorInstance: DOMNavigator | null = null;
let vsNavigatorInstance: VoiceStocksDOMNavigator | null = null;

export function getDOMNavigator(
  selectors?: DOMSelectors,
  config?: NavigationConfig
): DOMNavigator {
  if (!navigatorInstance) {
    navigatorInstance = new DOMNavigator(selectors, config);
  }
  return navigatorInstance;
}

export function getVoiceStocksDOMNavigator(
  selectors?: DOMSelectors,
  config?: NavigationConfig
): VoiceStocksDOMNavigator {
  if (!vsNavigatorInstance) {
    vsNavigatorInstance = new VoiceStocksDOMNavigator(selectors, config);
  }
  return vsNavigatorInstance;
}

export function resetDOMNavigator(): void {
  navigatorInstance = null;
  vsNavigatorInstance?.destroyVS();
  vsNavigatorInstance = null;
}
