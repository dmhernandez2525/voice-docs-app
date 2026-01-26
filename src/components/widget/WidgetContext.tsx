import { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { WidgetConfig, WidgetState, NavigationTarget } from '../../types/widget';
import { defaultWidgetConfig } from '../../types/widget';
import { DOMNavigator } from '../../services/domNavigator';
import { WidgetContext } from '../../contexts/WidgetContext';

interface WidgetProviderProps {
  config?: Partial<WidgetConfig>;
  children: ReactNode;
}

export function WidgetProvider({ config: userConfig, children }: WidgetProviderProps) {
  // Merge config with defaults
  const config: Required<WidgetConfig> = {
    ...defaultWidgetConfig,
    ...userConfig,
    branding: { ...defaultWidgetConfig.branding, ...userConfig?.branding },
    ai: { ...defaultWidgetConfig.ai, ...userConfig?.ai },
    navigation: { ...defaultWidgetConfig.navigation, ...userConfig?.navigation },
    voice: { ...defaultWidgetConfig.voice, ...userConfig?.voice },
    features: { ...defaultWidgetConfig.features, ...userConfig?.features },
    callbacks: { ...defaultWidgetConfig.callbacks, ...userConfig?.callbacks },
  };

  const [state, setState] = useState<WidgetState>({
    isOpen: config.mode !== 'floating',
    isMinimized: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    mode: config.mode,
    unreadCount: 0,
  });

  const [navigator, setNavigator] = useState<DOMNavigator | null>(null);

  // Initialize navigator
  useEffect(() => {
    const nav = new DOMNavigator(
      config.dataSource?.selectors,
      config.navigation
    );
    setNavigator(nav);

    // Analyze page on load
    nav.analyzePage();

    return () => {
      // Cleanup if needed
    };
  }, [config.dataSource?.selectors, config.navigation]);

  // Actions
  const open = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true, unreadCount: 0 }));
    config.callbacks?.onOpen?.();
  }, [config.callbacks]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    config.callbacks?.onClose?.();
  }, [config.callbacks]);

  const toggle = useCallback(() => {
    setState(prev => {
      const newIsOpen = !prev.isOpen;
      if (newIsOpen) {
        config.callbacks?.onOpen?.();
      } else {
        config.callbacks?.onClose?.();
      }
      return { ...prev, isOpen: newIsOpen, unreadCount: newIsOpen ? 0 : prev.unreadCount };
    });
  }, [config.callbacks]);

  const minimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: true }));
  }, []);

  const maximize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: false }));
  }, []);

  const navigateTo = useCallback(async (target: NavigationTarget): Promise<boolean> => {
    if (!navigator) return false;
    const success = await navigator.navigateTo(target);
    if (success) {
      config.callbacks?.onNavigate?.(target);
    }
    return success;
  }, [navigator, config.callbacks]);

  const speak = useCallback((text: string) => {
    if (!config.voice?.enableVoiceOutput) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = config.voice.rate || 1;
      utterance.pitch = config.voice.pitch || 1;
      utterance.onstart = () => setState(prev => ({ ...prev, isSpeaking: true }));
      utterance.onend = () => setState(prev => ({ ...prev, isSpeaking: false }));
      window.speechSynthesis.speak(utterance);
    }
  }, [config.voice]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const setIsListening = useCallback((listening: boolean) => {
    setState(prev => ({ ...prev, isListening: listening }));
  }, []);

  const setIsSpeaking = useCallback((speaking: boolean) => {
    setState(prev => ({ ...prev, isSpeaking: speaking }));
  }, []);

  const setIsProcessing = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  const value: WidgetContextType = {
    config,
    state,
    navigator,
    open,
    close,
    toggle,
    minimize,
    maximize,
    navigateTo,
    speak,
    stopSpeaking,
    setIsListening,
    setIsSpeaking,
    setIsProcessing,
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}
