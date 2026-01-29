/**
 * useContinuousVoiceRecognition Hook
 *
 * A robust continuous voice recognition hook for Talk Mode.
 *
 * Features:
 * - Continuous listening with auto-restart on recognition end
 * - Silence detection with configurable timeout
 * - Interim results for live transcription display
 * - Integration-ready with TTS for Talk Mode cycle
 * - Proper cleanup and error handling
 *
 * Talk Mode Flow:
 * 1. User speaks -> recognition captures transcript
 * 2. Silence detected -> onFinalTranscript called
 * 3. App processes and speaks response via TTS
 * 4. TTS ends -> app calls startListening() to continue
 *
 * This creates a natural conversation loop.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ContinuousVoiceOptions {
  /** Milliseconds of silence before auto-processing (default: 2000) */
  silenceTimeout?: number;
  /** Language code for recognition (default: 'en-US') */
  language?: string;
  /** Whether to show interim results (default: true) */
  interimResults?: boolean;
  /** Number of alternative transcriptions (default: 1) */
  maxAlternatives?: number;
  /** Auto-restart recognition when it ends (default: false) */
  autoRestart?: boolean;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export interface VoiceRecognitionState {
  /** Whether actively listening */
  isListening: boolean;
  /** Whether processing a transcript (between recognition and response) */
  isProcessing: boolean;
  /** Current interim transcript (not yet finalized) */
  interimTranscript: string;
  /** Accumulated final transcript */
  finalTranscript: string;
  /** Recognition confidence (0-1) */
  confidence: number;
  /** Time remaining until auto-send (ms) */
  silenceTimer: number;
  /** Last error message */
  error: string | null;
}

export interface UseContinuousVoiceRecognitionReturn extends VoiceRecognitionState {
  /** Whether speech recognition is supported */
  isSupported: boolean;
  /** Start listening */
  startListening: () => Promise<void>;
  /** Stop listening */
  stopListening: () => void;
  /** Clear the current transcript without processing */
  clearTranscript: () => void;
  /** Signal that processing is complete (call after handling transcript) */
  completeProcessing: () => void;
  /** Manually submit current transcript */
  submitTranscript: () => void;
  /** @deprecated Use interimTranscript instead. Alias for backward compatibility. */
  currentTranscript: string;
}

// Use types from src/types/speech.ts
import type {
  SpeechRecognition as SpeechRecognitionType,
  SpeechRecognitionEvent as SpeechRecognitionEventType,
  SpeechRecognitionErrorEvent as SpeechRecognitionErrorEventType,
} from '../types/speech';

// ============================================================================
// Hook Implementation
// ============================================================================

export function useContinuousVoiceRecognition(
  onFinalTranscript: (transcript: string, confidence: number) => void | Promise<void>,
  options: ContinuousVoiceOptions = {}
): UseContinuousVoiceRecognitionReturn {
  const {
    silenceTimeout = 2000,
    language = 'en-US',
    interimResults = true,
    maxAlternatives = 1,
    autoRestart = false,
    debug = false,
  } = options;

  // State
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isProcessing: false,
    interimTranscript: '',
    finalTranscript: '',
    confidence: 0,
    silenceTimer: 0,
    error: null,
  });

  // Refs
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManualStopRef = useRef(false);
  const lastSpeechTimeRef = useRef(0);
  const accumulatedTranscriptRef = useRef('');

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Debug logging
  const log = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (debug) {
        console.log(`[VoiceRecognition] ${message}`, data ?? '');
      }
    },
    [debug]
  );

  // ============================================================================
  // Silence Timer Management
  // ============================================================================

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    setState((prev) => ({ ...prev, silenceTimer: 0 }));
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    lastSpeechTimeRef.current = Date.now();

    // Update countdown display
    silenceIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSpeechTimeRef.current;
      const remaining = Math.max(0, silenceTimeout - elapsed);
      setState((prev) => ({ ...prev, silenceTimer: remaining }));
    }, 100);

    // Trigger auto-send after silence
    silenceTimerRef.current = setTimeout(() => {
      clearSilenceTimer();

      setState((prev) => {
        const fullTranscript = (accumulatedTranscriptRef.current + ' ' + prev.interimTranscript).trim();

        if (fullTranscript) {
          log('Silence detected, submitting transcript', { transcript: fullTranscript });

          // Call the callback
          Promise.resolve(onFinalTranscript(fullTranscript, prev.confidence)).catch((err) => {
            log('Error in onFinalTranscript callback', { error: err });
          });

          // Reset transcript
          accumulatedTranscriptRef.current = '';

          return {
            ...prev,
            isProcessing: true,
            finalTranscript: '',
            interimTranscript: '',
            silenceTimer: 0,
          };
        }

        return prev;
      });
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer, onFinalTranscript, log]);

  // ============================================================================
  // Recognition Management
  // ============================================================================

  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    clearSilenceTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isListening: false,
      silenceTimer: 0,
    }));

    log('Stopped listening');
  }, [clearSilenceTimer, log]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      const error = 'Speech recognition not supported in this browser';
      setState((prev) => ({ ...prev, error }));
      throw new Error(error);
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          throw new Error('SpeechRecognition not available');
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = interimResults;
        recognition.lang = language;
        recognition.maxAlternatives = maxAlternatives;

        recognition.onstart = () => {
          isManualStopRef.current = false;
          accumulatedTranscriptRef.current = '';

          setState((prev) => ({
            ...prev,
            isListening: true,
            isProcessing: false,
            error: null,
            interimTranscript: '',
            finalTranscript: '',
          }));

          log('Started listening');
          resolve();
        };

        recognition.onresult = (event: SpeechRecognitionEventType) => {
          let interim = '';
          let final = '';
          let maxConfidence = 0;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 0.8;

            if (result.isFinal) {
              final += transcript;
              maxConfidence = Math.max(maxConfidence, confidence);
            } else {
              interim += transcript;
            }
          }

          // Accumulate final transcripts
          if (final) {
            accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + final).trim();
          }

          setState((prev) => ({
            ...prev,
            interimTranscript: interim,
            finalTranscript: accumulatedTranscriptRef.current,
            confidence: maxConfidence || prev.confidence,
          }));

          // Reset silence timer on any speech
          if (interim || final) {
            startSilenceTimer();
          }

          log('Recognition result', {
            interim,
            final,
            accumulated: accumulatedTranscriptRef.current,
          });
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
          log('Recognition error', { error: event.error });

          // Handle different error types
          switch (event.error) {
            case 'not-allowed':
              setState((prev) => ({
                ...prev,
                isListening: false,
                error: 'Microphone access denied. Please allow microphone access.',
              }));
              reject(new Error('Microphone access denied'));
              break;

            case 'audio-capture':
              setState((prev) => ({
                ...prev,
                isListening: false,
                error: 'No microphone found. Please connect a microphone.',
              }));
              reject(new Error('No microphone found'));
              break;

            case 'network':
              setState((prev) => ({
                ...prev,
                error: 'Network error. Check your connection.',
              }));
              // Don't stop listening on network errors - may recover
              break;

            case 'no-speech':
              // This is normal - no speech detected in the audio
              log('No speech detected');
              break;

            case 'aborted':
              // Intentional abort, not an error
              break;

            default:
              setState((prev) => ({
                ...prev,
                error: `Recognition error: ${event.error}`,
              }));
          }
        };

        recognition.onend = () => {
          log('Recognition ended', { manualStop: isManualStopRef.current, autoRestart });

          // Don't auto-restart if manually stopped
          if (isManualStopRef.current) {
            setState((prev) => ({ ...prev, isListening: false }));
            return;
          }

          // Auto-restart if enabled and not processing
          if (autoRestart) {
            setState((prev) => {
              if (!prev.isProcessing) {
                log('Auto-restarting recognition');
                setTimeout(() => {
                  startListening().catch((err) => {
                    log('Auto-restart failed', { error: err });
                  });
                }, 100);
              }
              return { ...prev, isListening: false };
            });
          } else {
            setState((prev) => ({ ...prev, isListening: false }));
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start recognition';
        setState((prev) => ({ ...prev, error: errorMessage }));
        log('Failed to start recognition', { error });
        reject(error);
      }
    });
  }, [isSupported, language, interimResults, maxAlternatives, autoRestart, startSilenceTimer, log]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const clearTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = '';
    setState((prev) => ({
      ...prev,
      interimTranscript: '',
      finalTranscript: '',
      confidence: 0,
    }));
    clearSilenceTimer();
    log('Transcript cleared');
  }, [clearSilenceTimer, log]);

  const completeProcessing = useCallback(() => {
    setState((prev) => ({ ...prev, isProcessing: false }));
    log('Processing complete');
  }, [log]);

  const submitTranscript = useCallback(() => {
    clearSilenceTimer();

    setState((prev) => {
      const fullTranscript = (accumulatedTranscriptRef.current + ' ' + prev.interimTranscript).trim();

      if (fullTranscript) {
        log('Manually submitting transcript', { transcript: fullTranscript });

        Promise.resolve(onFinalTranscript(fullTranscript, prev.confidence)).catch((err) => {
          log('Error in onFinalTranscript callback', { error: err });
        });

        accumulatedTranscriptRef.current = '';

        return {
          ...prev,
          isProcessing: true,
          finalTranscript: '',
          interimTranscript: '',
        };
      }

      return prev;
    });
  }, [clearSilenceTimer, onFinalTranscript, log]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [clearSilenceTimer]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    ...state,
    // Backward compatibility alias
    currentTranscript: state.interimTranscript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    completeProcessing,
    submitTranscript,
  };
}

export default useContinuousVoiceRecognition;
