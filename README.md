# Voice-Enabled Documentation System

A React application with voice conversation capabilities, AI-powered documentation search, and hands-free interaction using browser-native APIs.

## Features

- **Talk Mode**: Continuous hands-free conversation with automatic processing
- **Manual Mode**: Traditional click-to-record voice input
- **AI Assistant**: Documentation-aware responses with smart link generation
- **Theme System**: Multiple themes with New York design as default
- **Browser-Native**: No external APIs or tokens required

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and allow microphone permissions when prompted.

## Documentation

- [Voice Functionality](./docs/voice-functionality.md) - How voice recognition and synthesis work
- [Talk Mode Guide](./docs/talk-mode.md) - Hands-free conversation features
- [AI Assistant](./docs/ai-assistant.md) - Documentation AI capabilities
- [Theme System](./docs/themes.md) - Customizing appearance
- [Browser Support](./docs/browser-support.md) - Compatibility information
- [Development](./docs/development.md) - Setup and customization

## Tech Stack

- React 18 + TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui
- Browser Speech APIs (no external services)

## Browser Requirements

- Chrome/Edge (full support)
- HTTPS connection for microphone access
- Modern browser with ES2022 support