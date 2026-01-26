import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, X, Minimize2, Maximize2, Bot, User,
  Volume2, VolumeX, Navigation, Sparkles,
  Loader2, MessageCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DOMNavigator } from '../../services/domNavigator';
import { useContinuousVoiceRecognition } from '../../hooks/useContinuousVoiceRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type {
  WidgetConfig,
  WidgetState,
  DocumentationContent,
  NavigationTarget,
} from '../../types/widget';
import { defaultWidgetConfig } from '../../types/widget';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  navigationTarget?: NavigationTarget;
}

interface VoiceDocsWidgetProps {
  config?: Partial<WidgetConfig>;
}

// Navigation command patterns
const navigationPatterns = [
  { pattern: /(?:go to|navigate to|take me to|show me|open)\s+(.+)/i, type: 'section' as const },
  { pattern: /(?:scroll to|jump to)\s+(.+)/i, type: 'element' as const },
  { pattern: /(?:click|press)\s+(.+)/i, type: 'page' as const },
];

export function VoiceDocsWidget({ config: userConfig }: VoiceDocsWidgetProps) {
  // Merge config with defaults
  const config = useMemo(() => ({
    ...defaultWidgetConfig,
    ...userConfig,
    branding: { ...defaultWidgetConfig.branding, ...userConfig?.branding },
    ai: { ...defaultWidgetConfig.ai, ...userConfig?.ai },
    navigation: { ...defaultWidgetConfig.navigation, ...userConfig?.navigation },
    voice: { ...defaultWidgetConfig.voice, ...userConfig?.voice },
    features: { ...defaultWidgetConfig.features, ...userConfig?.features },
  }), [userConfig]);

  // Widget state
  const [state, setState] = useState<WidgetState>({
    isOpen: config.mode !== 'floating',
    isMinimized: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    mode: config.mode || 'floating',
    unreadCount: 0,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: config.branding?.welcomeMessage || "Hi! I'm your voice assistant. Ask me anything or say 'go to [section]' to navigate.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [pageContent, setPageContent] = useState<DocumentationContent[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const domNavigator = useRef<DOMNavigator | null>(null);

  // Content loaders by data source type
  const extractFromDOM = () => domNavigator.current!.extractPageContent();

  const fetchFromAPI = async (endpoint: string, headers?: Record<string, string>) => {
    const response = await fetch(endpoint, { headers: headers || {} });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const content = await response.json();
    return Array.isArray(content) ? content : [content];
  };

  const loadContentWithFallback = useCallback(async (
    loader: () => Promise<DocumentationContent[]> | DocumentationContent[],
    errorMessage: string
  ) => {
    try {
      const content = await loader();
      setPageContent(content);
    } catch (error) {
      console.warn(errorMessage, error);
      setPageContent(extractFromDOM());
    }
  }, []);

  // Initialize DOM navigator and load content
  useEffect(() => {
    domNavigator.current = new DOMNavigator(
      config.dataSource?.selectors,
      config.navigation
    );

    const { type, content, endpoint, headers, fetchFn } = config.dataSource || {};

    const loaders: Record<string, () => void> = {
      dom: () => setPageContent(extractFromDOM()),
      static: () => content && setPageContent(content),
      api: () => endpoint && loadContentWithFallback(
        () => fetchFromAPI(endpoint, headers),
        'Failed to fetch from API:'
      ),
      custom: () => fetchFn && loadContentWithFallback(
        fetchFn,
        'Failed to fetch with custom function:'
      ),
    };

    const loader = loaders[type || 'dom'] || loaders.dom;
    loader();
  }, [config.dataSource, config.navigation, loadContentWithFallback]);

  // Voice recognition - callback for when speech is finalized
  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => (prev + ' ' + text).trim());
    setInterimTranscript('');
  }, []);

  const {
    isListening,
    currentTranscript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
  } = useContinuousVoiceRecognition(handleVoiceResult, {
    language: config.voice?.language || 'en-US',
    silenceTimeout: config.voice?.silenceTimeout,
  });

  // Speech synthesis
  const {
    speak: speakText,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported,
  } = useSpeechSynthesis();

  // Wrapper for speak with config options
  const speak = useCallback((text: string) => {
    if (ttsSupported) {
      speakText(text, {
        rate: config.voice?.rate,
        pitch: config.voice?.pitch,
      });
    }
  }, [speakText, ttsSupported, config.voice?.rate, config.voice?.pitch]);

  // Update state when voice status changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isListening,
      isSpeaking,
    }));
  }, [isListening, isSpeaking]);

  // Update interim transcript from voice recognition
  useEffect(() => {
    setInterimTranscript(currentTranscript);
  }, [currentTranscript]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse navigation commands from text
  const parseNavigationCommand = useCallback((text: string): NavigationTarget | null => {
    for (const { pattern, type } of navigationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          type,
          target: match[1].trim(),
          label: match[1].trim(),
        };
      }
    }
    return null;
  }, []);

  // Handle navigation
  const handleNavigation = useCallback(async (target: NavigationTarget): Promise<boolean> => {
    if (!domNavigator.current || !config.navigation?.enableDOMNavigation) {
      return false;
    }

    const success = await domNavigator.current.navigateTo(target);

    if (success) {
      config.callbacks?.onNavigate?.(target);
      if (target.type === 'element' || target.type === 'section') {
        domNavigator.current.highlightElement(target.target);
      }
    }

    return success;
  }, [config.navigation, config.callbacks]);

  // Response generators for different query types
  const responseGenerators = useMemo(() => ({
    navigation: (targets: string[]) =>
      `You can navigate to these sections: ${targets.slice(0, 5).join(', ')}. Just say "go to [section name]" and I'll take you there!`,

    pageContent: (sections: string[]) =>
      `This page contains: ${sections.join(', ')}. Would you like me to tell you more about any of these, or navigate to a specific section?`,

    help: () => `I can help you with:
• **Navigate** - Say "go to [section]" to jump to any part of this page
• **Explore** - Ask "what's on this page" to see available content
• **Read** - I can read content aloud for you
• **Search** - Ask about specific topics and I'll find relevant information

What would you like to do?`,

    contentMatch: (title: string, content: string) =>
      `Based on the "${title}" section: ${content.slice(0, 300)}...\n\nWould you like me to navigate you to this section, or tell you more?`,

    default: () => `I'm here to help you navigate and understand this page. You can ask me:
• About the content on this page
• To navigate to specific sections
• To read content aloud

What would you like to know?`,
  }), []);

  // Find matching content for user query
  const findContentMatch = useCallback((query: string) => {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return pageContent.find(content =>
      words.some(word =>
        content.content.toLowerCase().includes(word) ||
        content.title.toLowerCase().includes(word)
      )
    );
  }, [pageContent]);

  // Generate AI response
  const generateResponse = useCallback(async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Handle navigation commands
    const navCommand = parseNavigationCommand(userMessage);
    if (navCommand) {
      const success = await handleNavigation(navCommand);
      return success
        ? `I've navigated you to "${navCommand.label}". Is there anything else you'd like to know?`
        : `I couldn't find "${navCommand.label}" on this page. Try asking about the available sections, or I can help you find something else.`;
    }

    // Query matchers - first match wins
    const matchers: Array<{ test: () => boolean; response: () => string }> = [
      {
        test: () => ['where', 'navigate', 'go to'].some(k => lowerMessage.includes(k)),
        response: () => {
          const targets = domNavigator.current?.getAvailableTargets() || [];
          return targets.length > 0 ? responseGenerators.navigation(targets) : responseGenerators.default();
        },
      },
      {
        test: () => lowerMessage.includes('what') && ['page', 'here'].some(k => lowerMessage.includes(k)),
        response: () => pageContent.length > 0
          ? responseGenerators.pageContent(pageContent.slice(0, 5).map(c => c.title))
          : responseGenerators.default(),
      },
      {
        test: () => ['help', 'can you'].some(k => lowerMessage.includes(k)),
        response: responseGenerators.help,
      },
      {
        test: () => pageContent.length > 0,
        response: () => {
          const match = findContentMatch(userMessage);
          return match ? responseGenerators.contentMatch(match.title, match.content) : responseGenerators.default();
        },
      },
    ];

    const matched = matchers.find(m => m.test());
    return matched ? matched.response() : responseGenerators.default();
  }, [pageContent, parseNavigationCommand, handleNavigation, findContentMatch, responseGenerators]);

  // Send message
  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || state.isProcessing) return;

    // Stop listening if active
    if (isListening) stopListening();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setInterimTranscript('');
    setState(prev => ({ ...prev, isProcessing: true }));

    config.callbacks?.onMessage?.(trimmedInput, 'user');

    try {
      const response = await generateResponse(trimmedInput);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      config.callbacks?.onMessage?.(response, 'assistant');

      // Speak response if enabled
      if (config.voice?.enableVoiceOutput) {
        speak(response.replace(/[*#]/g, '')); // Remove markdown
      }
    } catch (error) {
      config.callbacks?.onError?.(error as Error);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [input, state.isProcessing, isListening, stopListening, generateResponse, config, speak]);

  // Toggle widget open/close
  const toggleOpen = useCallback(() => {
    setState(prev => {
      const newIsOpen = !prev.isOpen;
      if (newIsOpen) {
        config.callbacks?.onOpen?.();
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        config.callbacks?.onClose?.();
      }
      return { ...prev, isOpen: newIsOpen, unreadCount: newIsOpen ? 0 : prev.unreadCount };
    });
  }, [config.callbacks]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Display text combines input and interim
  const displayText = input + (interimTranscript ? (input ? ' ' : '') + interimTranscript : '');

  // Position classes for floating mode
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
      className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center relative"
      style={{ zIndex: config.zIndex }}
    >
      <MessageCircle className="w-6 h-6" />
      {state.unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
          {state.unreadCount}
        </span>
      )}
    </motion.button>
  );

  // Render widget content
  const renderWidgetContent = () => (
    <Card className={`flex flex-col overflow-hidden shadow-2xl ${config.className}`}>
      {/* Header */}
      <CardHeader className="p-3 border-b bg-primary text-primary-foreground flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {config.branding?.title}
              </CardTitle>
              {config.branding?.subtitle && (
                <p className="text-xs text-primary-foreground/70">
                  {config.branding.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {config.features?.minimize && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={toggleMinimize}
              >
                {state.isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            )}
            {config.mode === 'floating' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
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
        {!state.isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[400px]">
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {state.isProcessing && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-3 bg-background">
              <div className="flex items-end gap-2">
                {config.voice?.enableVoiceInput && voiceSupported && (
                  <Button
                    variant={isListening ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => isListening ? stopListening() : startListening()}
                    disabled={state.isProcessing}
                    className={`flex-shrink-0 h-9 w-9 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                    data-mic-toggle
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}

                <textarea
                  ref={inputRef}
                  value={displayText}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'Listening...' : config.branding?.placeholder}
                  className="flex-1 min-h-[36px] max-h-[100px] px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={state.isProcessing}
                  rows={1}
                />

                {config.voice?.enableVoiceOutput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => isSpeaking ? stopSpeaking() : null}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    {isSpeaking ? (
                      <Volume2 className="h-4 w-4 animate-pulse text-primary" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}

                <Button
                  onClick={sendMessage}
                  disabled={!displayText.trim() || state.isProcessing}
                  size="icon"
                  className="flex-shrink-0 h-9 w-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {isListening && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  🎤 Listening... speak your question or command
                </p>
              )}

              {config.navigation?.enableDOMNavigation && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  <Navigation className="w-3 h-3 inline mr-1" />
                  Say "go to [section]" to navigate
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
        className={`voicedocs-widget fixed ${positionClasses[config.position || 'bottom-right']}`}
        style={{ zIndex: config.zIndex }}
      >
        <AnimatePresence mode="wait">
          {state.isOpen ? (
            <motion.div
              key="widget"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[350px] sm:w-[400px]"
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

  // Inline or fullscreen mode
  return (
    <div
      className={`voicedocs-widget ${config.mode === 'fullscreen' ? 'fixed inset-0' : 'w-full'} ${config.className}`}
      style={{ zIndex: config.mode === 'fullscreen' ? config.zIndex : undefined }}
    >
      {renderWidgetContent()}
    </div>
  );
}

// Default export as well for convenience
export default VoiceDocsWidget;
