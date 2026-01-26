/**
 * useVoiceCommands Hook
 *
 * React hook for processing voice commands with the Voice Stocks router.
 */

import { useCallback, useRef } from 'react';
import {
  voiceCommandRouter,
  processVoiceCommand,
} from '../services/voiceCommandRouter';
import type {
  CommandResult,
  CommandHandler,
  VoiceCommand,
  ConversationMessage,
} from '../types/voiceStocks';

interface UseVoiceCommandsOptions {
  conversationHistory?: ConversationMessage[];
  onCommandHandled?: (result: CommandResult) => void;
  onPassToAI?: (transcript: string) => void;
  onSpeak?: (text: string) => void;
}

interface UseVoiceCommandsReturn {
  // Process a voice transcript
  processCommand: (transcript: string) => Promise<CommandResult>;

  // Register a custom command
  registerCommand: (
    pattern: RegExp,
    handler: CommandHandler,
    description: string,
    category?: VoiceCommand['category']
  ) => () => void;

  // Get available commands
  getCommands: () => ReadonlyArray<VoiceCommand>;
  getCommandsByCategory: (category: VoiceCommand['category']) => ReadonlyArray<VoiceCommand>;

  // Get help text
  getHelpText: () => string;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn {
  const {
    conversationHistory = [],
    onCommandHandled,
    onPassToAI,
    onSpeak,
  } = options;

  // Store latest conversation history in ref for callbacks
  const conversationRef = useRef(conversationHistory);
  conversationRef.current = conversationHistory;

  const processCommand = useCallback(
    async (transcript: string): Promise<CommandResult> => {
      const result = await processVoiceCommand(transcript, {
        conversationHistory: conversationRef.current,
      });

      // Handle the result
      if (result.handled) {
        // Execute any action
        if (result.action) {
          await result.action();
        }

        // Speak response if requested
        if (result.shouldSpeak && result.response && onSpeak) {
          onSpeak(result.response);
        }

        onCommandHandled?.(result);
      } else if (result.passToAI) {
        onPassToAI?.(transcript);
      }

      return result;
    },
    [onCommandHandled, onPassToAI, onSpeak]
  );

  const registerCommand = useCallback(
    (
      pattern: RegExp,
      handler: CommandHandler,
      description: string,
      category: VoiceCommand['category'] = 'query'
    ) => {
      return voiceCommandRouter.registerCommand(pattern, handler, description, category);
    },
    []
  );

  const getCommands = useCallback(() => {
    return voiceCommandRouter.getCommands();
  }, []);

  const getCommandsByCategory = useCallback(
    (category: VoiceCommand['category']) => {
      return voiceCommandRouter.getCommandsByCategory(category);
    },
    []
  );

  const getHelpText = useCallback(() => {
    return voiceCommandRouter.getHelpText();
  }, []);

  return {
    processCommand,
    registerCommand,
    getCommands,
    getCommandsByCategory,
    getHelpText,
  };
}

export default useVoiceCommands;
