import { useContext } from 'react';
import type { WidgetConfig, WidgetState, NavigationTarget } from '../types/widget';
import type { DOMNavigator } from '../services/domNavigator';
import { WidgetContext } from '../contexts/WidgetContext';

export interface WidgetContextType {
  config: Required<WidgetConfig>;
  state: WidgetState;
  navigator: DOMNavigator | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  maximize: () => void;
  navigateTo: (target: NavigationTarget) => Promise<boolean>;
  speak: (text: string) => void;
  stopSpeaking: () => void;

  // State setters
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
}

export function useWidget(): WidgetContextType {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context;
}
