/**
 * Browser AI Service
 *
 * Integrates with Chrome's built-in Prompt API (Gemini Nano) for on-device AI processing.
 * Provides fallback strategies when browser AI is unavailable.
 *
 * Chrome Prompt API requires: chrome://flags/#prompt-api-for-gemini-nano
 */

import type {
  BrowserAICapabilities,
  AISession,
  PageInterpretation,
  InterpretedElement,
  VoiceStocksTrainingData,
  FAQ,
} from '../types/voiceStocks';

// Chrome Prompt API type declarations
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities?: () => Promise<{
          available: 'readily' | 'after-download' | 'no';
          defaultTopK?: number;
          maxTopK?: number;
          defaultTemperature?: number;
        }>;
        create?: (options?: {
          systemPrompt?: string;
          topK?: number;
          temperature?: number;
        }) => Promise<{
          prompt: (input: string) => Promise<string>;
          promptStreaming?: (input: string) => ReadableStream<string>;
          destroy: () => void;
        }>;
      };
    };
  }
}

export class BrowserAIService {
  private static instance: BrowserAIService;
  private capabilities: BrowserAICapabilities | null = null;
  private activeSession: AISession | null = null;
  private trainingData: VoiceStocksTrainingData | null = null;

  private constructor() {}

  static getInstance(): BrowserAIService {
    if (!BrowserAIService.instance) {
      BrowserAIService.instance = new BrowserAIService();
    }
    return BrowserAIService.instance;
  }

  /**
   * Initialize the service with training data
   */
  async initialize(trainingData?: VoiceStocksTrainingData): Promise<void> {
    if (trainingData) {
      this.trainingData = trainingData;
    }
    await this.checkCapabilities();
  }

  /**
   * Check if browser AI is available
   */
  async checkCapabilities(): Promise<BrowserAICapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    this.capabilities = {
      isAvailable: false,
      supportsPromptAPI: false,
      supportsStreaming: false,
    };

    try {
      if (window.ai?.languageModel?.capabilities) {
        const caps = await window.ai.languageModel.capabilities();

        this.capabilities = {
          isAvailable: caps.available === 'readily' || caps.available === 'after-download',
          supportsPromptAPI: true,
          supportsStreaming: true,
          maxTokens: caps.maxTopK,
        };

        console.log('[BrowserAI] Capabilities:', this.capabilities);
      }
    } catch (error) {
      console.warn('[BrowserAI] Chrome Prompt API not available:', error);
    }

    return this.capabilities;
  }

  /**
   * Check if browser AI is available
   */
  async isAvailable(): Promise<boolean> {
    const caps = await this.checkCapabilities();
    return caps.isAvailable;
  }

  /**
   * Create an AI session with a system prompt
   */
  async createSession(systemPrompt: string): Promise<AISession | null> {
    const caps = await this.checkCapabilities();

    if (!caps.isAvailable || !window.ai?.languageModel?.create) {
      console.warn('[BrowserAI] Cannot create session - API not available');
      return null;
    }

    try {
      const session = await window.ai.languageModel.create({
        systemPrompt,
        temperature: 0.7,
      });

      const aiSession: AISession = {
        id: `session-${Date.now()}`,
        systemPrompt,
        prompt: session.prompt.bind(session),
        promptStreaming: session.promptStreaming?.bind(session),
        destroy: session.destroy.bind(session),
      };

      this.activeSession = aiSession;
      return aiSession;
    } catch (error) {
      console.error('[BrowserAI] Failed to create session:', error);
      return null;
    }
  }

  /**
   * Get or create a session for Voice Stocks interactions
   */
  async getVoiceStocksSession(): Promise<AISession | null> {
    if (this.activeSession) {
      return this.activeSession;
    }

    const systemPrompt = this.buildSystemPrompt();
    return this.createSession(systemPrompt);
  }

  /**
   * Generate a response to a user question
   */
  async generateResponse(question: string, context?: string): Promise<string> {
    // First, try to match against training data FAQs
    const faqMatch = this.matchFAQ(question);
    if (faqMatch) {
      return faqMatch.answer;
    }

    // Try browser AI
    const session = await this.getVoiceStocksSession();
    if (session) {
      try {
        const prompt = context
          ? `Context: ${context}\n\nUser question: ${question}`
          : question;

        const response = await session.prompt(prompt);
        return response;
      } catch (error) {
        console.error('[BrowserAI] Generation failed:', error);
      }
    }

    // Fallback to pattern-based response
    return this.generateFallbackResponse(question);
  }

  /**
   * Interpret page HTML to understand its structure
   */
  async interpretPage(html: string): Promise<PageInterpretation> {
    const session = await this.createSession(
      `You are analyzing a webpage's HTML structure. Identify the main purpose of the page,
      key interactive elements, and their purposes. Be concise and practical.`
    );

    if (session) {
      try {
        // Truncate HTML if too long
        const truncatedHtml = html.length > 10000 ? html.substring(0, 10000) + '...' : html;

        const response = await session.prompt(
          `Analyze this HTML and identify:
          1. The main purpose of this page (1 sentence)
          2. Key interactive elements and what they do
          3. Suggested user actions

          HTML:
          ${truncatedHtml}`
        );

        session.destroy();
        return this.parseInterpretation(response);
      } catch (error) {
        console.error('[BrowserAI] Page interpretation failed:', error);
        session.destroy();
      }
    }

    // Fallback interpretation
    return this.createFallbackInterpretation(html);
  }

  /**
   * Match user intent to a page element
   */
  async matchIntentToElement(
    query: string,
    elements: Array<{ id: string; text: string; type: string }>
  ): Promise<string | null> {
    const session = await this.createSession(
      `You help users find elements on a webpage. Given a user's intent and a list of elements,
      return ONLY the ID of the best matching element, or "null" if no match.`
    );

    if (session) {
      try {
        const response = await session.prompt(
          `User wants to: "${query}"

          Available elements:
          ${elements.map((e) => `- ID: ${e.id}, Text: "${e.text}", Type: ${e.type}`).join('\n')}

          Return only the element ID (e.g., "nav-1") or "null":`
        );

        session.destroy();

        const match = response.trim().replace(/['"]/g, '');
        if (match && match !== 'null' && elements.some((e) => e.id === match)) {
          return match;
        }
      } catch (error) {
        console.error('[BrowserAI] Intent matching failed:', error);
        session.destroy();
      }
    }

    // Fallback: simple text matching
    return this.fallbackIntentMatch(query, elements);
  }

  /**
   * Destroy the active session
   */
  destroySession(): void {
    if (this.activeSession) {
      this.activeSession.destroy();
      this.activeSession = null;
    }
  }

  /**
   * Set training data
   */
  setTrainingData(data: VoiceStocksTrainingData): void {
    this.trainingData = data;
    // Recreate session with new training data
    this.destroySession();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildSystemPrompt(): string {
    const identity = this.trainingData?.identity;
    const basePrompt = identity
      ? `You are ${identity.name}, ${identity.role}. ${identity.personality}`
      : `You are a helpful voice assistant for this website.`;

    const context = this.trainingData?.knowledge?.facts
      ?.map((f) => `${f.topic}: ${Array.isArray(f.value) ? f.value.join(', ') : f.value}`)
      .join('\n');

    const capabilities = this.trainingData?.capabilities
      ?.map((c) => `- ${c.name}: ${c.description}`)
      .join('\n');

    return `${basePrompt}

${context ? `Key facts:\n${context}\n` : ''}
${capabilities ? `Your capabilities:\n${capabilities}\n` : ''}

Keep responses concise and conversational. When asked about navigation or finding things,
guide users to the relevant sections. Always be helpful and friendly.`;
  }

  private matchFAQ(question: string): FAQ | null {
    if (!this.trainingData?.knowledge?.faqs) return null;

    const qLower = question.toLowerCase();

    // Direct keyword match
    for (const faq of this.trainingData.knowledge.faqs) {
      const keywordMatch = faq.keywords.some((kw) => qLower.includes(kw.toLowerCase()));
      if (keywordMatch) return faq;

      // Question similarity
      const faqWords = faq.question.toLowerCase().split(/\s+/);
      const questionWords = qLower.split(/\s+/);
      const overlap = faqWords.filter((w) => questionWords.includes(w)).length;

      if (overlap >= 3 || overlap / faqWords.length > 0.5) {
        return faq;
      }
    }

    return null;
  }

  private generateFallbackResponse(question: string): string {
    const qLower = question.toLowerCase();
    const templates = this.trainingData?.templates;

    // Check for common intents
    if (qLower.includes('hello') || qLower.includes('hi ') || qLower.startsWith('hi')) {
      return templates?.greeting || "Hello! I'm here to help you navigate this site. What would you like to know?";
    }

    if (qLower.includes('bye') || qLower.includes('goodbye') || qLower.includes('thanks')) {
      return templates?.goodbye || "You're welcome! Feel free to ask if you have more questions.";
    }

    if (qLower.includes('help') || qLower.includes('what can you')) {
      const capabilities = this.trainingData?.capabilities
        ?.map((c) => c.description)
        .join(', ');
      return capabilities
        ? `I can help you with: ${capabilities}. Just ask!`
        : "I can help you navigate this website, answer questions about the content, and guide you through different sections.";
    }

    if (qLower.includes('contact') || qLower.includes('reach') || qLower.includes('email')) {
      return "You can find contact information in the Contact section. Would you like me to take you there?";
    }

    if (qLower.includes('project') || qLower.includes('work') || qLower.includes('portfolio')) {
      return "I can show you the Projects section where you can see all the work. Want me to navigate there?";
    }

    if (qLower.includes('about') || qLower.includes('who')) {
      return "The About section has all the details. Should I take you there?";
    }

    // Generic fallback
    return templates?.fallback ||
      "I'm not sure about that specific detail. Would you like me to help you navigate to a relevant section, or would you prefer to contact directly?";
  }

  private parseInterpretation(response: string): PageInterpretation {
    // Simple parsing of AI response
    const lines = response.split('\n').filter((l) => l.trim());

    return {
      summary: lines[0] || 'A webpage',
      mainPurpose: lines[0] || 'Unknown purpose',
      keyElements: this.extractElements(response),
      suggestedActions: this.extractActions(response),
    };
  }

  private extractElements(response: string): InterpretedElement[] {
    const elements: InterpretedElement[] = [];
    const elementPatterns = [
      /(?:button|link|form|input|nav|menu)/gi,
    ];

    elementPatterns.forEach((pattern) => {
      const matches = response.match(pattern);
      matches?.forEach((match) => {
        elements.push({
          selector: `[data-type="${match.toLowerCase()}"]`,
          purpose: `${match} element`,
          interactionType: match.toLowerCase().includes('button') ? 'click' : 'read',
          naturalDescription: `A ${match.toLowerCase()} on the page`,
        });
      });
    });

    return elements.slice(0, 5);
  }

  private extractActions(response: string): string[] {
    const actions: string[] = [];
    const actionPatterns = [
      /(?:click|navigate|scroll|fill|submit|read|view)/gi,
    ];

    actionPatterns.forEach((pattern) => {
      const matches = response.match(pattern);
      matches?.forEach((match) => {
        actions.push(`${match} the relevant element`);
      });
    });

    return [...new Set(actions)].slice(0, 3);
  }

  private createFallbackInterpretation(html: string): PageInterpretation {
    const hasNav = html.includes('<nav') || html.includes('navigation');
    const hasForm = html.includes('<form');
    const hasArticle = html.includes('<article') || html.includes('<section');

    const elements: InterpretedElement[] = [];

    if (hasNav) {
      elements.push({
        selector: 'nav',
        purpose: 'Site navigation',
        interactionType: 'click',
        naturalDescription: 'Navigation menu for the site',
      });
    }

    if (hasForm) {
      elements.push({
        selector: 'form',
        purpose: 'Input form',
        interactionType: 'input',
        naturalDescription: 'A form for user input',
      });
    }

    if (hasArticle) {
      elements.push({
        selector: 'article, section',
        purpose: 'Content section',
        interactionType: 'read',
        naturalDescription: 'Main content area',
      });
    }

    return {
      summary: 'A webpage with interactive elements',
      mainPurpose: 'Providing information and interaction',
      keyElements: elements,
      suggestedActions: ['Navigate using the menu', 'Read the main content', 'Interact with forms if present'],
    };
  }

  private fallbackIntentMatch(
    query: string,
    elements: Array<{ id: string; text: string; type: string }>
  ): string | null {
    const qLower = query.toLowerCase();

    // Common intent patterns
    const patterns: Record<string, string[]> = {
      contact: ['contact', 'email', 'reach', 'message', 'get in touch'],
      projects: ['project', 'work', 'portfolio', 'built', 'created'],
      about: ['about', 'who', 'bio', 'background', 'introduction'],
      skills: ['skill', 'technology', 'tech', 'expertise', 'stack'],
      home: ['home', 'start', 'beginning', 'top'],
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some((kw) => qLower.includes(kw))) {
        const match = elements.find(
          (e) =>
            e.text.toLowerCase().includes(category) ||
            e.id.toLowerCase().includes(category)
        );
        if (match) return match.id;
      }
    }

    // Direct text match
    for (const element of elements) {
      if (
        element.text.toLowerCase().includes(qLower) ||
        qLower.includes(element.text.toLowerCase())
      ) {
        return element.id;
      }
    }

    return null;
  }
}

export const browserAI = BrowserAIService.getInstance();
