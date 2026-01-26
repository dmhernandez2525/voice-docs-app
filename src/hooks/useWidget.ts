import { useContext } from 'react';
import type { WidgetContextType } from '../types/widget';
import { WidgetContext } from '../contexts/WidgetContext';

// Re-export the type for convenience
export type { WidgetContextType } from '../types/widget';

export function useWidget(): WidgetContextType {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context;
}
