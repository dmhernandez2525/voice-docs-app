# VoiceDocs Architecture

## System Overview

VoiceDocs is an embeddable voice-enabled documentation assistant that can be integrated into any website. It provides voice-based navigation, AI-powered Q&A, and DOM awareness for seamless user experiences.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Host Website                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        VoiceDocs Widget                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │   Voice     │  │    Chat     │  │    DOM      │  │   Config   │ │   │
│  │  │  Engine     │  │   Engine    │  │  Navigator  │  │   System   │ │   │
│  │  │             │  │             │  │             │  │            │ │   │
│  │  │ • STT       │  │ • Messages  │  │ • Read DOM  │  │ • Branding │ │   │
│  │  │ • TTS       │  │ • AI Logic  │  │ • Navigate  │  │ • Features │ │   │
│  │  │ • Commands  │  │ • History   │  │ • Scroll    │  │ • Data Src │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  │                              │                                       │   │
│  │                    ┌─────────▼─────────┐                           │   │
│  │                    │   Widget Context   │                           │   │
│  │                    │  (State Manager)   │                           │   │
│  │                    └───────────────────┘                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │   Page Content  │  │   Navigation    │  │    User Interface       │   │
│  │   (DOM)         │  │   Elements      │  │    (React Components)   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. VoiceDocsWidget (Main Component)
**Location:** `src/components/widget/VoiceDocsWidget.tsx`

The main embeddable component that can be dropped into any React application.

```tsx
import { VoiceDocsWidget } from 'voicedocs';

<VoiceDocsWidget config={{
  mode: 'floating',
  position: 'bottom-right',
  branding: {
    title: 'Help Assistant',
    primaryColor: '#6366f1'
  }
}} />
```

**Features:**
- Multiple display modes (floating, inline, fullscreen, mini)
- Customizable branding and theming
- Voice input/output with configurable settings
- DOM-aware navigation
- Conversation history

### 2. DOM Navigator
**Location:** `src/services/domNavigator.ts`

Handles reading and navigating the website's DOM structure.

```
┌─────────────────────────────────────────┐
│            DOM Navigator                 │
├─────────────────────────────────────────┤
│  analyzePage()                          │
│  ├─ findHeadings()                      │
│  ├─ findSections()                      │
│  ├─ findNavigableLinks()                │
│  └─ findNavItems()                      │
├─────────────────────────────────────────┤
│  extractPageContent()                   │
│  ├─ Get main content area               │
│  ├─ Extract section content             │
│  └─ Build searchable index              │
├─────────────────────────────────────────┤
│  navigateTo(target)                     │
│  ├─ scrollToElement()                   │
│  ├─ scrollToSection()                   │
│  ├─ navigateToUrl()                     │
│  └─ navigateToPage()                    │
└─────────────────────────────────────────┘
```

**Capabilities:**
- Automatic page structure analysis
- Content extraction for AI context
- Smooth scrolling to sections
- Fuzzy matching for navigation
- Visual highlighting of targets

### 3. Widget Context
**Location:** `src/components/widget/WidgetContext.tsx`

Provides state management and actions across the widget.

```tsx
const {
  config,      // Widget configuration
  state,       // Current widget state
  navigator,   // DOM navigator instance
  open,        // Open widget
  close,       // Close widget
  navigateTo,  // Navigate to target
  speak,       // Speak text
} = useWidget();
```

### 4. Voice Recognition Hook
**Location:** `src/hooks/useContinuousVoiceRecognition.ts`

Handles continuous speech-to-text with silence detection.

```
┌─────────────────────────────────────────┐
│     Continuous Voice Recognition         │
├─────────────────────────────────────────┤
│  Configuration                          │
│  ├─ language: 'en-US'                   │
│  ├─ silenceTimeout: 3000ms              │
│  ├─ interimResults: true                │
│  └─ maxAlternatives: 1                  │
├─────────────────────────────────────────┤
│  State                                  │
│  ├─ isListening                         │
│  ├─ currentTranscript (interim)         │
│  ├─ finalTranscript                     │
│  └─ confidence                          │
├─────────────────────────────────────────┤
│  Flow                                   │
│  1. User speaks                         │
│  2. Interim results displayed           │
│  3. Silence detected (3s)               │
│  4. onFinalTranscript callback          │
└─────────────────────────────────────────┘
```

### 5. Speech Synthesis Hook
**Location:** `src/hooks/useSpeechSynthesis.ts`

Handles text-to-speech output.

## Configuration System

### WidgetConfig Interface

```typescript
interface WidgetConfig {
  // Unique instance identifier
  instanceId?: string;

  // Display mode
  mode?: 'floating' | 'inline' | 'fullscreen' | 'mini';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  // Data source
  dataSource?: {
    type: 'static' | 'api' | 'dom' | 'custom';
    content?: DocumentationContent[];
    endpoint?: string;
    selectors?: DOMSelectors;
    fetchFn?: () => Promise<DocumentationContent[]>;
  };

  // Branding
  branding?: {
    primaryColor?: string;
    title?: string;
    subtitle?: string;
    welcomeMessage?: string;
    placeholder?: string;
    logo?: string;
  };

  // AI Configuration
  ai?: {
    systemPromptAddition?: string;
    context?: string;
    maxHistory?: number;
    temperature?: number;
  };

  // Navigation
  navigation?: {
    enableDOMNavigation?: boolean;
    enableScrollTo?: boolean;
    enablePageNavigation?: boolean;
    smoothScroll?: boolean;
    scrollOffset?: number;
    onNavigate?: (target) => void;
  };

  // Voice
  voice?: {
    enableVoiceInput?: boolean;
    enableVoiceOutput?: boolean;
    language?: string;
    rate?: number;
    pitch?: number;
    silenceTimeout?: number;
  };

  // Features
  features?: {
    search?: boolean;
    history?: boolean;
    darkMode?: boolean;
    keyboard?: boolean;
    minimize?: boolean;
  };

  // Callbacks
  callbacks?: {
    onOpen?: () => void;
    onClose?: () => void;
    onMessage?: (message, role) => void;
    onNavigate?: (target) => void;
    onError?: (error) => void;
  };
}
```

## Data Flow

### Voice Command Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   Voice      │     │   Command    │
│   Speaks     │────▶│  Recognition │────▶│   Parser     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                     ┌───────────────────────────┼───────────────────────────┐
                     │                           │                           │
                     ▼                           ▼                           ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │  Navigation  │           │     AI       │           │    Other     │
              │   Command    │           │   Question   │           │   Command    │
              └──────────────┘           └──────────────┘           └──────────────┘
                     │                           │                           │
                     ▼                           ▼                           ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │     DOM      │           │   Generate   │           │   Execute    │
              │  Navigator   │           │   Response   │           │   Action     │
              └──────────────┘           └──────────────┘           └──────────────┘
                     │                           │                           │
                     └───────────────────────────┼───────────────────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │    TTS       │
                                          │   Response   │
                                          └──────────────┘
```

### Navigation Command Patterns

| Pattern | Type | Example |
|---------|------|---------|
| `go to [section]` | section | "go to getting started" |
| `navigate to [section]` | section | "navigate to features" |
| `show me [section]` | section | "show me pricing" |
| `scroll to [element]` | element | "scroll to header" |
| `click [link]` | page | "click contact" |

## Widget Modes

### 1. Floating Mode (Default)
- Fixed position button that expands to chat
- Configurable position (corners)
- Unread message badge
- Minimizable

### 2. Inline Mode
- Embedded directly in page flow
- Full width in container
- No position styling

### 3. Fullscreen Mode
- Covers entire viewport
- Fixed positioning
- Close button to exit

### 4. Mini Mode
- Compact single-line input
- Expandable response area
- Great for headers/sidebars

## Browser Support

| Browser | Voice Recognition | Voice Synthesis | Full Support |
|---------|-------------------|-----------------|--------------|
| Chrome | ✅ Full | ✅ Full | ✅ |
| Edge | ✅ Full | ✅ Full | ✅ |
| Safari | ⚠️ Partial | ✅ Full | ⚠️ |
| Firefox | ❌ | ✅ Full | ⚠️ Text only |

## Integration Patterns

### React Integration

```tsx
import { VoiceDocsWidget, WidgetProvider } from 'voicedocs';

function App() {
  return (
    <WidgetProvider config={widgetConfig}>
      <YourApp />
      <VoiceDocsWidget />
    </WidgetProvider>
  );
}
```

### Multiple Instances

```tsx
// Different widgets with different configs
<VoiceDocsWidget config={{ instanceId: 'help-widget', ... }} />
<VoiceDocsWidget config={{ instanceId: 'search-widget', ... }} />
```

### Custom Data Source

```tsx
<VoiceDocsWidget config={{
  dataSource: {
    type: 'custom',
    fetchFn: async () => {
      const response = await fetch('/api/docs');
      return response.json();
    }
  }
}} />
```

## Security Considerations

1. **Microphone Access**: Requires explicit user permission
2. **DOM Reading**: Only reads visible, non-sensitive content
3. **No External API**: All processing is browser-based
4. **Content Isolation**: Widget doesn't access cookies/storage
5. **CSP Compatible**: Works with Content Security Policy

## Performance

- **Lazy Loading**: Widget components loaded on demand
- **Debounced Search**: Prevents excessive DOM queries
- **Cached Content**: Page structure cached until navigation
- **Efficient Re-renders**: Memoized components and callbacks

## File Structure

```
src/
├── components/
│   ├── widget/
│   │   ├── VoiceDocsWidget.tsx   # Main widget component
│   │   ├── WidgetContext.tsx     # State management
│   │   ├── MiniWidget.tsx        # Compact variant
│   │   └── index.ts              # Exports
│   ├── ui/                       # UI primitives
│   └── ...                       # Other components
├── services/
│   └── domNavigator.ts           # DOM navigation
├── hooks/
│   ├── useContinuousVoiceRecognition.ts
│   └── useSpeechSynthesis.ts
├── types/
│   ├── widget.ts                 # Widget types
│   ├── speech.ts                 # Speech API types
│   └── documentation.ts          # Content types
└── utils/
    └── ...
```

## Future Enhancements

See [ROADMAP.md](./ROADMAP.md) for planned features including:
- Real AI integration (Claude, GPT, etc.)
- Multi-language support
- Analytics dashboard
- Offline support
- Plugin system
