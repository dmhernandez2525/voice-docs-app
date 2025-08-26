import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useNotificationContext } from '../hooks/useNotificationContext';
import { permissionManager } from '../utils/permissionManager';
import { aiService } from '../services/aiService';
import type { DirectAnswer, AIResponse } from '../types/documentation';
import type { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionErrorEvent 
} from '../types/speech';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToContent?: (contentId: string) => void;
}

interface VoiceRecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  audioBlob: Blob | null;
  transcription: string;
  volume: number;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToContent,
}) => {
  const [inputText, setInputText] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>({
    isRecording: false,
    isTranscribing: false,
    audioBlob: null,
    transcription: '',
    volume: 0.8,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const notification = useNotificationContext();

  const speechRecognition = useRef<SpeechRecognition | null>(null);

  const stopRecording = useCallback(() => {
    if (speechRecognition.current && voiceState.isRecording) {
      speechRecognition.current.stop();
      setVoiceState((prev) => ({ ...prev, isRecording: false }));
      return;
    }

    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      setVoiceState((prev) => ({ ...prev, isRecording: false }));
    }
  }, [voiceState.isRecording]);

  // Initialize speech recognition if available
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        speechRecognition.current = new SpeechRecognition();
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = true;
        speechRecognition.current.lang = 'en-US';

        speechRecognition.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setVoiceState((prev) => ({ ...prev, transcription: finalTranscript }));
            setInputText(finalTranscript);
          }
        };

        speechRecognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error:', event.error);
          let errorMessage = 'Voice recognition failed. Please try typing your question instead.';
          if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access denied. Please enable microphone permissions and try again.';
          } else if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try speaking again.';
          }
          notification.error(errorMessage);
          stopRecording();
        };
      }
    }
  }, [notification, stopRecording]);

  const startRecording = async () => {
    try {
      // Check microphone permission first
      const micPermission = await permissionManager.checkMicrophonePermission();

      if (micPermission.state === 'denied') {
        notification.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
        return;
      }

      // Try speech recognition first (more reliable)
      if (speechRecognition.current) {
        setVoiceState((prev) => ({ ...prev, isRecording: true, transcription: '' }));
        speechRecognition.current.start();
        notification.info('Listening... Speak your question now.', {
          title: '🎤 Voice Recording Active',
          duration: 3000,
        });
        return;
      }

      // Fallback to MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setVoiceState((prev) => ({ ...prev, audioBlob, isTranscribing: true }));

        // Simulate transcription (in real app, you'd send to a transcription service)
        await simulateTranscription(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setVoiceState((prev) => ({ ...prev, isRecording: true }));

      notification.info('Recording started. Click the microphone again to stop.', {
        title: '🎤 Voice Recording',
        duration: 3000,
      });
    } catch (error: unknown) {
      console.error('Error starting recording:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        notification.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
      } else {
        notification.error('Could not access microphone. Please check permissions.');
      }
    }
  };

  const simulateTranscription = async (audioBlob: Blob): Promise<void> => {
    if (!audioBlob || audioBlob.size === 0) {
      notification.error('Invalid audio recording. Please try again.');
      setVoiceState((prev) => ({ ...prev, isTranscribing: false }));
      return;
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock transcriptions for demo
    const mockTranscriptions = [
      'How do I use voice transcription in this documentation system?',
      'What are the AI assistant capabilities?',
      'Show me how to search through documentation',
      'How do I configure the voice recognition features?',
      'What documentation sections are available?',
    ];

    const mockTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    setVoiceState((prev) => ({
      ...prev,
      transcription: mockTranscription,
      isTranscribing: false,
    }));
    setInputText(mockTranscription);

    notification.success('Voice transcribed successfully!', {
      title: '✅ Transcription Complete',
      duration: 3000,
    });
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    const question = inputText.trim();
    setInputText('');
    setVoiceState((prev) => ({ ...prev, transcription: '' }));
    setIsProcessing(true);

    try {
      const directAnswer = await aiService.answerQuestion(question);

      // Parse response for links from sources and actionable steps
      const links = extractLinksFromDirectAnswer(directAnswer);

      const newResponse: AIResponse = {
        id: Date.now().toString(),
        question,
        answer: directAnswer.answer,
        timestamp: new Date(),
        links,
      };

      setResponses((prev) => [newResponse, ...prev]);

      notification.success('AI response generated successfully!', {
        title: '🤖 AI Assistant',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      notification.error('Failed to get AI response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractLinksFromDirectAnswer = (directAnswer: DirectAnswer): AIResponse['links'] => {
    const links: AIResponse['links'] = [];

    // Add links from sources
    directAnswer.sources.forEach((source, index) => {
      links.push({
        title: source.title || `Documentation Source ${index + 1}`,
        url: `#${source.id}`,
        type: 'documentation' as const,
      });
    });

    // Add actionable steps as generated content links
    if (directAnswer.actionableSteps && directAnswer.actionableSteps.length > 0) {
      links.push({
        title: 'Generated: Implementation Steps',
        url: '#generated-steps',
        type: 'generated' as const,
      });
    }

    // Add follow-up questions as related topics
    if (directAnswer.followUpQuestions && directAnswer.followUpQuestions.length > 0) {
      links.push({
        title: 'Related Questions',
        url: '#follow-up-questions',
        type: 'external' as const,
      });
    }

    return links;
  };

  const copyResponse = (response: AIResponse) => {
    navigator.clipboard.writeText(response.answer).then(
      () => {
        notification.success('Response copied to clipboard!');
      },
      () => {
        notification.error('Failed to copy response');
      }
    );
  };

  const handleLinkClick = (link: { title: string; url: string; type: string }) => {
    if (link.type === 'external') {
      window.open(link.url, '_blank');
    } else if (onNavigateToContent) {
      onNavigateToContent(link.url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">AI Documentation Assistant</span>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                <span className="text-sm text-gray-500">
                  Voice-enabled • Documentation Generator
                </span>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Ask questions about the documentation system, generate content, or get help
            with features. Use voice commands or type your questions.
          </DialogDescription>
        </DialogHeader>

        {/* Voice Recording Controls */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              onClick={voiceState.isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant={voiceState.isRecording ? 'destructive' : 'default'}
              className="flex items-center gap-2"
            >
              {voiceState.isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Voice Recording
                </>
              )}
            </Button>
          </div>

          {voiceState.isRecording && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Recording... Speak now
            </div>
          )}

          {voiceState.transcription && (
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                <strong>Transcription:</strong> {voiceState.transcription}
              </p>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about the documentation system, or use voice recording above..."
              className="flex-1 min-h-[100px] resize-none"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
              className="px-6"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Ask Question
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Responses Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Responses</h3>
          {responses.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No questions asked yet
                </h4>
                <p className="text-gray-500 dark:text-gray-500">
                  Ask a question above or use voice recording to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            responses.map((response) => (
              <Card key={response.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Question
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {response.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-3">{response.question}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyResponse(response)}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-purple-500" />
                        <Badge variant="secondary" className="text-xs">
                          AI Response
                        </Badge>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {response.answer}
                        </p>
                      </div>
                    </div>

                    {response.links && response.links.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Related Links
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {response.links.map((link, index) => (
                            <Button
                              key={`${response.id}-link-${index}-${link.title}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleLinkClick(link)}
                              className="justify-start h-auto p-3 text-left"
                            >
                              <div className="flex items-center gap-2 w-full">
                                {link.type === 'generated' ? (
                                  <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{link.title}</div>
                                  <Badge
                                    variant={link.type === 'generated' ? 'default' : 'secondary'}
                                    className="text-xs mt-1"
                                  >
                                    {link.type}
                                  </Badge>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistantModal;
