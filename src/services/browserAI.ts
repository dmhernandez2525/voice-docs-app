/**
 * Browser AI Service
 *
 * Uses Chrome's built-in Prompt API (Gemini Nano) for intelligent intent detection
 * and dynamic response generation. Falls back to keyword matching when unavailable.
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

// Intent types for voice command classification
export type IntentType =
  | 'navigation'
  | 'tour_start'
  | 'tour_next'
  | 'tour_previous'
  | 'tour_end'
  | 'tour_skip'
  | 'system_stop'
  | 'system_help'
  | 'system_repeat'
  | 'system_clear'
  | 'conversation'
  | 'unknown';

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  target?: string;
  originalText: string;
}

// Action types for response generation
export type ActionType =
  | 'navigate'
  | 'tour_start'
  | 'tour_step'
  | 'tour_end'
  | 'tour_next'
  | 'tour_previous'
  | 'error'
  | 'help'
  | 'stop'
  | 'clear';

export interface ActionContext {
  target?: string;
  section?: string;
  description?: string;
  error?: string;
  alreadyActive?: boolean;
  [key: string]: unknown;
}

// Chrome Prompt API type declarations
interface LanguageModelSession {
  prompt: (text: string, options?: { responseConstraint?: object; signal?: AbortSignal }) => Promise<string>;
  promptStreaming?: (input: string, options?: { signal?: AbortSignal }) => ReadableStream<string> | AsyncIterable<string>;
  destroy: () => void;
}

interface LanguageModelAPI {
  availability?: (options?: object) => Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
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
  }) => Promise<LanguageModelSession>;
}

declare global {
  interface Window {
    LanguageModel?: LanguageModelAPI;
    ai?: {
      languageModel?: LanguageModelAPI;
    };
  }
}

export class BrowserAIService {
  private static instance: BrowserAIService;
  private capabilities: BrowserAICapabilities | null = null;
  private activeSession: AISession | null = null;
  private intentSession: LanguageModelSession | null = null;
  private trainingData: VoiceStocksTrainingData | null = null;
  private initPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): BrowserAIService {
    if (!BrowserAIService.instance) {
      BrowserAIService.instance = new BrowserAIService();
    }
    return BrowserAIService.instance;
  }

  private getAPI(): LanguageModelAPI | null {
    if (typeof window === 'undefined') return null;
    return window.LanguageModel || window.ai?.languageModel || null;
  }

  /**
   * Initialize the service with optional training data
   */
  async initialize(trainingData?: VoiceStocksTrainingData): Promise<boolean> {
    if (trainingData) {
      this.trainingData = trainingData;
    }

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const available = await this.checkCapabilities();
      if (!available.isAvailable) return false;

      const api = this.getAPI();
      if (!api?.create) return false;

      try {
        this.intentSession = await api.create({
          temperature: 0.1,
          topK: 1,
          systemPrompt: this.getIntentSystemPrompt(),
        });
        return true;
      } catch {
        return false;
      }
    })();

    return this.initPromise;
  }

  private getIntentSystemPrompt(): string {
    return `You are an intent classifier for a voice-controlled documentation website.
Classify user input into one of these intents:

INTENTS:
- navigation: User wants to go to a section or page (projects, about, skills, contact, etc.)
- tour_start: User wants to start a guided tour
- tour_next: User wants to go to the next step in a tour
- tour_previous: User wants to go back in the tour
- tour_end: User wants to stop/end the tour
- tour_skip: User wants to skip to a specific section in the tour
- system_stop: User wants to stop listening/speaking
- system_help: User wants help or to know what commands are available
- system_repeat: User wants to hear the last response again
- system_clear: User wants to clear highlights or reset
- conversation: User is asking a question or making conversation (not a command)

Respond with ONLY a JSON object in this exact format:
{"intent": "intent_name", "confidence": 0.95, "target": "optional_target"}

The target field should contain the destination for navigation or tour_skip intents.`;
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

    const api = this.getAPI();
    if (!api) return this.capabilities;

    try {
      // Try new availability API first
      if (api.availability) {
        const status = await api.availability();
        this.capabilities = {
          isAvailable: status === 'available',
          supportsPromptAPI: true,
          supportsStreaming: true,
        };
      } else if (api.capabilities) {
        // Fall back to capabilities API
        const caps = await api.capabilities();
        this.capabilities = {
          isAvailable: caps.available === 'readily' || caps.available === 'after-download',
          supportsPromptAPI: true,
          supportsStreaming: true,
          maxTokens: caps.maxTopK,
        };
      }
    } catch {
      // API not available
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
   * Detect intent from user input using AI or fallback
   */
  async detectIntent(text: string): Promise<IntentResult> {
    const trimmed = text.trim().toLowerCase();

    // Try browser AI first
    if (this.intentSession) {
      try {
        const response = await this.intentSession.prompt(
          `Classify this user input: "${text}"`,
          {
            responseConstraint: {
              type: 'object',
              properties: {
                intent: { type: 'string' },
                confidence: { type: 'number' },
                target: { type: 'string' },
              },
              required: ['intent', 'confidence'],
            },
          }
        );

        const parsed = JSON.parse(response);
        return {
          intent: parsed.intent as IntentType,
          confidence: parsed.confidence,
          target: parsed.target,
          originalText: text,
        };
      } catch {
        // Fall back to basic detection
      }
    }

    // Fallback: Use basic keyword matching
    return this.basicIntentDetection(trimmed, text);
  }

  private basicIntentDetection(normalized: string, original: string): IntentResult {
    // Tour intents
    if (this.containsAny(normalized, ['tour', 'show me around', 'walk me through', 'guide me'])) {
      if (this.containsAny(normalized, ['start', 'begin', 'give', 'take me', 'want'])) {
        return { intent: 'tour_start', confidence: 0.8, originalText: original };
      }
      if (this.containsAny(normalized, ['end', 'stop', 'finish', 'quit', 'exit'])) {
        return { intent: 'tour_end', confidence: 0.8, originalText: original };
      }
    }

    if (this.containsAny(normalized, ['next', 'continue', 'go on', 'forward'])) {
      return { intent: 'tour_next', confidence: 0.7, originalText: original };
    }

    if (this.containsAny(normalized, ['previous', 'back', 'go back', 'before'])) {
      return { intent: 'tour_previous', confidence: 0.7, originalText: original };
    }

    if (this.containsAny(normalized, ['skip to', 'jump to', 'go to section'])) {
      const target = this.extractTarget(normalized);
      return { intent: 'tour_skip', confidence: 0.7, target, originalText: original };
    }

    // Navigation intents
    if (this.containsAny(normalized, ['go to', 'navigate', 'show me', 'take me to', 'open', 'scroll to'])) {
      const target = this.extractTarget(normalized);
      return { intent: 'navigation', confidence: 0.7, target, originalText: original };
    }

    // System intents
    if (this.containsAny(normalized, ['stop', 'pause', 'quiet', 'shut up', 'silence'])) {
      return { intent: 'system_stop', confidence: 0.8, originalText: original };
    }

    if (this.containsAny(normalized, ['help', 'what can you', 'commands', 'what do you'])) {
      return { intent: 'system_help', confidence: 0.8, originalText: original };
    }

    if (this.containsAny(normalized, ['repeat', 'say again', 'what did you say', 'pardon'])) {
      return { intent: 'system_repeat', confidence: 0.8, originalText: original };
    }

    if (this.containsAny(normalized, ['clear', 'dismiss', 'hide'])) {
      return { intent: 'system_clear', confidence: 0.7, originalText: original };
    }

    // Default to conversation
    return { intent: 'conversation', confidence: 0.5, originalText: original };
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private extractTarget(text: string): string {
    const patterns = [
      /(?:go to|navigate to|show me|take me to|skip to|jump to|open|scroll to)\s+(?:the\s+)?(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Generate a contextual response for an action
   */
  async generateActionResponse(
    action: ActionType,
    context: ActionContext
  ): Promise<string> {
    const prompt = this.buildActionPrompt(action, context);

    // Try browser AI first
    if (this.intentSession) {
      try {
        const response = await this.intentSession.prompt(prompt);
        if (response && response.trim()) {
          return response.trim();
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback to contextual defaults
    return this.getFallbackResponse(action, context);
  }

  private buildActionPrompt(action: ActionType, context: ActionContext): string {
    const identity = this.trainingData?.identity;
    const baseContext = identity
      ? `You are ${identity.name}, ${identity.role}. ${identity.personality || ''}`
      : `You are a friendly AI assistant for this documentation website.`;

    const styleNote = `Keep responses concise (1-2 sentences max) and conversational.`;

    switch (action) {
      case 'navigate':
        return `${baseContext}
${styleNote}
The user just navigated to "${context.target}".
Generate a brief, friendly confirmation. Don't be robotic.`;

      case 'tour_start':
        if (context.alreadyActive) {
          return `${baseContext}
${styleNote}
A tour is already in progress. Tell them they can say "next" to continue or "end tour" to stop.`;
        }
        return `${baseContext}
${styleNote}
The user is starting a guided tour of the website.
Generate an enthusiastic but brief welcome. Mention they can say "next" or "stop".`;

      case 'tour_step':
        return `${baseContext}
${styleNote}
The user is on a tour step about "${context.section}".
Section content: ${context.description || 'A section of the website'}
Generate engaging narration for this section (2-3 sentences). Be informative and personable.`;

      case 'tour_end':
        return `${baseContext}
${styleNote}
The user just ended the tour.
Generate a friendly goodbye that encourages them to explore or ask questions.`;

      case 'error':
        return `${baseContext}
${styleNote}
Something went wrong: ${context.error}
Generate a helpful, apologetic response with a suggestion.`;

      case 'help':
        return `${baseContext}
${styleNote}
The user asked for help with voice commands.
List the main things you can do: navigate, give tours, answer questions.
Keep it conversational, not a boring list.`;

      default:
        return `${baseContext}
${styleNote}
Action: ${action}
Context: ${JSON.stringify(context)}
Generate an appropriate brief response.`;
    }
  }

  private getFallbackResponse(action: ActionType, context: ActionContext): string {
    switch (action) {
      case 'navigate':
        return `Here's ${context.target}.`;
      case 'tour_start':
        if (context.alreadyActive) {
          return "A tour is already in progress. Say 'next' to continue or 'end tour' to stop.";
        }
        return "Let me show you around! Say 'next' to continue or 'stop' anytime.";
      case 'tour_step':
        return context.description || `This is the ${context.section} section.`;
      case 'tour_end':
        return "Tour complete! Feel free to explore or ask me anything.";
      case 'error':
        return "Sorry, I ran into an issue. Try that again?";
      case 'help':
        return "I can help you navigate, give tours, or answer questions. What would you like?";
      default:
        return "How can I help you?";
    }
  }

  /**
   * Create an AI session with a system prompt
   */
  async createSession(systemPrompt: string): Promise<AISession | null> {
    const caps = await this.checkCapabilities();
    const api = this.getAPI();

    if (!caps.isAvailable || !api?.create) {
      return null;
    }

    try {
      const session = await api.create({
        systemPrompt,
        temperature: 0.7,
      });

      const aiSession: AISession = {
        id: `session-${Date.now()}`,
        systemPrompt,
        prompt: session.prompt.bind(session),
        promptStreaming: session.promptStreaming?.bind(session) as AISession['promptStreaming'],
        destroy: session.destroy.bind(session),
      };

      this.activeSession = aiSession;
      return aiSession;
    } catch {
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
      } catch {
        // Fall through
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
      } catch {
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
      } catch {
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
   * Destroy all sessions and reset
   */
  destroy(): void {
    this.destroySession();
    if (this.intentSession) {
      this.intentSession.destroy();
      this.intentSession = null;
    }
    this.initPromise = null;
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
      "I'm not sure about that specific detail. Would you like me to help you navigate to a relevant section?";
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

// Singleton instance
export const browserAI = BrowserAIService.getInstance();

// Convenience functions for external use
export async function detectIntent(text: string): Promise<IntentResult> {
  return browserAI.detectIntent(text);
}

export async function generateActionResponse(
  action: ActionType,
  context: ActionContext
): Promise<string> {
  return browserAI.generateActionResponse(action, context);
}

export async function isBrowserAIAvailable(): Promise<boolean> {
  return browserAI.isAvailable();
}
