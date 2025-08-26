import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'retro' | 'cyberpunk' | 'forest' | 'ocean' | 'sunset';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
