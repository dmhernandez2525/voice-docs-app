/**
 * useGuidedTour Hook
 *
 * React hook for managing guided tours with Voice Stocks.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  guidedTour,
  startTour as startTourFn,
  startAutoTour as startAutoTourFn,
  endTour as endTourFn,
} from '../services/guidedTour';
import type { TourConfig, TourStep } from '../types/voiceStocks';

interface UseGuidedTourReturn {
  // State
  isActive: boolean;
  currentStep: TourStep | null;
  currentStepIndex: number;
  progress: {
    current: number;
    total: number;
    percent: number;
  };
  tourConfig: TourConfig | null;

  // Actions
  startTour: (config: TourConfig) => Promise<void>;
  startAutoTour: () => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipToStep: (stepIdOrIndex: string | number) => Promise<void>;
  skipToSection: (sectionName: string) => Promise<boolean>;
  endTour: () => void;
  pause: () => void;
  resume: (duration?: number) => void;

  // TTS integration
  onSpeak: (callback: (text: string) => void) => () => void;
}

export function useGuidedTour(): UseGuidedTourReturn {
  const [state, setState] = useState<{
    isActive: boolean;
    currentStep: TourStep | null;
    currentStepIndex: number;
    progress: { current: number; total: number; percent: number };
    tourConfig: TourConfig | null;
  }>({
    isActive: false,
    currentStep: null,
    currentStepIndex: -1,
    progress: { current: 0, total: 0, percent: 0 },
    tourConfig: null,
  });

  // Update state when tour changes
  useEffect(() => {
    const unsubscribeStepChange = guidedTour.onStepChange((step, index) => {
      const tourState = guidedTour.getState();
      setState({
        isActive: tourState.isActive,
        currentStep: step,
        currentStepIndex: index,
        progress: guidedTour.getProgress(),
        tourConfig: tourState.tourConfig,
      });
    });

    const unsubscribeTourEnd = guidedTour.onTourEnd(() => {
      setState({
        isActive: false,
        currentStep: null,
        currentStepIndex: -1,
        progress: { current: 0, total: 0, percent: 0 },
        tourConfig: null,
      });
    });

    // Initial state
    const initialState = guidedTour.getState();
    setState({
      isActive: initialState.isActive,
      currentStep: guidedTour.getCurrentStep(),
      currentStepIndex: initialState.currentStepIndex,
      progress: guidedTour.getProgress(),
      tourConfig: initialState.tourConfig,
    });

    return () => {
      unsubscribeStepChange();
      unsubscribeTourEnd();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optionally end tour on unmount
      // endTourFn();
    };
  }, []);

  const startTour = useCallback(async (config: TourConfig) => {
    await startTourFn(config);
  }, []);

  const startAutoTour = useCallback(async () => {
    await startAutoTourFn();
  }, []);

  const nextStep = useCallback(async () => {
    await guidedTour.nextStep();
  }, []);

  const previousStep = useCallback(async () => {
    await guidedTour.previousStep();
  }, []);

  const skipToStep = useCallback(async (stepIdOrIndex: string | number) => {
    await guidedTour.skipToStep(stepIdOrIndex);
  }, []);

  const skipToSection = useCallback(async (sectionName: string) => {
    return guidedTour.skipToSection(sectionName);
  }, []);

  const endTour = useCallback(() => {
    endTourFn();
  }, []);

  const pause = useCallback(() => {
    guidedTour.pause();
  }, []);

  const resume = useCallback((duration?: number) => {
    guidedTour.resume(duration);
  }, []);

  const onSpeak = useCallback((callback: (text: string) => void) => {
    return guidedTour.onSpeak(callback);
  }, []);

  return {
    isActive: state.isActive,
    currentStep: state.currentStep,
    currentStepIndex: state.currentStepIndex,
    progress: state.progress,
    tourConfig: state.tourConfig,
    startTour,
    startAutoTour,
    nextStep,
    previousStep,
    skipToStep,
    skipToSection,
    endTour,
    pause,
    resume,
    onSpeak,
  };
}

export default useGuidedTour;
