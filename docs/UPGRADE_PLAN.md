# Upgrade Plan - Voice Docs App

## Overview

This document outlines the modernization strategy for the voice-docs-app project. Each upgrade should be implemented as a separate PR to minimize risk and allow for incremental testing.

**Current Stack:**
- React 19.1.1 (keep as-is, already on latest)
- Vite 7.1.2 (keep as-is, stable)
- Tailwind CSS 3.4.17 (upgrade to v4)
- Radix UI components (migrate to shadcn/ui v4)
- TypeScript 5.8.3 (keep as-is)
- ESLint 9 (keep as-is)

---

## PR 1: Tailwind CSS v3 to v4 Migration

### Overview

Tailwind CSS v4 represents a major architectural shift from JavaScript-based configuration to CSS-first configuration using the new `@theme` directive.

### Breaking Changes

1. **Configuration Format Change**
   - `tailwind.config.js` is replaced by CSS-based configuration
   - All theme customizations move to CSS using `@theme` directive
   - PostCSS configuration changes

2. **CSS Variable Syntax**
   - Old: `theme.extend.colors.primary`
   - New: CSS custom properties with `@theme` blocks

3. **Plugin System**
   - Plugins now use CSS-based approach
   - Some v3 plugins may not be compatible

4. **Content Configuration**
   - Automatic content detection (no explicit paths needed)
   - Source detection is built-in

5. **Utility Changes**
   - Some utility names have changed
   - `ring-offset-*` utilities replaced with CSS variables
   - Shadow and blur utilities have new defaults

### Migration Steps

#### Step 1: Update Dependencies

```bash
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@^4.0.0 @tailwindcss/postcss@^4.0.0
```

#### Step 2: Update PostCSS Configuration

Replace `postcss.config.js`:

```js
// Before (v3)
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// After (v4)
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

#### Step 3: Migrate Configuration to CSS

Convert `tailwind.config.js` to CSS-based config in `src/index.css`:

```css
/* Before: tailwind.config.js */
/* export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        ...
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
} */

/* After: src/index.css (v4) */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  /* Border Radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* Animations */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

#### Step 4: Delete Old Config

```bash
rm tailwind.config.js
```

#### Step 5: Update Class Names

Check for deprecated utilities and update:

| v3 Utility | v4 Utility |
|------------|------------|
| `ring-offset-2` | Use CSS variable approach |
| `shadow-sm/md/lg` | Same (verify shadows) |
| `blur-sm/md/lg` | Same (verify blur values) |

#### Step 6: Test All Themes

Verify all 7 themes still work correctly:
- Light
- Dark
- Retro
- Cyberpunk
- Forest
- Ocean
- Sunset

### Verification Checklist

- [ ] All pages render correctly
- [ ] Theme switching works
- [ ] Dark mode functions properly
- [ ] Animations (accordion) work
- [ ] Custom colors apply correctly
- [ ] Border radius values correct
- [ ] No console warnings about Tailwind
- [ ] Production build succeeds
- [ ] Bundle size similar or smaller

### Rollback Plan

Keep `tailwind.config.js` in a backup branch until migration is verified.

---

## PR 2: Add shadcn/ui v4 Components

### Overview

Replace manual Radix UI component implementations with shadcn/ui v4, which provides pre-built, accessible, and themeable components.

### Why shadcn/ui v4?

1. **Tailwind v4 Native** - Built for the new CSS-first config
2. **Consistent Design System** - Unified component styling
3. **Reduced Maintenance** - Components maintained by community
4. **Better DX** - CLI for adding components

### Current Radix Dependencies to Replace

```json
{
  "@radix-ui/react-accordion": "^1.2.12",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-select": "^2.2.6",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slider": "^1.3.6",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-switch": "^1.2.6"
}
```

### Migration Steps

#### Step 1: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Select options:
- Style: New York (matches existing design)
- Base color: Neutral
- CSS variables: Yes
- Tailwind config: CSS-based (v4)
- Components directory: `src/components/ui`
- Utils: `src/lib/utils`

#### Step 2: Add Components

```bash
npx shadcn@latest add button card badge dialog input textarea select slider switch separator accordion
```

#### Step 3: Migrate Existing Components

For each component in `src/components/ui/`:

1. **button.tsx**
   - Compare with shadcn/ui button
   - Keep custom variants if needed
   - Use `cva` from shadcn/ui

2. **card.tsx**
   - Replace with shadcn/ui card
   - Preserve existing class overrides

3. **dialog.tsx**
   - Replace with shadcn/ui dialog
   - Update imports in consuming components

4. **Remaining Components**
   - badge, input, textarea, select, slider, switch

#### Step 4: Update Imports

Search and replace across the codebase:

```typescript
// Before
import { Button } from '@/components/ui/button';

// After (same path, but component implementation changes)
import { Button } from '@/components/ui/button';
```

#### Step 5: Remove Direct Radix Dependencies

```bash
npm uninstall @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch
```

Note: Keep `@radix-ui/react-slot` as shadcn/ui uses it internally.

### Verification Checklist

- [ ] All UI components render correctly
- [ ] Button variants work (default, destructive, outline, etc.)
- [ ] Dialog/modal opens and closes properly
- [ ] Form inputs function correctly
- [ ] Slider/Switch components work
- [ ] Accordion animations preserved
- [ ] Accessibility features maintained
- [ ] Keyboard navigation works
- [ ] Screen reader support intact

---

## PR 3: Update Supporting Dependencies

### Overview

Update remaining dependencies for compatibility with Tailwind v4 and shadcn/ui v4.

### Dependencies to Update

```bash
# Update tailwind-merge for v4 compatibility
npm install tailwind-merge@latest

# Update class-variance-authority
npm install class-variance-authority@latest

# Update clsx (likely compatible)
npm install clsx@latest

# Update lucide-react icons
npm install lucide-react@latest
```

### Verification

- [ ] `cn()` utility works correctly
- [ ] Class merging functions properly
- [ ] All icons render
- [ ] No TypeScript errors
- [ ] Build succeeds

---

## PR 4: Clean Up and Optimize

### Tasks

1. **Remove Unused Code**
   - Delete legacy `AIAssistantModal.tsx` if fully replaced
   - Remove unused CSS classes
   - Clean up dead imports

2. **Update Documentation**
   - Update README with new dependency versions
   - Update development guide
   - Document new component usage

3. **Performance Audit**
   - Check bundle size
   - Verify no regression in load times
   - Test voice feature performance

4. **Update Tests**
   - Update component tests for new implementations
   - Add tests for any new functionality
   - Verify existing tests pass

---

## Timeline Estimate

| PR | Estimated Time | Risk Level |
|----|---------------|------------|
| PR 1: Tailwind v4 | 2-3 hours | Medium |
| PR 2: shadcn/ui v4 | 3-4 hours | Medium |
| PR 3: Dependencies | 1 hour | Low |
| PR 4: Cleanup | 2 hours | Low |

**Total: 8-10 hours**

---

## Risk Mitigation

1. **Feature Branches** - Each PR on separate branch
2. **Incremental Testing** - Test after each change
3. **Rollback Capability** - Tag commits before major changes
4. **Staging Environment** - Test in preview deployment
5. **Browser Testing** - Verify Chrome, Edge, Firefox, Safari

---

## What NOT to Upgrade

1. **React 19.1.1** - Already on latest LTS
2. **Vite 7.1.2** - Stable, no breaking changes needed
3. **TypeScript 5.8.3** - Current and stable
4. **ESLint 9** - Already using flat config
5. **Vitest 3.1** - Current testing framework

---

## Post-Upgrade Verification

After all PRs merged:

1. Full application smoke test
2. Voice recognition functionality
3. Text-to-speech functionality
4. All 7 themes work
5. Mobile responsiveness
6. Accessibility audit
7. Performance comparison with baseline
8. Production build and deployment test
