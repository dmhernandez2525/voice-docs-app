import { useState, useRef, useCallback, useEffect } from 'react';
import type { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionErrorEvent 
} from '../types/speech';

export interface ContinuousVoiceOptions {
  silenceTimeout?: number; // milliseconds of silence before auto-processing
  language?: string;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  silenceTimer: number;
}

export const useContinuousVoiceRecognition = (
  onFinalTranscript: (transcript: string, confidence: number) => void,
  options: ContinuousVoiceOptions = {}
) => {
  const {
    silenceTimeout = 3000, // 3 seconds default
    language = 'en-US',
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isProcessing: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    silenceTimer: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const isManualStopRef = useRef<boolean>(false);

  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Start listening
  const startListening = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not available');
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true }));
      isManualStopRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.5;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        currentTranscript: interimTranscript,
        finalTranscript: prev.finalTranscript + finalTranscript,
        confidence: maxConfidence || prev.confidence,
      }));

      // Reset silence timer on speech
      lastSpeechTimeRef.current = Date.now();
      
      // Clear existing timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

             // Start new silence timer
       silenceTimerRef.current = setTimeout(() => {
         setState(prev => {
           const fullTranscript = (prev.finalTranscript + prev.currentTranscript).trim();
           if (fullTranscript) {
             onFinalTranscript(fullTranscript, maxConfidence || prev.confidence);
             return { 
               ...prev, 
               finalTranscript: '', 
               currentTranscript: '',
               isProcessing: true 
             };
           }
           return prev;
         });
       }, silenceTimeout);

      // Process final transcript immediately if available
      if (finalTranscript.trim()) {
        setState(prev => ({ 
          ...prev, 
          finalTranscript: '', 
          currentTranscript: '',
          isProcessing: true 
        }));
        onFinalTranscript(finalTranscript, maxConfidence);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setState(prev => ({ ...prev, isListening: false }));
      }
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, interimResults, maxAlternatives, silenceTimeout, onFinalTranscript]);

  // Stop listening
  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setState(prev => ({ ...prev, isListening: false, silenceTimer: 0 }));
  }, []);

  // Complete processing
  const completeProcessing = useCallback(() => {
    setState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isSupported,
    startListening,
    stopListening,
    completeProcessing,
  };
};
