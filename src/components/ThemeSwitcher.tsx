import React from 'react';
import { Button } from './ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Sun, 
  Moon, 
  Monitor,
  Droplets,
  Leaf,
  Zap
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../contexts/ThemeContextDefinition';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, toggleDarkMode, isDark } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, color: 'text-yellow-500' },
    { value: 'dark', label: 'Dark', icon: Moon, color: 'text-blue-400' },
    { value: 'retro', label: 'Retro', icon: Monitor, color: 'text-orange-500' },
    { value: 'cyberpunk', label: 'Cyberpunk', icon: Zap, color: 'text-pink-500' },
    { value: 'forest', label: 'Forest', icon: Leaf, color: 'text-green-500' },
    { value: 'ocean', label: 'Ocean', icon: Droplets, color: 'text-blue-500' },
    { value: 'sunset', label: 'Sunset', icon: Sun, color: 'text-orange-400' },
  ];

  const currentThemeOption = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentThemeOption?.icon || Monitor;

  return (
    <div className="flex items-center gap-2">
      {/* Quick Dark Mode Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        className="h-9 w-9"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* Theme Selector */}
      <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
        <SelectTrigger className="w-[140px] h-9">
          <div className="flex items-center gap-2">
            <CurrentIcon className={`h-4 w-4 ${currentThemeOption?.color || 'text-gray-500'}`} />
            <SelectValue placeholder="Theme" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeSwitcher;
