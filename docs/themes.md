# Theme System

## Overview

The application includes a comprehensive theme system with multiple color schemes and a theme switcher in the header.

## Available Themes

### New York (Default)
- Clean, professional appearance with subtle shadows
- Light and dark variants
- Rounded corners with 0.75rem radius
- Neutral color palette

### Blue Theme
- Corporate-friendly design
- Blue accent colors throughout
- Professional appearance
- Good for business environments

### Green Theme
- Nature-inspired color scheme
- Green primary colors
- Fresh, modern appearance
- Easy on the eyes

### Purple Theme
- Creative and modern design
- Purple accent colors
- Vibrant but professional
- Good for creative work

## Theme Switcher

Located in the top-right corner of the interface:

### Quick Toggle
- Sun/Moon icon for instant light/dark switching
- Maintains current color theme
- Keyboard accessible

### Theme Selector
- Dropdown with all available themes
- Icons and labels for each option
- Live preview of theme colors
- Persistent selection via localStorage

## Customization

### Adding New Themes
1. Add CSS variables in `src/index.css`
2. Update theme list in `src/contexts/ThemeContext.tsx`
3. Add theme option in `src/components/ThemeSwitcher.tsx`

### CSS Variables
Each theme defines these variables:
```css
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
--radius
```

### Implementation
- Uses CSS custom properties for dynamic theming
- React context for theme state management
- localStorage persistence across sessions
- Smooth transitions between themes

All components automatically respond to theme changes without requiring page refresh.
