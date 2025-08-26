import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for speech synthesis support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load available voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Select a good default voice (prefer English)
        const englishVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && voice.localService
        ) || availableVoices.find(voice => 
          voice.lang.startsWith('en')
        ) || availableVoices[0];
        
        if (englishVoice && !selectedVoice) {
          setSelectedVoice(englishVoice);
        }
      };

      // Load voices immediately if available
      loadVoices();
      
      // Also listen for voices changed event (some browsers load voices asynchronously)
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [selectedVoice]);

  const speak = useCallback((
    text: string, 
    options: SpeechSynthesisOptions = {}
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configure utterance
      utterance.voice = options.voice || selectedVoice;
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.lang = options.lang || 'en-US';

      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Start speaking
      speechSynthesis.speak(utterance);
    });
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported) {
      speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stop,
    pause,
    resume,
  };
};
