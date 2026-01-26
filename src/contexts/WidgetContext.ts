import { createContext } from 'react';
import type { WidgetContextType } from '../types/widget';

export const WidgetContext = createContext<WidgetContextType | undefined>(undefined);
