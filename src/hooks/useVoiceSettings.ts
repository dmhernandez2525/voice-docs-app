import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface VoiceSettings {
  // Speech Recognition Settings
  language: string;
  silenceTimeout: number;
  interimResults: boolean;
  maxAlternatives: number;
  
  // Speech Synthesis Settings
  voice: string | null; // Voice name
  rate: number;
  pitch: number;
  volume: number;
  
  // UI Settings
  showLiveTranscription: boolean;
  showConfidenceScores: boolean;
  autoStartListening: boolean;
  
  // Advanced Settings
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  // Speech Recognition
  language: 'en-US',
  silenceTimeout: 3000, // 3 seconds
  interimResults: true,
  maxAlternatives: 1,
  
  // Speech Synthesis
  voice: null, // Will use browser default
  rate: 0.9,
  pitch: 1.0,
  volume: 0.8,
  
  // UI Settings
  showLiveTranscription: true,
  showConfidenceScores: true,
  autoStartListening: true,
  
  // Advanced Settings
  noiseReduction: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const useVoiceSettings = () => {
  const [settings, setSettings, resetSettings] = useLocalStorage<VoiceSettings>(
    'voice-docs-settings',
    DEFAULT_SETTINGS
  );

  // Update a specific setting
  const updateSetting = useCallback(<K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, [setSettings]);

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, [setSettings]);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  // Get audio constraints for getUserMedia based on settings
  const getAudioConstraints = useCallback(() => {
    return {
      audio: {
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseReduction,
        autoGainControl: settings.autoGainControl,
        sampleRate: 44100,
        channelCount: 1,
      },
    };
  }, [settings.echoCancellation, settings.noiseReduction, settings.autoGainControl]);

  // Get speech recognition configuration
  const getSpeechRecognitionConfig = useCallback(() => {
    return {
      lang: settings.language,
      continuous: true,
      interimResults: settings.interimResults,
      maxAlternatives: settings.maxAlternatives,
    };
  }, [settings.language, settings.interimResults, settings.maxAlternatives]);

  // Get speech synthesis configuration
  const getSpeechSynthesisConfig = useCallback(() => {
    return {
      voice: settings.voice,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      lang: settings.language,
    };
  }, [settings.voice, settings.rate, settings.pitch, settings.volume, settings.language]);

  // Validate settings
  const validateSettings = useCallback((settingsToValidate: Partial<VoiceSettings>) => {
    const errors: string[] = [];

    if (settingsToValidate.silenceTimeout !== undefined) {
      if (settingsToValidate.silenceTimeout < 1000 || settingsToValidate.silenceTimeout > 10000) {
        errors.push('Silence timeout must be between 1 and 10 seconds');
      }
    }

    if (settingsToValidate.rate !== undefined) {
      if (settingsToValidate.rate < 0.1 || settingsToValidate.rate > 3.0) {
        errors.push('Speech rate must be between 0.1 and 3.0');
      }
    }

    if (settingsToValidate.pitch !== undefined) {
      if (settingsToValidate.pitch < 0.0 || settingsToValidate.pitch > 2.0) {
        errors.push('Speech pitch must be between 0.0 and 2.0');
      }
    }

    if (settingsToValidate.volume !== undefined) {
      if (settingsToValidate.volume < 0.0 || settingsToValidate.volume > 1.0) {
        errors.push('Speech volume must be between 0.0 and 1.0');
      }
    }

    if (settingsToValidate.maxAlternatives !== undefined) {
      if (settingsToValidate.maxAlternatives < 1 || settingsToValidate.maxAlternatives > 5) {
        errors.push('Max alternatives must be between 1 and 5');
      }
    }

    return errors;
  }, []);

  // Export settings
  const exportSettings = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-docs-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  // Import settings
  const importSettings = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (!data.settings) {
            throw new Error('Invalid settings file format');
          }

          const validationErrors = validateSettings(data.settings);
          if (validationErrors.length > 0) {
            throw new Error(`Invalid settings: ${validationErrors.join(', ')}`);
          }

          setSettings({
            ...DEFAULT_SETTINGS,
            ...data.settings,
          });

          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to parse settings file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [validateSettings, setSettings]);

  // Get available languages (common ones)
  const getAvailableLanguages = useCallback(() => {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'en-AU', name: 'English (Australia)' },
      { code: 'en-CA', name: 'English (Canada)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'fr-CA', name: 'French (Canada)' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'sv-SE', name: 'Swedish' },
      { code: 'no-NO', name: 'Norwegian' },
      { code: 'da-DK', name: 'Danish' },
      { code: 'fi-FI', name: 'Finnish' },
    ];
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    resetSettings,
    getAudioConstraints,
    getSpeechRecognitionConfig,
    getSpeechSynthesisConfig,
    validateSettings,
    exportSettings,
    importSettings,
    getAvailableLanguages,
    defaultSettings: DEFAULT_SETTINGS,
  };
};
