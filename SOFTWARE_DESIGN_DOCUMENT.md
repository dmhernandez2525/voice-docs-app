# Software Design Document - Voice Docs App

## 1. Overview

### Project Purpose and Goals

Voice Docs App is a voice-enabled documentation system designed to provide hands-free, AI-powered access to documentation content. The application leverages browser-native Speech Recognition and Speech Synthesis APIs to create an accessible, intuitive documentation browsing experience without requiring external API keys or services.

**Primary Goals:**
- Enable hands-free documentation browsing through voice commands
- Provide intelligent, contextual responses to user queries via an AI assistant
- Support multiple interaction modes (voice and manual text input)
- Deliver a responsive, accessible user experience across modern browsers

### Target Users

- **Developers**: Seeking quick access to technical documentation while coding
- **Accessibility Users**: Users who benefit from or require voice-based interactions
- **Hands-Busy Professionals**: Users who need documentation access while performing other tasks
- **General Documentation Consumers**: Anyone wanting a more interactive documentation experience

### Key Features

1. **Talk Mode**: Continuous hands-free conversation with automatic silence detection and processing
2. **Manual Mode**: Traditional click-to-record voice input or text typing
3. **AI Documentation Assistant**: Intelligent question-answering with contextual responses and smart link generation
4. **Multi-Theme System**: Seven themes (light, dark, retro, cyberpunk, forest, ocean, sunset)
5. **Browser-Native Voice**: No external APIs required - uses Web Speech API
6. **Voice Settings Panel**: Comprehensive configuration for recognition and synthesis
7. **Notification System**: Toast notifications for user feedback
8. **Error Boundary**: Graceful error handling with recovery options

---

## 2. Architecture

### High-Level Architecture Diagram

```
+------------------------------------------------------------------+
|                         App (Root)                                |
|  +------------------------------------------------------------+  |
|  |                    ErrorBoundary                           |  |
|  |  +------------------------------------------------------+  |  |
|  |  |                  ThemeProvider                       |  |  |
|  |  |  +------------------------------------------------+  |  |  |
|  |  |  |             NotificationProvider               |  |  |  |
|  |  |  |  +------------------------------------------+  |  |  |  |
|  |  |  |  |           DocumentationPage              |  |  |  |  |
|  |  |  |  |  +------------------------------------+  |  |  |  |  |
|  |  |  |  |  |        UI Components              |  |  |  |  |  |
|  |  |  |  |  |  - ThemeSwitcher                  |  |  |  |  |  |
|  |  |  |  |  |  - Search Input                   |  |  |  |  |  |
|  |  |  |  |  |  - Navigation Sidebar             |  |  |  |  |  |
|  |  |  |  |  |  - Content Display                |  |  |  |  |  |
|  |  |  |  |  +------------------------------------+  |  |  |  |  |
|  |  |  |  +------------------------------------------+  |  |  |  |
|  |  |  |  |   EnhancedAIAssistantModal               |  |  |  |  |
|  |  |  |  |   +----------------------------------+   |  |  |  |  |
|  |  |  |  |   | Voice Recognition Hook           |   |  |  |  |  |
|  |  |  |  |   | Speech Synthesis Hook            |   |  |  |  |  |
|  |  |  |  |   | AI Service Integration           |   |  |  |  |  |
|  |  |  |  |   +----------------------------------+   |  |  |  |  |
|  |  |  |  +------------------------------------------+  |  |  |  |
|  |  |  |  |       VoiceSettingsPanel                 |  |  |  |  |
|  |  |  |  +------------------------------------------+  |  |  |  |
|  |  |  +------------------------------------------------+  |  |  |
|  |  +------------------------------------------------------+  |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                       Services Layer                              |
|  +------------------+  +------------------+  +------------------+ |
|  |   AIService      |  | Browser Speech   |  | LocalStorage     | |
|  |   (Singleton)    |  | Recognition API  |  | Persistence      | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                         Hooks Layer                               |
|  +-----------------+  +----------------------+  +---------------+ |
|  | useSpeech       |  | useContinuousVoice   |  | useVoice      | |
|  | Synthesis       |  | Recognition          |  | Settings      | |
|  +-----------------+  +----------------------+  +---------------+ |
|  +-----------------+  +------------------+  +------------------+  |
|  | useTheme        |  | useLocalStorage  |  | useNotification  |  |
|  +-----------------+  +------------------+  +------------------+  |
+------------------------------------------------------------------+
```

### Component Hierarchy

```
App
  ErrorBoundary
    ThemeProvider
      NotificationProvider
        DocumentationPage
          ThemeSwitcher
          Input (Search)
          Card (Navigation Sidebar)
            Button (Section Items)
          Card (Content Area)
            Badge
            Button
          EnhancedAIAssistantModal
            Dialog
            Button (Mode Controls)
            Textarea (Manual Input)
            Card (Conversation Messages)
          VoiceSettingsPanel
            Dialog
            Card (Settings Sections)
            Slider
            Switch
            Select
            Button
```

### State Management

The application uses a **Context-based state management** approach combined with **custom hooks** for domain-specific state:

| State Domain | Management Approach | Persistence |
|--------------|---------------------|-------------|
| Theme | ThemeContext | localStorage |
| Notifications | NotificationContext | None (ephemeral) |
| Voice Settings | useVoiceSettings + useLocalStorage | localStorage |
| Conversation History | Component State (useState) | None |
| Voice Recognition State | useContinuousVoiceRecognition | None |
| Speech Synthesis State | useSpeechSynthesis | None |
| Documentation Navigation | Component State (useState) | None |

---

## 3. Component Design

### DocumentationPage

**Purpose**: Main container component orchestrating the documentation interface.

**State:**
```typescript
selectedCategory: string          // Current documentation section
selectedSubsection: string | null // Current subsection within section
searchQuery: string               // User's search input
showAIModal: boolean              // AI Assistant modal visibility
showSettingsPanel: boolean        // Voice Settings panel visibility
```

**Behavior:**
- Filters documentation based on search queries using useMemo
- Handles navigation between sections and subsections
- Manages modal visibility states
- Provides navigation callback to AI assistant for deep linking

---

### EnhancedAIAssistantModal

**Purpose**: Voice-enabled AI assistant for documentation queries.

**Props:**
```typescript
interface EnhancedAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToContent?: (contentId: string) => void;
}
```

**State:**
```typescript
inputText: string                    // Manual text input
conversation: ConversationMessage[]  // Chat history
isProcessingAI: boolean              // AI processing indicator
mode: 'manual' | 'talk'              // Interaction mode
isTalkModeActive: boolean            // Talk mode enabled state
```

**Behavior:**
- Dual-mode operation: Talk Mode (continuous voice) and Manual Mode (text/click-to-record)
- Automatic silence detection with configurable timeout
- Real-time transcription display
- Text-to-speech for AI responses in Talk Mode
- Voice command recognition ("start", "stop")
- Clipboard copy functionality for messages

---

### VoiceSettingsPanel

**Purpose**: Configuration interface for voice recognition and synthesis settings.

**Props:**
```typescript
interface VoiceSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Speech recognition configuration (language, silence timeout, interim results)
- Text-to-speech settings (voice selection, rate, pitch, volume)
- Advanced audio settings (noise reduction, echo cancellation, auto gain)
- System capability tests (microphone, recognition, synthesis)
- Settings import/export functionality
- Browser compatibility information

---

### ThemeSwitcher

**Purpose**: Theme selection and dark mode toggle control.

**Features:**
- Quick dark/light mode toggle button
- Dropdown selector for seven theme variants
- Visual icons for each theme option

---

### ErrorBoundary

**Purpose**: Graceful error handling and recovery.

**State:**
```typescript
interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}
```

**Features:**
- Captures React component errors
- Displays user-friendly error page
- Provides recovery options (try again, reload, report error)
- Logs detailed error information for debugging

---

### NotificationProvider

**Purpose**: Toast notification system for user feedback.

**Features:**
- Four notification types: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual dismissal option
- Stacked notification display

---

## 4. Voice System Design

### Speech Recognition Approach

The application uses the **Web Speech API** (SpeechRecognition) for voice-to-text conversion.

**Implementation: useContinuousVoiceRecognition Hook**

```typescript
interface ContinuousVoiceOptions {
  silenceTimeout?: number;      // ms before auto-processing (default: 3000)
  language?: string;            // Recognition language (default: 'en-US')
  interimResults?: boolean;     // Show interim transcription (default: true)
  maxAlternatives?: number;     // Recognition alternatives (default: 1)
}
```

**Key Features:**
1. **Continuous Mode**: `recognition.continuous = true` for ongoing listening
2. **Interim Results**: Real-time transcription updates before final results
3. **Silence Detection**: Automatic timeout triggers processing after pause
4. **Confidence Scoring**: Reports recognition confidence (0-1)
5. **Error Handling**: Graceful degradation on permission denial or errors

**Recognition Flow:**
```
User Speaks
    |
    v
SpeechRecognition API
    |
    +-- onresult event
    |       |
    |       +-- interim transcript (displayed in real-time)
    |       |
    |       +-- final transcript (accumulated)
    |
    +-- Silence Timer (3s default)
            |
            v
    onFinalTranscript callback --> AI Processing
```

---

### Text-to-Speech Implementation

The application uses the **Web Speech API** (SpeechSynthesis) for text-to-speech output.

**Implementation: useSpeechSynthesis Hook**

```typescript
interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;   // 0.1 - 3.0 (default: 1)
  pitch?: number;  // 0.0 - 2.0 (default: 1)
  volume?: number; // 0.0 - 1.0 (default: 1)
  lang?: string;
}
```

**Key Features:**
1. **Voice Selection**: Enumerate and select from available browser voices
2. **Configurable Parameters**: Rate, pitch, and volume controls
3. **Promise-Based API**: Async speak() with completion resolution
4. **Playback Controls**: Stop, pause, and resume functionality
5. **Auto-Voice Selection**: Prefers local English voices

**Text Cleanup for Speech:**
```typescript
// Removes markdown formatting for cleaner speech
cleanText = text
  .replace(/\*\*/g, '')              // Remove bold
  .replace(/\*/g, '')                // Remove italic
  .replace(/`([^`]+)`/g, '$1')       // Remove code backticks
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links to text
  .replace(/#{1,6}\s/g, '')          // Remove headers
  .replace(/\n\n/g, '. ')            // Paragraphs to sentences
  .replace(/\n/g, ' ');              // Newlines to spaces
```

---

### Browser API Usage

**SpeechRecognition API:**
```typescript
// Feature detection with vendor prefix
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Configuration
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.maxAlternatives = 1;
```

**SpeechSynthesis API:**
```typescript
// Check support
const isSupported = 'speechSynthesis' in window;

// Get voices (async loading in some browsers)
speechSynthesis.addEventListener('voiceschanged', loadVoices);
const voices = speechSynthesis.getVoices();

// Create and speak utterance
const utterance = new SpeechSynthesisUtterance(text);
speechSynthesis.speak(utterance);
```

---

## 5. Data Flow

### User Interaction Flow

```
+-------------+     +------------------+     +------------------+
|   User      | --> | DocumentationPage| --> |   UI Feedback    |
+-------------+     +------------------+     +------------------+
      |                     |
      |  Voice/Text Input   |
      v                     v
+-------------+     +------------------+
| EnhancedAI  | --> | AI Service       |
| Assistant   |     | (answerQuestion) |
| Modal       |     +------------------+
+-------------+             |
      |                     v
      |             +------------------+
      | <---------- | DirectAnswer     |
      |             | {answer,         |
      |             |  confidence,     |
      |             |  sources,        |
      |             |  followUpQs}     |
      |             +------------------+
      v
+-------------+
| TTS Output  |
| (Talk Mode) |
+-------------+
```

### Voice Processing Pipeline

```
+------------------------------------------------------------------+
|                    TALK MODE PIPELINE                             |
+------------------------------------------------------------------+

1. ACTIVATION
   User clicks "Start Talk Mode"
       |
       v
   startListening() --> SpeechRecognition.start()
       |
       v
   isListening = true, isTalkModeActive = true

2. LISTENING
   User speaks
       |
       v
   onresult event fires
       |
       +-- interimTranscript updates (real-time display)
       |
       +-- finalTranscript accumulates
       |
       v
   Silence Timer starts (3s)

3. PROCESSING
   Silence timeout reached
       |
       v
   onFinalTranscript(fullTranscript, confidence)
       |
       v
   Add user message to conversation[]
       |
       v
   isProcessingAI = true
       |
       v
   aiService.answerQuestion(transcript)
       |
       v
   Add assistant message to conversation[]
       |
       v
   isProcessingAI = false

4. RESPONSE
   speakResponse(directAnswer.answer)
       |
       v
   SpeechSynthesis.speak(cleanedText)
       |
       v
   onend event fires
       |
       v
   Auto-restart listening (500ms delay)

5. CONTINUE (loop back to step 2)
   OR
   User says "stop" / clicks "Stop Talk Mode"
       |
       v
   stopListening() --> SpeechRecognition.stop()
```

---

## 6. UI/UX Design

### Theme System

The application implements a CSS variable-based theming system using Tailwind CSS.

**Available Themes:**
| Theme | Primary Colors | Use Case |
|-------|---------------|----------|
| Light | Neutral grays, blue accents | Default daytime use |
| Dark | Dark backgrounds, muted colors | Low-light environments |
| Retro | Orange, amber tones | Nostalgic aesthetic |
| Cyberpunk | Pink, purple neons | Futuristic style |
| Forest | Green, earth tones | Nature-inspired |
| Ocean | Blue, teal palette | Calming aesthetic |
| Sunset | Orange, warm gradients | Warm visual experience |

**CSS Variable Structure (tailwind.config.js):**
```javascript
colors: {
  border: "hsl(var(--border))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: { DEFAULT, foreground },
  secondary: { DEFAULT, foreground },
  muted: { DEFAULT, foreground },
  accent: { DEFAULT, foreground },
  destructive: { DEFAULT, foreground },
  card: { DEFAULT, foreground },
  popover: { DEFAULT, foreground },
}
```

**Theme Persistence:**
- Theme selection stored in localStorage
- Applied via CSS class on document root
- Transitions smoothly between themes (300ms duration)

---

### Responsive Design Approach

**Breakpoints (Tailwind defaults):**
```
sm:  640px   - Small tablets
md:  768px   - Tablets
lg:  1024px  - Laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

**Layout Adaptations:**

1. **Navigation Sidebar**
   - Desktop (lg+): 1/4 width column, sticky positioning
   - Mobile/Tablet: Full-width, collapsible

2. **Content Area**
   - Desktop: 3/4 width column
   - Mobile: Full-width, stacked below navigation

3. **AI Assistant Modal**
   - All sizes: max-w-5xl, max-h-[95vh]
   - Responsive padding and button sizing

4. **Settings Panel**
   - Desktop: Grid columns for settings groups
   - Mobile: Single-column stacked layout

---

### Accessibility Considerations

1. **Keyboard Navigation**
   - All interactive elements are focusable
   - Tab order follows logical reading order
   - Enter/Space activate buttons and controls

2. **Screen Reader Support**
   - Semantic HTML structure
   - ARIA labels on icon-only buttons
   - Dialog role for modals with proper focus management

3. **Visual Accessibility**
   - Sufficient color contrast ratios
   - Focus indicators (ring-2 ring-offset-2)
   - Text alternatives for icons

4. **Voice Input as Accessibility Feature**
   - Alternative input method for motor impairments
   - Hands-free operation support

5. **Reduced Motion**
   - Minimal animations
   - Animation durations kept short (200ms)

---

## 7. Dependencies

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.1.1 | UI framework |
| react-dom | ^19.1.1 | DOM rendering |
| typescript | ~5.8.3 | Type safety |
| vite | ^7.1.2 | Build tool and dev server |

### UI Components (Radix UI)

| Package | Purpose |
|---------|---------|
| @radix-ui/react-accordion | Expandable content sections |
| @radix-ui/react-dialog | Modal dialogs |
| @radix-ui/react-select | Dropdown selectors |
| @radix-ui/react-separator | Visual dividers |
| @radix-ui/react-slider | Range input controls |
| @radix-ui/react-slot | Component composition |
| @radix-ui/react-switch | Toggle switches |

### Styling

| Package | Purpose |
|---------|---------|
| tailwindcss | ^3.4.17 | Utility-first CSS |
| tailwind-merge | ^3.3.1 | Merge Tailwind classes |
| clsx | ^2.1.1 | Conditional class names |
| class-variance-authority | ^0.7.1 | Variant styling |
| autoprefixer | ^10.4.21 | CSS vendor prefixes |
| postcss | ^8.5.6 | CSS processing |

### Icons

| Package | Purpose |
|---------|---------|
| lucide-react | ^0.542.0 | Icon components |

### Development

| Package | Purpose |
|---------|---------|
| @vitejs/plugin-react | ^5.0.0 | React support for Vite |
| eslint | ^9.33.0 | Code linting |
| eslint-plugin-react-hooks | ^5.2.0 | React hooks rules |
| eslint-plugin-react-refresh | ^0.4.20 | Fast refresh support |
| typescript-eslint | ^8.39.1 | TypeScript linting |

---

## 8. Testing Strategy

### Test Types and Coverage Goals

| Test Type | Coverage Target | Focus Areas |
|-----------|----------------|-------------|
| Unit Tests | 80%+ | Hooks, utilities, AIService |
| Component Tests | 70%+ | UI components, user interactions |
| Integration Tests | 60%+ | Voice workflows, navigation flows |
| E2E Tests | Critical paths | Full user journeys |

### Testing Approach for Voice Features

**Challenges:**
- Web Speech API requires browser environment
- Microphone access requires user permission
- Voice recognition results are non-deterministic

**Mock Strategy:**

1. **SpeechRecognition Mock:**
```typescript
// Mock recognition events
const mockRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: '',
  onresult: null,
  onerror: null,
  onstart: null,
  onend: null,
};

window.SpeechRecognition = jest.fn(() => mockRecognition);
```

2. **SpeechSynthesis Mock:**
```typescript
const mockSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [mockVoice]),
  speaking: false,
};

Object.defineProperty(window, 'speechSynthesis', {
  value: mockSynthesis,
});
```

3. **Hook Testing:**
```typescript
// Test useContinuousVoiceRecognition
const { result } = renderHook(() =>
  useContinuousVoiceRecognition(mockCallback, options)
);

// Simulate speech result
act(() => {
  mockRecognition.onresult({
    resultIndex: 0,
    results: [{
      isFinal: true,
      0: { transcript: 'test query', confidence: 0.95 }
    }]
  });
});

expect(mockCallback).toHaveBeenCalledWith('test query', 0.95);
```

### Recommended Test Tools

- **Vitest**: Fast unit test runner (Vite-native)
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking (if needed)
- **Playwright/Cypress**: E2E testing with real browser APIs

---

## 9. Future Considerations

### Planned Improvements

1. **Conversation Persistence**
   - Save conversation history to localStorage
   - Export/import conversation logs
   - Session resumption

2. **Enhanced AI Capabilities**
   - Integration with real AI/LLM APIs (OpenAI, Anthropic)
   - Semantic search over documentation
   - Multi-turn context understanding

3. **Wake Word Detection**
   - "Hey Docs" activation phrase
   - Background listening mode

4. **Voice Command Expansion**
   - Navigation commands ("go to section X")
   - Control commands ("scroll down", "go back")
   - System commands ("clear history", "change theme to dark")

5. **Offline Support**
   - Service worker for offline documentation access
   - Cached voice recognition models (if supported)

6. **Multi-Language Support**
   - Dynamic language switching
   - Localized documentation content
   - Language-specific voice settings

7. **Analytics and Insights**
   - Query analytics for documentation improvement
   - Usage patterns and popular sections
   - Voice recognition accuracy metrics

### Known Limitations

1. **Browser Compatibility**
   - Full support: Chrome, Edge (Chromium-based)
   - Limited support: Firefox (requires flag), Safari (partial)
   - No support: IE, older browsers

2. **Network Dependency**
   - Speech recognition requires internet (cloud-based)
   - Some voices may require network

3. **Voice Recognition Accuracy**
   - Varies by accent, background noise, microphone quality
   - Technical terminology may be misrecognized

4. **Mobile Limitations**
   - iOS Safari has limited Web Speech API support
   - Background mode not supported

5. **AI Responses**
   - Currently using simulated responses
   - Responses limited to pre-defined patterns
   - No true natural language understanding

6. **Accessibility Gaps**
   - Voice output relies on user having speakers
   - No Braille display integration
   - Limited screen reader testing

---

## Appendix A: File Structure

```
voice-docs-app/
  src/
    App.tsx                          # Root component
    main.tsx                         # Entry point
    index.css                        # Global styles + CSS variables
    vite-env.d.ts                    # Vite type declarations

    components/
      DocumentationPage.tsx          # Main documentation interface
      EnhancedAIAssistantModal.tsx   # Voice-enabled AI assistant
      VoiceSettingsPanel.tsx         # Voice configuration UI
      ThemeSwitcher.tsx              # Theme selection control
      ErrorBoundary.tsx              # Error handling wrapper
      NotificationProvider.tsx       # Toast notification system
      AIAssistantModal.tsx           # Legacy/simple assistant
      ui/                            # Reusable UI components
        button.tsx
        card.tsx
        badge.tsx
        dialog.tsx
        input.tsx
        textarea.tsx
        select.tsx
        slider.tsx
        switch.tsx

    hooks/
      useContinuousVoiceRecognition.ts  # Voice input hook
      useSpeechSynthesis.ts             # Voice output hook
      useVoiceSettings.ts               # Settings management
      useLocalStorage.ts                # Persistence hook
      useTheme.ts                       # Theme access hook
      useNotificationContext.ts         # Notification access
      useConversationHistory.ts         # Conversation state

    contexts/
      ThemeContext.tsx               # Theme provider
      ThemeContextDefinition.tsx     # Theme types/context
      NotificationContext.tsx        # Notification context

    services/
      aiService.ts                   # AI response generation

    types/
      documentation.ts               # Documentation types
      speech.ts                      # Speech API types

    data/
      mockDocumentation.ts           # Sample documentation

    lib/
      utils.ts                       # Utility functions (cn)
      variants.ts                    # Component variants (cva)

    utils/
      testing.ts                     # Test utilities
      performance.ts                 # Performance helpers
      permissionManager.ts           # Browser permission utils

    assets/                          # Static assets
```

---

## Appendix B: Configuration Files

**vite.config.ts**: Vite build configuration with React plugin
**tailwind.config.js**: Tailwind CSS with CSS variables for theming
**tsconfig.json**: TypeScript configuration (strict mode)
**postcss.config.js**: PostCSS with Tailwind and Autoprefixer
**eslint.config.js**: ESLint with React and TypeScript rules
