/**
 * Demo Context Provider
 *
 * Manages demo state across the application, allowing visitors to experience
 * the full voice-enabled documentation features without authentication.
 */

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ConversationMessage } from '../types/voiceStocks';
import {
  initialDemoState,
  sampleConversation,
  demoTourSteps,
  demoAIResponses,
  type DemoState,
} from '../data/demoData';

// Action types
type DemoAction =
  | { type: 'START_DEMO' }
  | { type: 'END_DEMO' }
  | { type: 'ADD_MESSAGE'; payload: ConversationMessage }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'START_TOUR' }
  | { type: 'END_TOUR' }
  | { type: 'NEXT_TOUR_STEP' }
  | { type: 'PREV_TOUR_STEP' }
  | { type: 'GO_TO_TOUR_STEP'; payload: number }
  | { type: 'TOGGLE_VOICE'; payload?: boolean }
  | { type: 'TOGGLE_TTS'; payload?: boolean }
  | { type: 'RESET_DEMO' };

// Reducer
function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'START_DEMO':
      return { ...state, isActive: true };
    case 'END_DEMO':
      return { ...state, isActive: false };
    case 'ADD_MESSAGE':
      return {
        ...state,
        currentConversation: [...state.currentConversation, action.payload],
      };
    case 'CLEAR_CONVERSATION':
      return { ...state, currentConversation: [] };
    case 'START_TOUR':
      return { ...state, isTourActive: true, tourStep: 0 };
    case 'END_TOUR':
      return { ...state, isTourActive: false };
    case 'NEXT_TOUR_STEP': {
      const nextStep = Math.min(state.tourStep + 1, demoTourSteps.length - 1);
      return { ...state, tourStep: nextStep };
    }
    case 'PREV_TOUR_STEP': {
      const prevStep = Math.max(state.tourStep - 1, 0);
      return { ...state, tourStep: prevStep };
    }
    case 'GO_TO_TOUR_STEP':
      return { ...state, tourStep: Math.max(0, Math.min(action.payload, demoTourSteps.length - 1)) };
    case 'TOGGLE_VOICE':
      return { ...state, voiceEnabled: action.payload ?? !state.voiceEnabled };
    case 'TOGGLE_TTS':
      return { ...state, ttsEnabled: action.payload ?? !state.ttsEnabled };
    case 'RESET_DEMO':
      return {
        ...initialDemoState,
        currentConversation: [...sampleConversation],
      };
    default:
      return state;
  }
}

// Context interface
interface DemoContextValue {
  // State
  state: DemoState;
  isDemo: boolean;
  conversation: ConversationMessage[];
  currentTourStep: typeof demoTourSteps[0] | null;
  tourProgress: { current: number; total: number; percent: number };

  // Actions
  startDemo: () => void;
  endDemo: () => void;
  addMessage: (message: ConversationMessage) => void;
  clearConversation: () => void;
  startTour: () => void;
  endTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  goToTourStep: (step: number) => void;
  toggleVoice: (enabled?: boolean) => void;
  toggleTTS: (enabled?: boolean) => void;
  resetDemo: () => void;

  // Utilities
  getDemoResponse: (question: string) => typeof demoAIResponses[string] | null;
  simulateAIResponse: (question: string) => Promise<ConversationMessage>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

interface DemoProviderProps {
  children: ReactNode;
  initialActive?: boolean;
}

export function DemoProvider({ children, initialActive = false }: DemoProviderProps) {
  const [state, dispatch] = useReducer(demoReducer, {
    ...initialDemoState,
    isActive: initialActive,
  });

  // Actions
  const startDemo = useCallback(() => dispatch({ type: 'START_DEMO' }), []);
  const endDemo = useCallback(() => dispatch({ type: 'END_DEMO' }), []);
  const addMessage = useCallback((message: ConversationMessage) =>
    dispatch({ type: 'ADD_MESSAGE', payload: message }), []);
  const clearConversation = useCallback(() => dispatch({ type: 'CLEAR_CONVERSATION' }), []);
  const startTour = useCallback(() => dispatch({ type: 'START_TOUR' }), []);
  const endTour = useCallback(() => dispatch({ type: 'END_TOUR' }), []);
  const nextTourStep = useCallback(() => dispatch({ type: 'NEXT_TOUR_STEP' }), []);
  const prevTourStep = useCallback(() => dispatch({ type: 'PREV_TOUR_STEP' }), []);
  const goToTourStep = useCallback((step: number) =>
    dispatch({ type: 'GO_TO_TOUR_STEP', payload: step }), []);
  const toggleVoice = useCallback((enabled?: boolean) =>
    dispatch({ type: 'TOGGLE_VOICE', payload: enabled }), []);
  const toggleTTS = useCallback((enabled?: boolean) =>
    dispatch({ type: 'TOGGLE_TTS', payload: enabled }), []);
  const resetDemo = useCallback(() => dispatch({ type: 'RESET_DEMO' }), []);

  // Get demo response for a question
  const getDemoResponse = useCallback((question: string) => {
    const questionLower = question.toLowerCase();

    // Check for keyword matches
    const responseMatchers: Array<{ keywords: string[]; response: keyof typeof demoAIResponses }> = [
      { keywords: ['voice', 'recognition', 'microphone', 'listen'], response: 'voice-recognition' },
      { keywords: ['ai', 'assistant', 'help', 'capabilities', 'can you'], response: 'ai-capabilities' },
      { keywords: ['text-to-speech', 'tts', 'read', 'aloud', 'speak'], response: 'text-to-speech' },
    ];

    for (const matcher of responseMatchers) {
      if (matcher.keywords.some(kw => questionLower.includes(kw))) {
        return demoAIResponses[matcher.response];
      }
    }

    return null;
  }, []);

  // Simulate AI response with delay
  const simulateAIResponse = useCallback(async (question: string): Promise<ConversationMessage> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const demoResponse = getDemoResponse(question);

    if (demoResponse) {
      return {
        id: `demo-resp-${Date.now()}`,
        role: 'assistant',
        content: demoResponse.answer,
        timestamp: Date.now(),
      };
    }

    // Generate generic response
    return {
      id: `demo-resp-${Date.now()}`,
      role: 'assistant',
      content: `I understand you're asking about "${question}". In the full VoiceDocs application, I would search through all documentation to find the most relevant answer.

**In this demo, you can try asking about:**
- Voice recognition features
- AI assistant capabilities
- Text-to-speech functionality
- Keyboard shortcuts
- Navigation commands

Try one of these topics to see a detailed response! You can also explore the demo documentation sections on the left.`,
      timestamp: Date.now(),
    };
  }, [getDemoResponse]);

  // Computed values
  const currentTourStep = state.isTourActive ? demoTourSteps[state.tourStep] : null;

  const tourProgress = useMemo(() => ({
    current: state.tourStep + 1,
    total: demoTourSteps.length,
    percent: ((state.tourStep + 1) / demoTourSteps.length) * 100,
  }), [state.tourStep]);

  const value: DemoContextValue = {
    state,
    isDemo: state.isActive,
    conversation: state.currentConversation,
    currentTourStep,
    tourProgress,
    startDemo,
    endDemo,
    addMessage,
    clearConversation,
    startTour,
    endTour,
    nextTourStep,
    prevTourStep,
    goToTourStep,
    toggleVoice,
    toggleTTS,
    resetDemo,
    getDemoResponse,
    simulateAIResponse,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoOptional(): DemoContextValue | null {
  return useContext(DemoContext);
}

export { DemoContext };
