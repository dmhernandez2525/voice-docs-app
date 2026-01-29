/**
 * useSpeechSynthesis Hook
 *
 * A robust, feature-rich Text-to-Speech hook that handles:
 * - Chrome's async voice loading
 * - Promise-based speak() for async control (Talk Mode integration)
 * - Configurable enabled toggle for UI controls
 * - Voice selection with preference for local/English voices
 * - Pause/resume support
 * - Debug logging (optional)
 *
 * This hook is the source of truth for TTS functionality.
 * Portfolio and other apps should use this version.
 *
 * IMPORTANT: This hook does NOT block on "user interaction" state.
 * Browser autoplay policies handle this naturally - if the user hasn't
 * interacted yet, the browser simply won't play audio. We don't need
 * to track this ourselves (and doing so caused bugs).
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface SpeechSynthesisOptions {
  /** Voice object or voice name string */
  voice?: SpeechSynthesisVoice | string | null;
  /** Speech rate (0.1 to 10, default: 1.0) */
  rate?: number;
  /** Speech pitch (0 to 2, default: 1.0) */
  pitch?: number;
  /** Volume (0 to 1, default: 0.8) */
  volume?: number;
  /** Language code (default: 'en-US') */
  lang?: string;
}

export interface UseSpeechSynthesisOptions {
  /** Initial enabled state (default: true) */
  initialEnabled?: boolean;
  /** Default speech rate (default: 1.0) */
  defaultRate?: number;
  /** Default pitch (default: 1.0) */
  defaultPitch?: number;
  /** Default volume (default: 0.8) */
  defaultVolume?: number;
  /** Default language (default: 'en-US') */
  defaultLang?: string;
  /** Prefer local voices over network voices (default: true) */
  preferLocalVoice?: boolean;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech ends */
  onEnd?: () => void;
  /** Callback when speech is paused */
  onPause?: () => void;
  /** Callback when speech is resumed */
  onResume?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback on word boundary */
  onBoundary?: (charIndex: number, charLength: number) => void;
}

export interface UseSpeechSynthesisReturn {
  // Core functions
  /** Speak text. Returns a Promise that resolves when speech ends. */
  speak: (text: string, options?: SpeechSynthesisOptions) => Promise<void>;
  /** Stop all speech */
  stop: () => void;
  /** Pause current speech */
  pause: () => void;
  /** Resume paused speech */
  resume: () => void;

  // State
  /** Whether speech synthesis is supported in this browser */
  isSupported: boolean;
  /** Whether currently speaking */
  isSpeaking: boolean;
  /** Whether speech is paused */
  isPaused: boolean;
  /** Whether voices have loaded (ready to speak) */
  isReady: boolean;

  // Enabled control (for UI toggle)
  /** Whether TTS is enabled by the user */
  enabled: boolean;
  /** Set enabled state */
  setEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  /** Toggle enabled state */
  toggleEnabled: () => void;

  // Voice selection
  /** Available voices */
  voices: SpeechSynthesisVoice[];
  /** Currently selected voice */
  selectedVoice: SpeechSynthesisVoice | null;
  /** Set the voice by object or name */
  setVoice: (voice: SpeechSynthesisVoice | string | null) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const {
    initialEnabled = true,
    defaultRate = 1.0,
    defaultPitch = 1.0,
    defaultVolume = 0.8,
    defaultLang = 'en-US',
    preferLocalVoice = true,
    debug = false,
    onStart,
    onEnd,
    onPause,
    onResume,
    onError,
    onBoundary,
  } = options;

  // State
  const [enabled, setEnabledState] = useState(initialEnabled);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Refs for stable callbacks and current utterance tracking
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);

  // Check if speech synthesis is available
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const isReady = voices.length > 0;

  // Debug logging helper
  const log = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (debug) {
        console.log(`[TTS] ${message}`, data ?? '');
      }
    },
    [debug]
  );

  // ============================================================================
  // Voice Loading
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) return;

      setVoices(availableVoices);
      log('Voices loaded', { count: availableVoices.length });

      // Auto-select a good default voice if none selected
      if (!selectedVoice) {
        const defaultVoice = selectDefaultVoice(availableVoices, defaultLang, preferLocalVoice);
        if (defaultVoice) {
          setSelectedVoice(defaultVoice);
          log('Auto-selected voice', { name: defaultVoice.name, lang: defaultVoice.lang });
        }
      }
    };

    // Load voices immediately (Firefox has them ready synchronously)
    loadVoices();

    // Chrome loads voices asynchronously
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported, defaultLang, preferLocalVoice, selectedVoice, log]);

  // ============================================================================
  // Cleanup on Unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // ============================================================================
  // Core Functions
  // ============================================================================

  /**
   * Speak text with optional options override.
   * Returns a Promise that resolves when speech ends, or rejects on error.
   */
  const speak = useCallback(
    (text: string, speakOptions: SpeechSynthesisOptions = {}): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if enabled
        if (!enabled) {
          log('TTS disabled, ignoring speak request');
          resolve();
          return;
        }

        // Check browser support
        if (!isSupported) {
          const error = new Error('Speech synthesis not supported');
          log('Speech synthesis not supported');
          onError?.(error);
          reject(error);
          return;
        }

        // Check if voices are loaded
        if (!isReady) {
          log('Voices not loaded yet, waiting...');
          // Wait for voices to load, then try again
          const checkVoices = setInterval(() => {
            if (window.speechSynthesis.getVoices().length > 0) {
              clearInterval(checkVoices);
              speak(text, speakOptions).then(resolve).catch(reject);
            }
          }, 100);

          // Timeout after 3 seconds
          setTimeout(() => {
            clearInterval(checkVoices);
            if (window.speechSynthesis.getVoices().length === 0) {
              const error = new Error('Voices failed to load');
              onError?.(error);
              reject(error);
            }
          }, 3000);
          return;
        }

        log('Speaking', { textLength: text.length, options: speakOptions });

        // Set isSpeaking IMMEDIATELY so other callers know we're about to speak
        // (onstart may take 100-200ms to fire, causing race conditions)
        setIsSpeaking(true);

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Resolve any pending promise (cancellation is not an error)
        if (resolveRef.current) {
          resolveRef.current();
          resolveRef.current = null;
          rejectRef.current = null;
        }

        // Store promise handlers
        resolveRef.current = resolve;
        rejectRef.current = reject;

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speakOptions.rate ?? defaultRate;
        utterance.pitch = speakOptions.pitch ?? defaultPitch;
        utterance.volume = speakOptions.volume ?? defaultVolume;
        utterance.lang = speakOptions.lang ?? defaultLang;

        // Set voice
        const voiceToUse = resolveVoice(speakOptions.voice, selectedVoice, voices);
        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }

        // Event handlers
        utterance.onstart = () => {
          log('Speech started');
          setIsSpeaking(true);
          setIsPaused(false);
          onStart?.();
        };

        utterance.onend = () => {
          log('Speech ended');
          setIsSpeaking(false);
          setIsPaused(false);
          utteranceRef.current = null;
          onEnd?.();
          resolveRef.current?.();
          resolveRef.current = null;
          rejectRef.current = null;
        };

        utterance.onpause = () => {
          log('Speech paused');
          setIsPaused(true);
          onPause?.();
        };

        utterance.onresume = () => {
          log('Speech resumed');
          setIsPaused(false);
          onResume?.();
        };

        utterance.onerror = (event) => {
          // 'interrupted' and 'cancelled' are not real errors
          if (event.error === 'interrupted' || event.error === 'canceled') {
            log('Speech interrupted/cancelled');
            setIsSpeaking(false);
            setIsPaused(false);
            utteranceRef.current = null;
            resolveRef.current?.();
            resolveRef.current = null;
            rejectRef.current = null;
            return;
          }

          log('Speech error', { error: event.error });
          setIsSpeaking(false);
          setIsPaused(false);
          utteranceRef.current = null;
          const error = new Error(`Speech synthesis error: ${event.error}`);
          onError?.(error);
          rejectRef.current?.(error);
          resolveRef.current = null;
          rejectRef.current = null;
        };

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            onBoundary?.(event.charIndex, event.charLength ?? 0);
          }
        };

        // Store utterance reference
        utteranceRef.current = utterance;

        // Start speaking
        window.speechSynthesis.speak(utterance);

        // NOTE: Removed the 100ms Chrome workaround as it was causing speech to be
        // cancelled before the browser's onstart event could fire. The browser needs
        // ~150-200ms to initialize audio playback, and the 100ms timeout was killing
        // speech prematurely. If speech gets stuck, the user can stop/retry manually.
      });
    },
    [
      enabled,
      isSupported,
      isReady,
      defaultRate,
      defaultPitch,
      defaultVolume,
      defaultLang,
      selectedVoice,
      voices,
      log,
      onStart,
      onEnd,
      onPause,
      onResume,
      onError,
      onBoundary,
    ]
  );

  /**
   * Stop all speech
   */
  const stop = useCallback(() => {
    if (!isSupported) return;

    log('Stopping speech');
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;

    // Resolve pending promise
    resolveRef.current?.();
    resolveRef.current = null;
    rejectRef.current = null;
  }, [isSupported, log]);

  /**
   * Pause current speech
   */
  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;

    log('Pausing speech');
    window.speechSynthesis.pause();
  }, [isSupported, isSpeaking, log]);

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;

    log('Resuming speech');
    window.speechSynthesis.resume();
  }, [isSupported, isPaused, log]);

  // ============================================================================
  // Enabled Control
  // ============================================================================

  const setEnabled = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setEnabledState((prev) => {
        const newValue = typeof value === 'function' ? value(prev) : value;

        // Stop any ongoing speech when disabling
        if (!newValue && isSupported) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setIsPaused(false);
        }

        log('TTS enabled changed', { enabled: newValue });
        return newValue;
      });
    },
    [isSupported, log]
  );

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, [setEnabled]);

  // ============================================================================
  // Voice Selection
  // ============================================================================

  const setVoice = useCallback(
    (voice: SpeechSynthesisVoice | string | null) => {
      if (voice === null) {
        setSelectedVoice(null);
        log('Voice cleared');
        return;
      }

      if (typeof voice === 'string') {
        const found = voices.find((v) => v.name === voice || v.voiceURI === voice);
        if (found) {
          setSelectedVoice(found);
          log('Voice set by name', { name: found.name });
        } else {
          log('Voice not found', { name: voice });
        }
        return;
      }

      setSelectedVoice(voice);
      log('Voice set', { name: voice.name });
    },
    [voices, log]
  );

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    speak,
    stop,
    pause,
    resume,
    isSupported,
    isSpeaking,
    isPaused,
    isReady,
    enabled,
    setEnabled,
    toggleEnabled,
    voices,
    selectedVoice,
    setVoice,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Select a default voice based on preferences
 */
function selectDefaultVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferLocal: boolean
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const langPrefix = lang.split('-')[0]; // 'en' from 'en-US'

  // Strategy: find the best match based on preferences
  const candidates = voices.filter((v) => v.lang.startsWith(langPrefix));

  if (candidates.length === 0) {
    // Fall back to any available voice
    return voices[0];
  }

  if (preferLocal) {
    // Prefer local voices (faster, work offline)
    const localVoice = candidates.find((v) => v.localService);
    if (localVoice) return localVoice;
  }

  // Return first matching language voice
  return candidates[0];
}

/**
 * Resolve a voice option to an actual SpeechSynthesisVoice
 */
function resolveVoice(
  voiceOption: SpeechSynthesisVoice | string | null | undefined,
  selectedVoice: SpeechSynthesisVoice | null,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voiceOption) {
    return selectedVoice;
  }

  if (typeof voiceOption === 'string') {
    return voices.find((v) => v.name === voiceOption || v.voiceURI === voiceOption) ?? selectedVoice;
  }

  return voiceOption;
}

export default useSpeechSynthesis;
