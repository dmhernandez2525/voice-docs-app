/**
 * Voice Command Router
 *
 * Routes voice commands to appropriate handlers before passing to AI.
 * Supports navigation, tour, system, and query commands.
 */

import type {
  VoiceCommand,
  CommandHandler,
  CommandContext,
  CommandResult,
} from '../types/voiceStocks';
import { getVoiceStocksDOMNavigator } from './domNavigator';
import { scrollAndHighlight, clearHighlights } from './highlightSystem';
import { guidedTour, startAutoTour, endTour, nextTourStep, previousTourStep } from './guidedTour';

export class VoiceCommandRouter {
  private static instance: VoiceCommandRouter;
  private commands: VoiceCommand[] = [];
  private customCommands: VoiceCommand[] = [];

  private constructor() {
    this.registerBuiltInCommands();
  }

  static getInstance(): VoiceCommandRouter {
    if (!VoiceCommandRouter.instance) {
      VoiceCommandRouter.instance = new VoiceCommandRouter();
    }
    return VoiceCommandRouter.instance;
  }

  /**
   * Process a voice transcript and route to appropriate handler
   */
  async process(transcript: string, context: Partial<CommandContext> = {}): Promise<CommandResult> {
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Build full context
    const fullContext: CommandContext = {
      transcript: normalizedTranscript,
      conversationHistory: context.conversationHistory || [],
      currentPage: context.currentPage || getVoiceStocksDOMNavigator().getVSPageMap(),
      tourState: context.tourState || guidedTour.getState(),
    };

    // Try custom commands first (higher priority)
    for (const command of this.customCommands) {
      const match = normalizedTranscript.match(command.pattern);
      if (match) {
        try {
          return await command.handler(match, fullContext);
        } catch (error) {
          console.error(`[VoiceCommandRouter] Custom command error:`, error);
        }
      }
    }

    // Try built-in commands
    for (const command of this.commands) {
      const match = normalizedTranscript.match(command.pattern);
      if (match) {
        try {
          return await command.handler(match, fullContext);
        } catch (error) {
          console.error(`[VoiceCommandRouter] Command error:`, error);
        }
      }
    }

    // No command matched - pass to AI
    return {
      handled: false,
      passToAI: true,
    };
  }

  /**
   * Register a custom command
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
   * Get all registered commands
   */
  getCommands(): ReadonlyArray<VoiceCommand> {
    return [...this.commands, ...this.customCommands];
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: VoiceCommand['category']): ReadonlyArray<VoiceCommand> {
    return this.getCommands().filter(c => c.category === category);
  }

  /**
   * Get help text for all commands
   */
  getHelpText(): string {
    const categories = ['navigation', 'tour', 'system', 'query'] as const;
    const lines: string[] = ['Available voice commands:'];

    for (const category of categories) {
      const commands = this.getCommandsByCategory(category);
      if (commands.length > 0) {
        lines.push(`\n**${category.charAt(0).toUpperCase() + category.slice(1)}:**`);
        for (const cmd of commands) {
          lines.push(`- ${cmd.description}`);
        }
      }
    }

    return lines.join('\n');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private registerBuiltInCommands(): void {
    // Navigation commands
    this.commands.push(
      {
        pattern: /^(?:go to|navigate to|show me|take me to|scroll to)\s+(?:the\s+)?(.+)$/i,
        handler: this.handleNavigate.bind(this),
        description: '"Go to [section]" - Navigate to a section',
        category: 'navigation',
      },
      {
        pattern: /^(?:scroll\s+)?(up|down|top|bottom)$/i,
        handler: this.handleScroll.bind(this),
        description: '"Scroll up/down/top/bottom" - Scroll the page',
        category: 'navigation',
      },
      {
        pattern: /^(?:find|show|where is|where's)\s+(?:the\s+)?(.+)$/i,
        handler: this.handleFind.bind(this),
        description: '"Find [element]" - Highlight an element',
        category: 'navigation',
      },
      {
        pattern: /^(?:go\s+)?(?:back|home)$/i,
        handler: this.handleGoBack.bind(this),
        description: '"Go back" or "Home" - Return to top',
        category: 'navigation',
      }
    );

    // Tour commands
    this.commands.push(
      {
        pattern: /^(?:give me a|start a?|begin a?)\s*tour$/i,
        handler: this.handleStartTour.bind(this),
        description: '"Give me a tour" - Start guided tour',
        category: 'tour',
      },
      {
        pattern: /^(?:show me around|walk me through)$/i,
        handler: this.handleStartTour.bind(this),
        description: '"Show me around" - Start guided tour',
        category: 'tour',
      },
      {
        pattern: /^(?:next|continue|go on)$/i,
        handler: this.handleTourNext.bind(this),
        description: '"Next" - Go to next tour step',
        category: 'tour',
      },
      {
        pattern: /^(?:previous|back|go back)$/i,
        handler: this.handleTourPrevious.bind(this),
        description: '"Previous" - Go to previous tour step',
        category: 'tour',
      },
      {
        pattern: /^(?:skip to|jump to)\s+(.+)$/i,
        handler: this.handleTourSkip.bind(this),
        description: '"Skip to [section]" - Jump to tour section',
        category: 'tour',
      },
      {
        pattern: /^(?:end|stop|exit)\s*(?:the\s+)?tour$/i,
        handler: this.handleEndTour.bind(this),
        description: '"End tour" - Stop the guided tour',
        category: 'tour',
      }
    );

    // System commands
    this.commands.push(
      {
        pattern: /^(?:stop|stop listening|pause)$/i,
        handler: this.handleStop.bind(this),
        description: '"Stop" - Stop listening',
        category: 'system',
      },
      {
        pattern: /^(?:repeat|say that again|what did you say)$/i,
        handler: this.handleRepeat.bind(this),
        description: '"Repeat" - Repeat last response',
        category: 'system',
      },
      {
        pattern: /^(?:help|what can you do|commands)$/i,
        handler: this.handleHelp.bind(this),
        description: '"Help" - List available commands',
        category: 'system',
      },
      {
        pattern: /^(?:clear|clear highlights|dismiss)$/i,
        handler: this.handleClear.bind(this),
        description: '"Clear" - Clear all highlights',
        category: 'system',
      },
      {
        pattern: /^(?:louder|volume up)$/i,
        handler: this.handleVolumeUp.bind(this),
        description: '"Louder" - Increase volume',
        category: 'system',
      },
      {
        pattern: /^(?:quieter|softer|volume down)$/i,
        handler: this.handleVolumeDown.bind(this),
        description: '"Quieter" - Decrease volume',
        category: 'system',
      }
    );
  }

  // ============================================================================
  // Navigation Handlers
  // ============================================================================

  private async handleNavigate(match: RegExpMatchArray, _context: CommandContext): Promise<CommandResult> {
    const target = match[1].trim();
    const navigator = getVoiceStocksDOMNavigator();

    // Try to find the element
    const element = navigator.findElementByDescription(target);

    if (element) {
      await scrollAndHighlight(element, { position: 'center' }, { dimBackground: false, duration: 3000 });

      return {
        handled: true,
        response: `I've navigated to ${target}.`,
        shouldSpeak: true,
      };
    }

    // Try capability-based search
    const elements = navigator.findElementsForCapability(target);
    if (elements.length > 0) {
      await scrollAndHighlight(elements[0], { position: 'center' }, { dimBackground: false, duration: 3000 });

      return {
        handled: true,
        response: `Here's the ${target} section.`,
        shouldSpeak: true,
      };
    }

    // Not found - let AI handle
    return {
      handled: false,
      passToAI: true,
      response: `I couldn't find a "${target}" section. Let me help you another way.`,
    };
  }

  private async handleScroll(match: RegExpMatchArray): Promise<CommandResult> {
    const direction = match[1].toLowerCase();

    switch (direction) {
      case 'up':
        window.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' });
        break;
      case 'down':
        window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
        break;
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'bottom':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
    }

    return {
      handled: true,
      response: `Scrolling ${direction}.`,
      shouldSpeak: false,
    };
  }

  private async handleFind(match: RegExpMatchArray, _context: CommandContext): Promise<CommandResult> {
    const target = match[1].trim();
    const navigator = getVoiceStocksDOMNavigator();

    const element = navigator.findElementByDescription(target);

    if (element) {
      await scrollAndHighlight(element, { position: 'center' }, { dimBackground: true, duration: 5000 });

      return {
        handled: true,
        response: `I found ${target} and highlighted it for you.`,
        shouldSpeak: true,
      };
    }

    return {
      handled: false,
      passToAI: true,
      response: `I couldn't find "${target}" on this page.`,
    };
  }

  private async handleGoBack(): Promise<CommandResult> {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearHighlights();

    return {
      handled: true,
      response: 'Going back to the top.',
      shouldSpeak: true,
    };
  }

  // ============================================================================
  // Tour Handlers
  // ============================================================================

  private async handleStartTour(): Promise<CommandResult> {
    if (guidedTour.getState().isActive) {
      return {
        handled: true,
        response: 'A tour is already in progress. Say "next" to continue or "end tour" to stop.',
        shouldSpeak: true,
      };
    }

    await startAutoTour();

    return {
      handled: true,
      response: "I'll give you a tour of this page. Say 'next' to continue or 'end tour' to stop at any time.",
      shouldSpeak: true,
    };
  }

  private async handleTourNext(): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      return {
        handled: false,
        passToAI: true,
      };
    }

    await nextTourStep();

    return {
      handled: true,
      shouldSpeak: false, // Tour has its own voice scripts
    };
  }

  private async handleTourPrevious(): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      return {
        handled: false,
        passToAI: true,
      };
    }

    await previousTourStep();

    return {
      handled: true,
      shouldSpeak: false,
    };
  }

  private async handleTourSkip(match: RegExpMatchArray): Promise<CommandResult> {
    if (!guidedTour.getState().isActive) {
      // Start tour and skip to section
      await startAutoTour();
    }

    const section = match[1].trim();
    const found = await guidedTour.skipToSection(section);

    if (found) {
      return {
        handled: true,
        response: `Skipping to ${section}.`,
        shouldSpeak: true,
      };
    }

    return {
      handled: true,
      response: `I couldn't find a "${section}" section in the tour.`,
      shouldSpeak: true,
    };
  }

  private handleEndTour(): CommandResult {
    if (!guidedTour.getState().isActive) {
      return {
        handled: true,
        response: "There's no tour in progress.",
        shouldSpeak: true,
      };
    }

    endTour();

    return {
      handled: true,
      response: 'Tour ended. Feel free to explore on your own or ask me anything.',
      shouldSpeak: true,
    };
  }

  // ============================================================================
  // System Handlers
  // ============================================================================

  private handleStop(): CommandResult {
    clearHighlights();
    if (guidedTour.getState().isActive) {
      endTour();
    }

    return {
      handled: true,
      action: () => {
        // This signals to the voice system to stop listening
        // The actual stop is handled by the component using this result
      },
      response: 'Stopping.',
      shouldSpeak: false,
    };
  }

  private handleRepeat(_match: RegExpMatchArray, context: CommandContext): CommandResult {
    // Get last assistant message
    const lastAssistantMessage = [...context.conversationHistory]
      .reverse()
      .find(m => m.role === 'assistant');

    if (lastAssistantMessage) {
      return {
        handled: true,
        response: lastAssistantMessage.content,
        shouldSpeak: true,
      };
    }

    return {
      handled: true,
      response: "I haven't said anything yet. How can I help you?",
      shouldSpeak: true,
    };
  }

  private handleHelp(): CommandResult {
    const helpText = this.getHelpText();

    return {
      handled: true,
      response: helpText,
      shouldSpeak: true,
    };
  }

  private handleClear(): CommandResult {
    clearHighlights();

    return {
      handled: true,
      response: 'Cleared all highlights.',
      shouldSpeak: false,
    };
  }

  private handleVolumeUp(): CommandResult {
    return {
      handled: true,
      action: () => {
        // Volume adjustment is handled by the voice settings system
        // This signals the intent
      },
      response: 'Volume increased.',
      shouldSpeak: true,
    };
  }

  private handleVolumeDown(): CommandResult {
    return {
      handled: true,
      action: () => {
        // Volume adjustment is handled by the voice settings system
      },
      response: 'Volume decreased.',
      shouldSpeak: true,
    };
  }
}

// Singleton instance
export const voiceCommandRouter = VoiceCommandRouter.getInstance();

// Convenience function
export function processVoiceCommand(
  transcript: string,
  context?: Partial<CommandContext>
): Promise<CommandResult> {
  return voiceCommandRouter.process(transcript, context);
}
