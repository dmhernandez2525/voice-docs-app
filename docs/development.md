# Development Guide

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── DocumentationPage.tsx
│   ├── AIAssistantModal.tsx
│   ├── EnhancedAIAssistantModal.tsx
│   ├── ThemeSwitcher.tsx
│   └── VoiceSettingsPanel.tsx
├── contexts/           # React contexts
│   └── ThemeContext.tsx
├── hooks/              # Custom React hooks
│   ├── useContinuousVoiceRecognition.ts
│   ├── useSpeechSynthesis.ts
│   └── useVoiceSettings.ts
├── services/           # Business logic
│   └── aiService.ts
├── data/              # Mock data
│   └── mockDocumentation.ts
├── types/             # TypeScript definitions
│   └── documentation.ts
└── utils/             # Utility functions
    ├── permissionManager.ts
    └── performance.ts
```

## Key Components

### DocumentationPage
Main interface with search, navigation, and theme switching.

### AIAssistantModal
Basic voice input with manual send functionality.

### EnhancedAIAssistantModal
Advanced Talk Mode with continuous conversation.

### ThemeSwitcher
Theme selection and dark/light mode toggle.

## Customization

### Adding Documentation
Edit `src/data/mockDocumentation.ts`:

```typescript
export const mockDocumentation: DocumentationSection[] = [
  {
    id: 'your-section',
    title: 'Your Section',
    description: 'Description',
    subsections: [
      {
        id: 'topic-id',
        title: 'Topic Title',
        content: 'Content here...',
        tags: ['tag1', 'tag2']
      }
    ]
  }
];
```

### Integrating Real AI
Modify `src/services/aiService.ts` to connect to your AI service:

```typescript
async answerQuestion(question: string): Promise<DirectAnswer> {
  // Replace mock implementation with real API call
  const response = await fetch('/api/ai/answer', {
    method: 'POST',
    body: JSON.stringify({ question })
  });
  return response.json();
}
```

### Adding Themes
1. Add CSS variables in `src/index.css`
2. Update `ThemeContext.tsx` theme type
3. Add option in `ThemeSwitcher.tsx`

## Voice Features

### Speech Recognition
Uses browser's native `webkitSpeechRecognition`:
- No external dependencies
- Real-time transcription
- Configurable language and settings

### Speech Synthesis
Uses browser's `speechSynthesis` API:
- System voice selection
- Rate, pitch, volume control
- Automatic text cleanup

## Deployment

### Build Process
```bash
npm run build
```
Generates optimized static files in `dist/` directory.

### Hosting Requirements
- Static file hosting (Netlify, Vercel, etc.)
- HTTPS for voice features
- No server-side requirements

### Environment Variables
None required - all functionality is browser-based.

## Testing

Voice functionality requires manual testing in supported browsers. Use the built-in testing utilities for automated compatibility checks.
