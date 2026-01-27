/**
 * Voice Command Router
 *
 * Uses AI-based intent detection (Chrome's Prompt API / Gemini Nano when available)
 * to intelligently route voice commands. Falls back to keyword matching.
 */

import type { CommandContext, CommandResult, VoiceCommand, CommandHandler } from '../types/voiceStocks';
import { getVoiceStocksDOMNavigator } from './domNavigator';
import { scrollAndHighlight, clearHighlights } from './highlightSystem';
import { guidedTour, startAutoTour, endTour, nextTourStep, previousTourStep } from './guidedTour';
import { browserAI, detectIntent, generateActionResponse, type IntentType } from './browserAI';

export class VoiceCommandRouter {
  private static instance: VoiceCommandRouter;
  private customCommands: VoiceCommand[] = [];

  private constructor() {
    // Initialize browser AI in the background
    browserAI.initialize().catch(() => {});
  }

  static getInstance(): VoiceCommandRouter {
    if (!VoiceCommandRouter.instance) {
      VoiceCommandRouter.instance = new VoiceCommandRouter();
    }
    return VoiceCommandRouter.instance;
  }

  async process(transcript: string, context: Partial<CommandContext> = {}): Promise<CommandResult> {
    let fullContext: CommandContext;
    try {
      fullContext = {
        transcript: transcript.toLowerCase().trim(),
        conversationHistory: context.conversationHistory || [],
        currentPage: context.currentPage || getVoiceStocksDOMNavigator().getVSPageMap(),
        tourState: context.tourState || guidedTour.getState(),
      };
    } catch {
      fullContext = {
        transcript: transcript.toLowerCase().trim(),
        conversationHistory: context.conversationHistory || [],
        currentPage: { sections: [], navigation: [], buttons: [], forms: [], media: [], landmarks: [], lastUpdated: Date.now() },
        tourState: { isActive: false, currentStepIndex: -1, tourConfig: null, completedSteps: [] },
      };
    }

    // Use AI-based intent detection
    const intentResult = await detectIntent(transcript);

    // Route based on detected intent (confidence threshold of 0.6)
    if (intentResult.confidence >= 0.6) {
      const result = await this.handleIntent(intentResult.intent, intentResult.target, fullContext);
      if (result.handled || result.passToAI) {
        return result;
      }
    }

    // No confident match - pass to AI for conversation
    return { handled: false, passToAI: true };
  }

  private async handleIntent(
    intent: IntentType,
    target: string | undefined,
    context: CommandContext
  ): Promise<CommandResult> {
    switch (intent) {
      case 'navigation':
        return this.handleNavigate(target || '');

      case 'tour_start':
        return this.handleStartTour();

      case 'tour_next':
        return this.handleTourNext();

      case 'tour_previous':
        return this.handleTourPrevious();

      case 'tour_end':
        return this.handleEndTour();

      case 'tour_skip':
        return this.handleTourSkip(target || '');

      case 'system_stop':
        return this.handleStop();

      case 'system_help':
        return this.handleHelp();

      case 'system_repeat':
        return this.handleRepeat(context);

      case 'system_clear':
        return this.handleClear();

      case 'conversation':
      default:
        return { handled: false, passToAI: true };
    }
  }

  getHelpText(): string {
    return `I can help you with:

**Navigation:**
- "Go to projects" - Navigate to a section
- "Show me skills" - Jump to skills section
- "Scroll down/up" - Scroll the page

**Tour:**
- "Give me a tour" - Start a guided tour
- "Next" / "Previous" - Navigate tour steps
- "End tour" - Stop the tour

**System:**
- "Stop" - Stop speaking
- "Repeat" - Hear the last response again
- "Help" - Show this help

Or just ask me anything!`;
  }

  /**
   * Register a custom command (for backward compatibility with useVoiceCommands hook)
   */
  registerCommand(
    pattern: RegExp,
    handler: CommandHandler,
    description: string,
    category: VoiceCommand['category'] = 'query'
  ): () => void {
    const command: VoiceCommand = { pattern, handler, description, category };
    this.customCommands.push(command);

    // Return unregister function
    return () => {
      const index = this.customCommands.indexOf(command);
      if (index >= 0) {
        this.customCommands.splice(index, 1);
      }
    };
  }

  /**
   * Get all registered custom commands
   */
  getCommands(): ReadonlyArray<VoiceCommand> {
    return [...this.customCommands];
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: VoiceCommand['category']): ReadonlyArray<VoiceCommand> {
    return this.customCommands.filter(c => c.category === category);
  }

  private async handleNavigate(target: string): Promise<CommandResult> {
    if (!target) {
      return { handled: false, passToAI: true };
    }

    const navigator = getVoiceStocksDOMNavigator();
    const element = navigator.findElementByDescription(target);

    if (element) {
      await scrollAndHighlight(element, { position: 'center' }, { dimBackground: false, duration: 3000 });
      const response = await generateActionResponse('navigate', { target });
      return { handled: true, response, shouldSpeak: true };
    }

    // Try capability-based search
    const elements = navigator.findElementsForCapability(target);
    if (elements.length > 0) {
      await scrollAndHighlight(elements[0], { position: 'center' }, { dimBackground: false, duration: 3000 });
      const response = await generateActionResponse('navigate', { target });
      return { handled: true, response, shouldSpeak: true };
    }

    // Not found - let AI handle
    return { handled: false, passToAI: true };
  }

  private async handleStartTour(): Promise<CommandResult> {
    if (guidedTour.getState().isActive) {
      const response = await generateActionResponse('tour_start', { alreadyActive: true });
      return { handled: true, response, shouldSpeak: true };
    }

    try {
      await startAutoTour();
      // Tour handles its own speaking via TourPlayer
      return { handled: true, shouldSpeak: false };
    } catch {
      const response = await generateActionResponse('error', { error: 'Could not start tour' });
      return { handled: true, response, shouldSpeak: true };
    }
  }

  private async handleTourNext(): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      return { handled: false, passToAI: true };
    }
    await nextTourStep();
    return { handled: true, shouldSpeak: false };
  }

  private async handleTourPrevious(): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      return { handled: false, passToAI: true };
    }
    await previousTourStep();
    return { handled: true, shouldSpeak: false };
  }

  private async handleTourSkip(section: string): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      await startAutoTour();
    }

    const found = await guidedTour.skipToSection(section);

    if (found) {
      return { handled: true, shouldSpeak: false };
    }

    const response = await generateActionResponse('error', { error: `Section "${section}" not found` });
    return { handled: true, response, shouldSpeak: true };
  }

  private async handleEndTour(): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      return { handled: false, passToAI: true };
    }
    endTour();
    const response = await generateActionResponse('tour_end', {});
    return { handled: true, response, shouldSpeak: true };
  }

  private async handleStop(): Promise<CommandResult> {
    clearHighlights();
    if (guidedTour.getState().isActive) {
      endTour();
    }
    return { handled: true, shouldSpeak: false };
  }

  private async handleHelp(): Promise<CommandResult> {
    const response = await generateActionResponse('help', {});
    return { handled: true, response, shouldSpeak: true };
  }

  private handleRepeat(context: CommandContext): CommandResult {
    const lastAssistantMessage = [...context.conversationHistory]
      .reverse()
      .find(m => m.role === 'assistant');

    if (lastAssistantMessage) {
      return { handled: true, response: lastAssistantMessage.content, shouldSpeak: true };
    }

    return { handled: false, passToAI: true };
  }

  private async handleClear(): Promise<CommandResult> {
    clearHighlights();
    return { handled: true, shouldSpeak: false };
  }
}

export const voiceCommandRouter = VoiceCommandRouter.getInstance();

export function processVoiceCommand(
  transcript: string,
  context?: Partial<CommandContext>
): Promise<CommandResult> {
  return voiceCommandRouter.process(transcript, context);
}
