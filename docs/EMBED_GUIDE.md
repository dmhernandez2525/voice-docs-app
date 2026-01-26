# VoiceDocs Embed Guide

This guide explains how to embed VoiceDocs into your website for different use cases.

## Quick Start

### React Applications

```tsx
import { VoiceDocsWidget } from 'voicedocs';

function App() {
  return (
    <div>
      <YourContent />
      <VoiceDocsWidget />
    </div>
  );
}
```

That's it! The widget will appear as a floating button in the bottom-right corner.

## Configuration Examples

### 1. Documentation Site

Perfect for technical documentation, API docs, or knowledge bases.

```tsx
<VoiceDocsWidget config={{
  mode: 'floating',
  position: 'bottom-right',
  branding: {
    title: 'Docs Assistant',
    subtitle: 'Ask questions or navigate by voice',
    welcomeMessage: "Hi! I can help you find documentation. Try saying 'go to getting started' or ask me a question.",
    primaryColor: '#2563eb',
  },
  navigation: {
    enableDOMNavigation: true,
    enableScrollTo: true,
    scrollOffset: 80, // Account for fixed header
  },
  voice: {
    enableVoiceInput: true,
    enableVoiceOutput: true,
    language: 'en-US',
  },
}} />
```

### 2. E-commerce Product Page

Help customers find product information quickly.

```tsx
<VoiceDocsWidget config={{
  mode: 'floating',
  position: 'bottom-left',
  branding: {
    title: 'Product Helper',
    subtitle: 'Ask about this product',
    welcomeMessage: "Hi! Ask me about sizes, shipping, or materials. I can also help you navigate to reviews or specifications.",
    primaryColor: '#059669',
  },
  dataSource: {
    type: 'static',
    content: [
      {
        id: 'sizes',
        title: 'Size Guide',
        content: 'Available in S, M, L, XL...',
        tags: ['size', 'fit', 'measurements'],
      },
      {
        id: 'shipping',
        title: 'Shipping Information',
        content: 'Free shipping on orders over $50...',
        tags: ['shipping', 'delivery', 'returns'],
      },
    ],
  },
  navigation: {
    enableDOMNavigation: true,
    onNavigate: (target) => {
      // Track navigation for analytics
      analytics.track('voice_navigation', { target: target.label });
    },
  },
}} />
```

### 3. SaaS Dashboard

Inline help within a user dashboard.

```tsx
<VoiceDocsWidget config={{
  mode: 'inline',
  branding: {
    title: 'Dashboard Help',
    welcomeMessage: "Need help? Ask me about any feature or say 'go to settings'.",
  },
  features: {
    minimize: true,
    darkMode: true,
  },
  ai: {
    context: 'This is a project management dashboard with features: tasks, projects, team members, reports.',
  },
}} />
```

### 4. Portfolio Website

Personal touch for portfolio visitors.

```tsx
<VoiceDocsWidget config={{
  mode: 'floating',
  position: 'bottom-right',
  branding: {
    title: "Daniel's Assistant",
    subtitle: 'Ask about my work',
    welcomeMessage: "Hi! I'm Daniel's AI assistant. Ask me about his skills, projects, or experience. You can also say 'go to projects' to navigate.",
    primaryColor: '#8b5cf6',
  },
  dataSource: {
    type: 'static',
    content: [
      {
        id: 'skills',
        title: 'Skills',
        content: 'React, TypeScript, Node.js, Python, AI/ML...',
        elementId: 'skills-section',
      },
      {
        id: 'projects',
        title: 'Projects',
        content: 'VoiceDocs, Portfolio, Various client projects...',
        elementId: 'projects-section',
      },
    ],
  },
}} />
```

### 5. Onboarding Flow

Guide new users through your application.

```tsx
<VoiceDocsWidget config={{
  mode: 'floating',
  branding: {
    title: 'Setup Guide',
    welcomeMessage: "Welcome! I'll help you get started. Say 'next step' to continue or ask any questions.",
  },
  dataSource: {
    type: 'static',
    content: [
      {
        id: 'step-1',
        title: 'Step 1: Create Account',
        content: 'Fill in your details to create an account...',
        elementId: 'step-1',
      },
      {
        id: 'step-2',
        title: 'Step 2: Verify Email',
        content: 'Check your inbox for verification email...',
        elementId: 'step-2',
      },
      // ... more steps
    ],
  },
  navigation: {
    enableScrollTo: true,
    smoothScroll: true,
  },
  callbacks: {
    onNavigate: (target) => {
      // Update onboarding progress
      updateOnboardingStep(target.target);
    },
  },
}} />
```

### 6. Mini Widget in Header

Compact search in navigation bar.

```tsx
import { MiniWidget } from 'voicedocs';

function Header() {
  const [showMini, setShowMini] = useState(false);

  return (
    <header>
      <nav>
        <Logo />
        <NavLinks />
        <button onClick={() => setShowMini(!showMini)}>
          <MicIcon />
        </button>
        {showMini && (
          <MiniWidget
            config={{
              branding: { placeholder: 'Search or navigate...' },
            }}
            onClose={() => setShowMini(false)}
            className="absolute top-full right-0 w-80"
          />
        )}
      </nav>
    </header>
  );
}
```

## Widget Modes Comparison

| Mode | Best For | Features |
|------|----------|----------|
| `floating` | General use, overlays | Button + expandable chat, position control |
| `inline` | Embedded sections | Full width, no overlay |
| `fullscreen` | Dedicated help page | Covers viewport |
| `mini` | Headers, sidebars | Compact, single-line |

## Customizing DOM Selectors

For complex sites, customize how VoiceDocs reads your DOM:

```tsx
<VoiceDocsWidget config={{
  dataSource: {
    type: 'dom',
    selectors: {
      // Main content to read
      contentSelector: '.main-content, article, [role="main"]',

      // Navigation elements to index
      navSelector: 'nav.primary-nav, .sidebar-nav',

      // Headings for structure
      headingSelectors: ['h1', 'h2', 'h3'],

      // Sections to identify
      sectionSelector: 'section, [data-section], .content-block',

      // Elements to ignore
      ignoreSelectors: [
        '.ad-banner',
        '.cookie-notice',
        '[aria-hidden="true"]',
      ],
    },
  },
}} />
```

## Styling

### CSS Custom Properties

Override default styles with CSS variables:

```css
.voicedocs-widget {
  --voicedocs-primary: #6366f1;
  --voicedocs-primary-foreground: #ffffff;
  --voicedocs-background: #ffffff;
  --voicedocs-foreground: #0f172a;
  --voicedocs-muted: #f1f5f9;
  --voicedocs-border: #e2e8f0;
  --voicedocs-radius: 0.5rem;
}
```

### Custom Class

Add custom styling:

```tsx
<VoiceDocsWidget config={{
  className: 'my-custom-widget shadow-xl rounded-2xl',
}} />
```

## Multiple Widgets

Use different widgets for different purposes:

```tsx
function App() {
  return (
    <>
      {/* Main help widget */}
      <VoiceDocsWidget config={{
        instanceId: 'main-help',
        mode: 'floating',
        position: 'bottom-right',
      }} />

      {/* Quick search in header */}
      <VoiceDocsWidget config={{
        instanceId: 'header-search',
        mode: 'mini',
      }} />
    </>
  );
}
```

## Callbacks & Analytics

Track usage for analytics:

```tsx
<VoiceDocsWidget config={{
  callbacks: {
    onOpen: () => {
      analytics.track('widget_opened');
    },
    onClose: () => {
      analytics.track('widget_closed');
    },
    onMessage: (message, role) => {
      analytics.track('widget_message', { role, length: message.length });
    },
    onNavigate: (target) => {
      analytics.track('widget_navigation', {
        type: target.type,
        target: target.label,
      });
    },
    onError: (error) => {
      errorTracker.capture(error);
    },
  },
}} />
```

## Using with WidgetProvider

For programmatic control across your app:

```tsx
import { WidgetProvider, useWidget, VoiceDocsWidget } from 'voicedocs';

function HelpButton() {
  const { open } = useWidget();
  return <button onClick={open}>Get Help</button>;
}

function App() {
  return (
    <WidgetProvider config={widgetConfig}>
      <Header>
        <HelpButton />
      </Header>
      <Main />
      <VoiceDocsWidget />
    </WidgetProvider>
  );
}
```

## Voice Commands Reference

Users can say these commands:

| Command | Action |
|---------|--------|
| "Go to [section]" | Navigate to section |
| "Navigate to [section]" | Navigate to section |
| "Show me [section]" | Navigate to section |
| "Scroll to [element]" | Scroll to element |
| "Click [link]" | Click navigation link |
| "Help" | Show available commands |
| "What's on this page" | List page sections |

## Troubleshooting

### Widget Not Appearing

1. Check if component is mounted after DOM ready
2. Verify z-index isn't being overridden
3. Check for CSS conflicts

### Voice Not Working

1. Ensure HTTPS (required for microphone)
2. Check browser support (Chrome/Edge recommended)
3. Verify microphone permissions

### Navigation Not Finding Sections

1. Add IDs to target elements
2. Customize DOM selectors
3. Check if content is dynamically loaded

### Performance Issues

1. Use `mode: 'floating'` for lazy loading
2. Limit static content size
3. Use debounced search for large DOMs

## Best Practices

1. **Welcome Message**: Make it clear what the widget can do
2. **Context**: Provide relevant AI context for better responses
3. **Selectors**: Customize DOM selectors for your site structure
4. **Callbacks**: Use callbacks for analytics and debugging
5. **Testing**: Test voice commands on target pages
6. **Accessibility**: Ensure widget doesn't break screen readers
7. **Mobile**: Test floating position on mobile viewports
