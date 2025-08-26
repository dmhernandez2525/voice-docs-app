import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme, type ThemeContextType } from './ThemeContextDefinition';



interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || defaultTheme;
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);

    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
    
    // Apply current theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme !== 'light') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleDarkMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
