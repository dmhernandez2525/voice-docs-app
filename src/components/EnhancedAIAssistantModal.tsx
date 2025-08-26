import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Volume2,
  VolumeX,

} from 'lucide-react';
import { useNotificationContext } from '../hooks/useNotificationContext';

import { aiService } from '../services/aiService';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useContinuousVoiceRecognition } from '../hooks/useContinuousVoiceRecognition';
import type { DirectAnswer, AIResponse } from '../types/documentation';

interface EnhancedAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToContent?: (contentId: string) => void;
}

type ConversationMode = 'manual' | 'talk';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  links?: AIResponse['links'];
}

const EnhancedAIAssistantModal: React.FC<EnhancedAIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToContent,
}) => {
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [mode, setMode] = useState<ConversationMode>('manual');
  const [isTalkModeActive, setIsTalkModeActive] = useState(false);

  const notification = useNotificationContext();
  const speechSynthesis = useSpeechSynthesis();
  
  // Continuous voice recognition for talk mode
  const voiceRecognition = useContinuousVoiceRecognition(
    async (transcript: string, confidence: number) => {
      console.log('Final transcript received:', transcript, 'Confidence:', confidence);
      await handleVoiceInput(transcript, confidence);
    },
    {
      silenceTimeout: 3000, // 3 seconds of silence
      language: 'en-US',
      interimResults: true,
    }
  );

  // Refs to break circular dependencies
  const speakResponseRef = useRef<((text: string) => Promise<void>) | null>(null);
  const voiceRecognitionRef = useRef(voiceRecognition);
  const speechSynthesisRef = useRef(speechSynthesis);

  // Handle voice input and process with AI
  const handleVoiceInput = useCallback(async (transcript: string, confidence: number) => {
    if (!transcript.trim()) return;

    const cleanTranscript = transcript.trim().toLowerCase();
    
    // Handle voice commands
    if (cleanTranscript === 'start' || cleanTranscript === 'start listening') {
      if (!isTalkModeActive) {
        setIsTalkModeActive(true);
        voiceRecognition.startListening().catch(console.error);
        notification.info('Voice listening started', { title: '🎤 Voice Control' });
      }
      return;
    }
    
    if (cleanTranscript === 'stop' || cleanTranscript === 'stop listening') {
      if (isTalkModeActive) {
        setIsTalkModeActive(false);
        voiceRecognition.stopListening();
        speechSynthesis.stop();
        notification.info('Voice listening stopped', { title: '🎤 Voice Control' });
      }
      return;
    }

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: transcript,
      timestamp: new Date(),
      confidence,
    };

    setConversation(prev => [...prev, userMessage]);
    setIsProcessingAI(true);

    try {
      // Get AI response
      const directAnswer = await aiService.answerQuestion(transcript);
      const links = extractLinksFromDirectAnswer(directAnswer);

      // Add AI response to conversation
      const assistantMessage: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: directAnswer.answer,
        timestamp: new Date(),
        links,
      };

      setConversation(prev => [...prev, assistantMessage]);

      // In talk mode, speak the response (auto-restart is handled in speakResponse)
      if (mode === 'talk' && isTalkModeActive && speakResponseRef.current) {
        await speakResponseRef.current(directAnswer.answer);
      }

      notification.success('AI response generated successfully!', {
        title: '🤖 AI Assistant',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      notification.error('Failed to get AI response. Please try again.');
      
      // In talk mode, restart listening even after error
      if (mode === 'talk' && isTalkModeActive) {
        setTimeout(() => {
          if (isTalkModeActive && voiceRecognitionRef.current?.isSupported) {
            voiceRecognitionRef.current?.startListening().catch(console.error);
          }
        }, 1000);
      }
    } finally {
      setIsProcessingAI(false);
      voiceRecognitionRef.current?.completeProcessing();
    }
  }, [mode, isTalkModeActive, notification, speechSynthesis, voiceRecognition]);

  // Speak AI response using browser TTS
  const speakResponse = useCallback(async (text: string) => {
    if (!speechSynthesisRef.current?.isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    try {
      // Clean up text for better speech
      const cleanText = text
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\*/g, '') // Remove markdown italic
        .replace(/`([^`]+)`/g, '$1') // Remove code backticks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
        .replace(/#{1,6}\s/g, '') // Remove markdown headers
        .replace(/\n\n/g, '. ') // Convert double newlines to periods
        .replace(/\n/g, ' '); // Convert single newlines to spaces

      await speechSynthesisRef.current.speak(cleanText, {
        rate: 0.9,
        pitch: 1,
        volume: 0.8,
      });

      // Auto-restart listening in talk mode after speaking completes
      if (mode === 'talk' && isTalkModeActive && voiceRecognitionRef.current?.isSupported) {
        setTimeout(() => {
          if (isTalkModeActive) { // Double-check mode is still active
            voiceRecognitionRef.current?.startListening().catch(console.error);
          }
        }, 500); // Small delay to ensure speech has fully completed
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      // Even on error, restart listening in talk mode
      if (mode === 'talk' && isTalkModeActive && voiceRecognitionRef.current?.isSupported) {
        setTimeout(() => {
          if (isTalkModeActive) {
            voiceRecognitionRef.current?.startListening().catch(console.error);
          }
        }, 500);
      }
    }
  }, [mode, isTalkModeActive]);

  // Update refs to break circular dependencies
  useEffect(() => {
    speakResponseRef.current = speakResponse;
    voiceRecognitionRef.current = voiceRecognition;
    speechSynthesisRef.current = speechSynthesis;
  }, [speakResponse, voiceRecognition, speechSynthesis]);

  // Toggle talk mode
  const toggleTalkMode = useCallback(async () => {
    if (mode === 'talk' && isTalkModeActive) {
      // Stop talk mode
      setIsTalkModeActive(false);
      voiceRecognitionRef.current?.stopListening();
      speechSynthesisRef.current?.stop();
      setMode('manual');
      notification.info('Talk mode stopped', { duration: 2000 });
    } else {
      // Start talk mode
      try {
        setMode('talk');
        setIsTalkModeActive(true);
        
        // Auto-start listening when entering talk mode
        await voiceRecognitionRef.current?.startListening();
        
        notification.success('Talk mode activated! Start speaking... Say "stop" to pause listening.', {
          title: '🎤 Talk Mode Active',
          duration: 4000,
        });
      } catch (error) {
        console.error('Failed to start talk mode:', error);
        notification.error('Failed to start talk mode. Please check microphone permissions.');
        setIsTalkModeActive(false);
        setMode('manual');
      }
    }
  }, [mode, isTalkModeActive, notification]);

  // Manual mode submission
  const handleManualSubmit = useCallback(async () => {
    if (!inputText.trim()) return;

    const transcript = inputText.trim();
    setInputText('');
    await handleVoiceInput(transcript, 1.0); // Manual input has 100% confidence
  }, [inputText, handleVoiceInput]);

  // Extract links from AI response
  const extractLinksFromDirectAnswer = (directAnswer: DirectAnswer): AIResponse['links'] => {
    const links: AIResponse['links'] = [];

    directAnswer.sources.forEach((source, index) => {
      links.push({
        title: source.title || `Documentation Source ${index + 1}`,
        url: `#${source.id}`,
        type: 'documentation' as const,
      });
    });

    if (directAnswer.actionableSteps && directAnswer.actionableSteps.length > 0) {
      links.push({
        title: 'Generated: Implementation Steps',
        url: '#generated-steps',
        type: 'generated' as const,
      });
    }

    if (directAnswer.followUpQuestions && directAnswer.followUpQuestions.length > 0) {
      links.push({
        title: 'Related Questions',
        url: '#follow-up-questions',
        type: 'external' as const,
      });
    }

    return links;
  };

  // Copy message content
  const copyMessage = (message: ConversationMessage) => {
    navigator.clipboard.writeText(message.content).then(
      () => notification.success('Message copied to clipboard!'),
      () => notification.error('Failed to copy message')
    );
  };

  // Handle link clicks
  const handleLinkClick = (link: { title: string; url: string; type: string }) => {
    if (link.type === 'external') {
      window.open(link.url, '_blank');
    } else if (onNavigateToContent) {
      onNavigateToContent(link.url);
    }
  };

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      setIsTalkModeActive(false);
      voiceRecognitionRef.current?.stopListening();
      speechSynthesisRef.current?.stop();
    }
  }, [isOpen]);

  // Format silence timer display
  const formatSilenceTimer = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xl font-bold">Enhanced AI Documentation Assistant</span>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                <span className="text-sm text-gray-500">
                  Voice-enabled • Continuous Conversation • Documentation Expert
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={mode === 'talk' ? 'default' : 'secondary'} className="text-xs">
                {mode === 'talk' ? 'Talk Mode' : 'Manual Mode'}
              </Badge>
              {speechSynthesis.isSpeaking && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Speaking
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Experience hands-free conversation with AI-powered documentation assistance. 
            Use Talk Mode for continuous voice interaction or Manual Mode for traditional input.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Controls */}
        <div className="flex-shrink-0 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleTalkMode}
                disabled={isProcessingAI}
                variant={isTalkModeActive ? 'destructive' : 'default'}
                className="flex items-center gap-2"
              >
                {isTalkModeActive ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Stop Talk Mode
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Start Talk Mode
                  </>
                )}
              </Button>

              {speechSynthesis.isSpeaking && (
                <Button
                  onClick={speechSynthesis.stop}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <VolumeX className="h-4 w-4" />
                  Stop Speaking
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {voiceRecognition.isListening && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                  {voiceRecognition.silenceTimer > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Auto-send in {formatSilenceTimer(voiceRecognition.silenceTimer)}
                    </Badge>
                  )}
                </>
              )}
              {isProcessingAI && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI Processing...</span>
                </>
              )}
            </div>
          </div>

          {/* Live Transcription Display */}
          {(voiceRecognition.currentTranscript || voiceRecognition.finalTranscript) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Live Transcription:</div>
              <div className="text-gray-900 dark:text-white">
                <span className="font-medium">{voiceRecognition.finalTranscript}</span>
                <span className="text-gray-500 italic">{voiceRecognition.currentTranscript}</span>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {conversation.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Ready for Conversation
                </h4>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  Start a conversation using Talk Mode for hands-free interaction, or use Manual Mode for traditional input.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={toggleTalkMode} variant="outline">
                    <Mic className="h-4 w-4 mr-2" />
                    Try Talk Mode
                  </Button>
                  <Button onClick={() => setMode('manual')} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Use Manual Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            conversation.map((message) => (
              <Card 
                key={message.id} 
                className={`${message.type === 'user' ? 'ml-8 border-l-4 border-l-blue-500' : 'mr-8 border-l-4 border-l-purple-500'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {message.type === 'user' ? (
                        <Mic className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Bot className="h-4 w-4 text-purple-500" />
                      )}
                      <Badge variant={message.type === 'user' ? 'outline' : 'secondary'} className="text-xs">
                        {message.type === 'user' ? 'You' : 'AI Assistant'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.confidence && message.confidence < 0.8 && (
                        <Badge variant="outline" className="text-xs">
                          Low confidence: {Math.round(message.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {message.type === 'assistant' && speechSynthesis.isSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speakResponse(message.content)}
                          disabled={speechSynthesis.isSpeaking}
                          className="h-8 w-8 p-0"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {/* Links for AI messages */}
                  {message.type === 'assistant' && message.links && message.links.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <ExternalLink className="h-4 w-4" />
                        Related Links
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {message.links.map((link, index) => (
                          <Button
                            key={`${message.id}-link-${index}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleLinkClick(link)}
                            className="justify-start h-auto p-2 text-left"
                          >
                            <div className="flex items-center gap-2 w-full">
                              {link.type === 'generated' ? (
                                <FileText className="h-3 w-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs truncate">{link.title}</div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {link.type}
                                </Badge>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Manual Input Area */}
        {mode === 'manual' && (
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your question or switch to Talk Mode for voice interaction..."
                className="flex-1 min-h-[60px] resize-none"
                disabled={isProcessingAI}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleManualSubmit();
                  }
                }}
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!inputText.trim() || isProcessingAI}
                className="px-6"
              >
                {isProcessingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAIAssistantModal;
