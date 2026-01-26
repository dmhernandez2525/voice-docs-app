/**
 * Voice Stocks Widget
 *
 * Embeddable widget that provides Voice Stocks features:
 * - Voice command routing for navigation and actions
 * - Guided tours with visual highlighting
 * - Browser AI integration for natural conversation
 * - DOM navigation and page mapping
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, X, Minimize2, Maximize2, Bot, User,
  Volume2, VolumeX, Sparkles, Loader2,
  Map, ChevronLeft, ChevronRight, HelpCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useContinuousVoiceRecognition } from '../../hooks/useContinuousVoiceRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { useGuidedTour } from '../../hooks/useGuidedTour';
import { aiService } from '../../services/aiService';
import type { WidgetConfig as BaseWidgetConfig } from '../../types/widget';
import type {
  VoiceStocksTrainingData,
  ConversationMessage as VoiceStocksMessage,
} from '../../types/voiceStocks';

// Extend base widget config with Voice Stocks options
interface VoiceStocksWidgetConfig extends Partial<BaseWidgetConfig> {
  trainingData?: VoiceStocksTrainingData;
  enableVoiceStocks?: boolean;
  showTourButton?: boolean;
  showHelpButton?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface VoiceStocksWidgetProps {
  config?: VoiceStocksWidgetConfig;
}

const defaultConfig: VoiceStocksWidgetConfig = {
  mode: 'floating',
  position: 'bottom-right',
  enableVoiceStocks: true,
  showTourButton: true,
  showHelpButton: true,
  branding: {
    title: 'Voice Stocks',
    subtitle: 'Voice-Enabled Assistant',
    welcomeMessage: "Hi! I can help you explore this page. Try saying 'give me a tour' or ask me anything!",
    placeholder: 'Type or speak your question...',
  },
  voice: {
    enableVoiceInput: true,
    enableVoiceOutput: true,
    language: 'en-US',
    rate: 0.9,
    pitch: 1.0,
    silenceTimeout: 3000,
  },
  zIndex: 9999,
};

export function VoiceStocksWidget({ config: userConfig }: VoiceStocksWidgetProps) {
  // Merge config with defaults
  const config = useMemo(() => ({
    ...defaultConfig,
    ...userConfig,
    branding: { ...defaultConfig.branding, ...userConfig?.branding },
    voice: { ...defaultConfig.voice, ...userConfig?.voice },
  }), [userConfig]);

  // Widget state
  const [isOpen, setIsOpen] = useState(config.mode !== 'floating');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice synthesis
  const speechSynthesis = useSpeechSynthesis();

  // Speak function
  const speak = useCallback((text: string) => {
    if (speechSynthesis.isSupported && config.voice?.enableVoiceOutput) {
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\n\n/g, '. ')
        .replace(/\n/g, ' ');
      speechSynthesis.speak(cleanText, {
        rate: config.voice?.rate,
        pitch: config.voice?.pitch,
      });
    }
  }, [speechSynthesis, config.voice]);

  // Guided tour
  const guidedTour = useGuidedTour();

  // Connect tour to speech
  useEffect(() => {
    if (config.enableVoiceStocks) {
      return guidedTour.onSpeak(speak);
    }
  }, [config.enableVoiceStocks, guidedTour, speak]);

  // Convert messages to Voice Stocks format
  const voiceStocksHistory: VoiceStocksMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.timestamp.getTime(),
  }));

  // Voice commands
  const voiceCommands = useVoiceCommands({
    conversationHistory: voiceStocksHistory,
    onSpeak: speak,
    onCommandHandled: (result) => {
      if (result.response) {
        addAssistantMessage(result.response);
      }
    },
  });

  // Initialize Voice Stocks with training data
  useEffect(() => {
    const init = async () => {
      if (config.trainingData && config.enableVoiceStocks) {
        await aiService.initializeVoiceStocks(config.trainingData);
      }
      setIsInitialized(true);

      // Add welcome message
      const greeting = config.trainingData
        ? aiService.getGreeting()
        : config.branding?.welcomeMessage || "Hi! How can I help you?";

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    };
    init();
  }, [config.trainingData, config.enableVoiceStocks, config.branding?.welcomeMessage]);

  // Helper to add assistant message
  const addAssistantMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    }]);
  }, []);

  // Handle voice input
  const handleVoiceInput = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: transcript,
      timestamp: new Date(),
    }]);

    setIsProcessing(true);

    try {
      // Try voice command router first
      if (config.enableVoiceStocks) {
        const commandResult = await voiceCommands.processCommand(transcript);
        if (commandResult.handled) {
          // Response added via onCommandHandled
          setIsProcessing(false);
          return;
        }
      }

      // Fall through to AI
      const answer = await aiService.answerQuestion(transcript);
      addAssistantMessage(answer.answer);

      if (config.voice?.enableVoiceOutput) {
        speak(answer.answer);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      addAssistantMessage("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, config.enableVoiceStocks, config.voice?.enableVoiceOutput, voiceCommands, speak, addAssistantMessage]);

  // Voice recognition
  const voiceRecognition = useContinuousVoiceRecognition(
    async (transcript: string) => {
      await handleVoiceInput(transcript);
    },
    {
      language: config.voice?.language || 'en-US',
      silenceTimeout: config.voice?.silenceTimeout || 3000,
    }
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isProcessing) return;

    if (voiceRecognition.isListening) {
      voiceRecognition.stopListening();
    }

    setInput('');
    await handleVoiceInput(trimmedInput);
  }, [input, isProcessing, voiceRecognition, handleVoiceInput]);

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle widget
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Render floating button
  const renderFloatingButton = () => (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleOpen}
      className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg flex items-center justify-center"
      style={{ zIndex: config.zIndex }}
    >
      <Sparkles className="w-6 h-6" />
    </motion.button>
  );

  // Render widget content
  const renderWidgetContent = () => (
    <Card className="flex flex-col overflow-hidden shadow-2xl border-purple-200 dark:border-purple-800">
      {/* Header */}
      <CardHeader className="p-3 border-b bg-gradient-to-r from-purple-500 to-blue-600 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {config.branding?.title}
              </CardTitle>
              {config.branding?.subtitle && (
                <p className="text-xs text-white/70">
                  {config.branding.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {guidedTour.isActive && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                Tour: {guidedTour.progress.current}/{guidedTour.progress.total}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            {config.mode === 'floating' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={toggleOpen}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Tour Progress Bar */}
            {guidedTour.isActive && (
              <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-b">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {guidedTour.currentStep?.title}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={guidedTour.previousStep}
                      disabled={guidedTour.currentStepIndex === 0}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={guidedTour.nextStep}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={guidedTour.endTour}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1">
                  <div
                    className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${guidedTour.progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[350px]">
              {!isInitialized ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : (
                messages.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role !== 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}

              {isProcessing && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Quick Actions */}
            {config.enableVoiceStocks && !guidedTour.isActive && (
              <div className="px-3 py-2 border-t flex gap-2">
                {config.showTourButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => guidedTour.startAutoTour()}
                    className="flex-1 text-xs"
                  >
                    <Map className="w-3 h-3 mr-1" />
                    Take a Tour
                  </Button>
                )}
                {config.showHelpButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const helpText = voiceCommands.getHelpText();
                      addAssistantMessage(helpText);
                    }}
                    className="flex-1 text-xs"
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Commands
                  </Button>
                )}
              </div>
            )}

            {/* Input */}
            <div className="border-t p-3 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2">
                {config.voice?.enableVoiceInput && voiceRecognition.isSupported && (
                  <Button
                    variant={voiceRecognition.isListening ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => voiceRecognition.isListening
                      ? voiceRecognition.stopListening()
                      : voiceRecognition.startListening()
                    }
                    disabled={isProcessing}
                    className={`flex-shrink-0 h-9 w-9 ${
                      voiceRecognition.isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
                    }`}
                  >
                    {voiceRecognition.isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={voiceRecognition.isListening
                    ? 'Listening...'
                    : config.branding?.placeholder
                  }
                  className="flex-1 min-h-[36px] max-h-[100px] px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  disabled={isProcessing}
                  rows={1}
                />

                {config.voice?.enableVoiceOutput && speechSynthesis.isSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speechSynthesis.isSpeaking && speechSynthesis.stop()}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    {speechSynthesis.isSpeaking ? (
                      <Volume2 className="h-4 w-4 animate-pulse text-purple-500" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                )}

                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isProcessing}
                  size="icon"
                  className="flex-shrink-0 h-9 w-9 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {voiceRecognition.isListening && voiceRecognition.currentTranscript && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  "{voiceRecognition.currentTranscript}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );

  // Render based on mode
  if (config.mode === 'floating') {
    return (
      <div
        className={`voice-stocks-widget fixed ${positionClasses[config.position || 'bottom-right']}`}
        style={{ zIndex: config.zIndex }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="widget"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[350px] sm:w-[380px]"
            >
              {renderWidgetContent()}
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              {renderFloatingButton()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline mode
  return (
    <div className="voice-stocks-widget w-full">
      {renderWidgetContent()}
    </div>
  );
}

export default VoiceStocksWidget;
