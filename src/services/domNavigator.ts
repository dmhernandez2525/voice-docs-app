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

// Singleton instance for global use
let navigatorInstance: DOMNavigator | null = null;

export function getDOMNavigator(
  selectors?: DOMSelectors,
  config?: NavigationConfig
): DOMNavigator {
  if (!navigatorInstance) {
    navigatorInstance = new DOMNavigator(selectors, config);
  }
  return navigatorInstance;
}

export function resetDOMNavigator(): void {
  navigatorInstance = null;
}
