import { createContext } from 'react';
import type { WidgetContextType } from '../hooks/useWidget';

export const WidgetContext = createContext<WidgetContextType | undefined>(undefined);
