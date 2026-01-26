/**
 * useHighlight Hook
 *
 * React hook for using the Voice Stocks highlight system.
 * Provides imperative highlight methods and declarative highlight state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  highlightSystem,
  spotlight,
  scrollTo,
  pointTo,
  pulse,
  scrollAndHighlight,
  clearHighlights,
} from '../services/highlightSystem';
import type { SpotlightOptions, ScrollOptions } from '../types/voiceStocks';

interface UseHighlightReturn {
  // Current state
  activeHighlights: string[];
  isDimmed: boolean;

  // Imperative methods
  spotlight: (element: HTMLElement, options?: Partial<SpotlightOptions>) => string;
  scrollTo: (element: HTMLElement, options?: Partial<ScrollOptions>) => Promise<void>;
  pointTo: (element: HTMLElement, duration?: number) => string;
  pulse: (element: HTMLElement, duration?: number) => string;
  scrollAndHighlight: (
    element: HTMLElement,
    scrollOptions?: Partial<ScrollOptions>,
    highlightOptions?: Partial<SpotlightOptions>
  ) => Promise<string>;

  // Utility methods
  remove: (id: string) => void;
  clearElement: (element: HTMLElement) => void;
  clearAll: () => void;
  isHighlighted: (element: HTMLElement) => boolean;
}

export function useHighlight(): UseHighlightReturn {
  const [state, setState] = useState<{
    activeHighlights: string[];
    isDimmed: boolean;
  }>({
    activeHighlights: [],
    isDimmed: false,
  });

  // Update state periodically to reflect highlight system state
  useEffect(() => {
    const updateState = () => {
      const systemState = highlightSystem.getState();
      setState({
        activeHighlights: Array.from(systemState.activeHighlights.keys()),
        isDimmed: systemState.isDimmed,
      });
    };

    // Initial state
    updateState();

    // Poll for changes (lightweight since we're just reading)
    const interval = setInterval(updateState, 100);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optionally clear highlights when component unmounts
      // clearHighlights();
    };
  }, []);

  // Wrapped methods that update state
  const wrappedSpotlight = useCallback(
    (element: HTMLElement, options?: Partial<SpotlightOptions>) => {
      const id = spotlight(element, options);
      setState((prev) => ({
        ...prev,
        activeHighlights: [...prev.activeHighlights, id],
        isDimmed: options?.dimBackground ?? true,
      }));
      return id;
    },
    []
  );

  const wrappedScrollTo = useCallback(
    (element: HTMLElement, options?: Partial<ScrollOptions>) => {
      return scrollTo(element, options);
    },
    []
  );

  const wrappedPointTo = useCallback((element: HTMLElement, duration?: number) => {
    const id = pointTo(element, duration);
    setState((prev) => ({
      ...prev,
      activeHighlights: [...prev.activeHighlights, id],
    }));
    return id;
  }, []);

  const wrappedPulse = useCallback((element: HTMLElement, duration?: number) => {
    const id = pulse(element, duration);
    setState((prev) => ({
      ...prev,
      activeHighlights: [...prev.activeHighlights, id],
    }));
    return id;
  }, []);

  const wrappedScrollAndHighlight = useCallback(
    async (
      element: HTMLElement,
      scrollOptions?: Partial<ScrollOptions>,
      highlightOptions?: Partial<SpotlightOptions>
    ) => {
      const id = await scrollAndHighlight(element, scrollOptions, highlightOptions);
      setState((prev) => ({
        ...prev,
        activeHighlights: [...prev.activeHighlights, id],
        isDimmed: highlightOptions?.dimBackground ?? true,
      }));
      return id;
    },
    []
  );

  const remove = useCallback((id: string) => {
    highlightSystem.remove(id);
    setState((prev) => ({
      ...prev,
      activeHighlights: prev.activeHighlights.filter((hId) => hId !== id),
    }));
  }, []);

  const clearElement = useCallback((element: HTMLElement) => {
    highlightSystem.clearElement(element);
    // State will be updated by the interval
  }, []);

  const clearAll = useCallback(() => {
    clearHighlights();
    setState({
      activeHighlights: [],
      isDimmed: false,
    });
  }, []);

  const isHighlighted = useCallback((element: HTMLElement) => {
    return highlightSystem.isHighlighted(element);
  }, []);

  return {
    activeHighlights: state.activeHighlights,
    isDimmed: state.isDimmed,
    spotlight: wrappedSpotlight,
    scrollTo: wrappedScrollTo,
    pointTo: wrappedPointTo,
    pulse: wrappedPulse,
    scrollAndHighlight: wrappedScrollAndHighlight,
    remove,
    clearElement,
    clearAll,
    isHighlighted,
  };
}

/**
 * Hook for highlighting a specific element ref
 */
export function useElementHighlight(
  ref: React.RefObject<HTMLElement | null>,
  options?: {
    highlightOnMount?: boolean;
    highlightOptions?: Partial<SpotlightOptions>;
    autoScroll?: boolean;
  }
): {
  highlight: () => string | null;
  unhighlight: () => void;
  isHighlighted: boolean;
  highlightId: string | null;
} {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const highlight = useCallback(() => {
    if (!ref.current) return null;

    // Clear existing highlight
    if (highlightId) {
      highlightSystem.remove(highlightId);
    }

    // Scroll if requested
    if (options?.autoScroll) {
      scrollTo(ref.current);
    }

    // Apply highlight
    const id = spotlight(ref.current, options?.highlightOptions);
    setHighlightId(id);
    setIsHighlighted(true);

    return id;
  }, [ref, highlightId, options?.autoScroll, options?.highlightOptions]);

  const unhighlight = useCallback(() => {
    if (highlightId) {
      highlightSystem.remove(highlightId);
      setHighlightId(null);
      setIsHighlighted(false);
    }
  }, [highlightId]);

  // Highlight on mount if requested
  useEffect(() => {
    if (options?.highlightOnMount && ref.current) {
      const id = highlight();
      return () => {
        if (id) highlightSystem.remove(id);
      };
    }
  }, [options?.highlightOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightId) {
        highlightSystem.remove(highlightId);
      }
    };
  }, [highlightId]);

  return {
    highlight,
    unhighlight,
    isHighlighted,
    highlightId,
  };
}

/**
 * Hook for creating a sequence of highlights (for tours)
 */
export function useHighlightSequence(): {
  start: (
    elements: Array<{
      element: HTMLElement;
      options?: Partial<SpotlightOptions>;
      duration?: number;
      onShow?: () => void;
    }>
  ) => Promise<void>;
  stop: () => void;
  isRunning: boolean;
  currentIndex: number;
} {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const abortRef = useRef(false);

  const start = useCallback(
    async (
      elements: Array<{
        element: HTMLElement;
        options?: Partial<SpotlightOptions>;
        duration?: number;
        onShow?: () => void;
      }>
    ) => {
      setIsRunning(true);
      abortRef.current = false;

      for (let i = 0; i < elements.length; i++) {
        if (abortRef.current) break;

        const { element, options, duration = 3000, onShow } = elements[i];
        setCurrentIndex(i);

        // Scroll to and highlight
        await scrollAndHighlight(element, { position: 'center' }, options);

        // Call onShow callback
        onShow?.();

        // Wait for duration
        await new Promise((resolve) => setTimeout(resolve, duration));

        // Clear before next
        clearHighlights();
      }

      setIsRunning(false);
      setCurrentIndex(-1);
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current = true;
    clearHighlights();
    setIsRunning(false);
    setCurrentIndex(-1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      clearHighlights();
    };
  }, []);

  return {
    start,
    stop,
    isRunning,
    currentIndex,
  };
}

export default useHighlight;
