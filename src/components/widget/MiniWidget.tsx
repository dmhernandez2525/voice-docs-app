import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Bot, Loader2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useContinuousVoiceRecognition } from '../../hooks/useContinuousVoiceRecognition';
import type { WidgetConfig, DocumentationContent } from '../../types/widget';
import { defaultWidgetConfig } from '../../types/widget';
import { DOMNavigator } from '../../services/domNavigator';

interface MiniWidgetProps {
  config?: Partial<WidgetConfig>;
  onClose?: () => void;
  className?: string;
}

/**
 * MiniWidget - A compact inline version of the voice assistant
 * Perfect for embedding in sidebars, headers, or as a quick access point
 */
export function MiniWidget({ config: userConfig, onClose, className = '' }: MiniWidgetProps) {
  const config = {
    ...defaultWidgetConfig,
    ...userConfig,
    branding: { ...defaultWidgetConfig.branding, ...userConfig?.branding },
    voice: { ...defaultWidgetConfig.voice, ...userConfig?.voice },
  };

  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigatorRef = useRef<DOMNavigator | null>(null);
  const [pageContent, setPageContent] = useState<DocumentationContent[]>([]);

  // Initialize navigator
  useEffect(() => {
    navigatorRef.current = new DOMNavigator();
    const content = navigatorRef.current.extractPageContent();
    setPageContent(content);
  }, []);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => (prev + ' ' + text).trim());
  }, []);

  const {
    isListening,
    currentTranscript,
    startListening,
    stopListening,
    isSupported,
  } = useContinuousVoiceRecognition(handleVoiceResult, {
    language: config.voice?.language,
    silenceTimeout: config.voice?.silenceTimeout,
  });

  const handleSubmit = useCallback(async () => {
    const query = input.trim();
    if (!query || isProcessing) return;

    if (isListening) stopListening();
    setIsProcessing(true);
    setShowResponse(true);

    try {
      // Check for navigation
      const navMatch = query.match(/(?:go to|navigate to|show me)\s+(.+)/i);
      if (navMatch && navigatorRef.current) {
        const target = navMatch[1].trim();
        const navTarget = navigatorRef.current.findBestMatch(target);

        if (navTarget) {
          const success = await navigatorRef.current.navigateTo(navTarget);
          if (success) {
            setResponse(`Navigated to "${navTarget.label}"`);
            setInput('');
            return;
          }
        }
        setResponse(`Couldn't find "${target}". Try asking about what's on this page.`);
        return;
      }

      // Generate simple response
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes('help')) {
        setResponse('Ask me to navigate ("go to section"), or about page content.');
      } else if (lowerQuery.includes('what') && lowerQuery.includes('page')) {
        const sections = pageContent.slice(0, 3).map(c => c.title).join(', ');
        setResponse(`This page has: ${sections}`);
      } else {
        // Search content
        for (const content of pageContent) {
          if (content.title.toLowerCase().includes(lowerQuery) ||
              content.content.toLowerCase().includes(lowerQuery)) {
            setResponse(content.content.slice(0, 150) + '...');
            return;
          }
        }
        setResponse('Say "go to [section]" to navigate, or ask about the page content.');
      }
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  }, [input, isProcessing, isListening, stopListening, pageContent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowResponse(false);
      onClose?.();
    }
  };

  const displayText = input + (currentTranscript ? (input ? ' ' : '') + currentTranscript : '');

  return (
    <div className={`bg-card border rounded-lg shadow-sm ${className}`}>
      <div className="p-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={displayText}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Ask or say "go to..."'}
            className="flex-1 h-8 px-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
            disabled={isProcessing}
          />

          {config.voice?.enableVoiceInput && isSupported && (
            <Button
              variant={isListening ? 'default' : 'ghost'}
              size="icon"
              onClick={() => isListening ? stopListening() : startListening()}
              className={`h-7 w-7 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSubmit}
            disabled={!displayText.trim() || isProcessing}
            className="h-7 w-7"
          >
            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Response area */}
      {showResponse && response && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t"
        >
          <div className="p-2 text-xs text-muted-foreground bg-muted/30">
            {response}
          </div>
        </motion.div>
      )}
    </div>
  );
}
