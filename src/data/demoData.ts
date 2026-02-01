/**
 * Demo Data for Voice Docs App
 *
 * This file contains sample data used to showcase the voice-enabled documentation
 * features in demo mode, allowing visitors to experience the full functionality
 * without requiring authentication.
 */

import type { DocumentationSection, AIResponse } from '../types/documentation';
import type { ConversationMessage } from '../types/voiceStocks';

/**
 * Sample voice commands that visitors can try
 */
export const sampleVoiceCommands = [
  {
    id: 'cmd-1',
    command: 'How do I use voice recognition?',
    description: 'Ask about voice recognition setup and usage',
    category: 'Getting Started',
  },
  {
    id: 'cmd-2',
    command: 'Search for documentation about AI assistant',
    description: 'Search across all documentation sections',
    category: 'Search',
  },
  {
    id: 'cmd-3',
    command: 'Read this section aloud',
    description: 'Have the AI read documentation to you',
    category: 'Accessibility',
  },
  {
    id: 'cmd-4',
    command: 'What are the keyboard shortcuts?',
    description: 'Get a list of available keyboard shortcuts',
    category: 'Navigation',
  },
  {
    id: 'cmd-5',
    command: 'Navigate to voice features',
    description: 'Jump to a specific documentation section',
    category: 'Navigation',
  },
  {
    id: 'cmd-6',
    command: 'Give me a tour of the app',
    description: 'Start a guided tour of the interface',
    category: 'Help',
  },
  {
    id: 'cmd-7',
    command: 'Show me how to configure voice settings',
    description: 'Learn about voice configuration options',
    category: 'Settings',
  },
  {
    id: 'cmd-8',
    command: 'Stop listening',
    description: 'Pause voice recognition',
    category: 'Control',
  },
];

/**
 * Sample documentation specifically for the demo
 */
export const demoDocumentation: DocumentationSection[] = [
  {
    id: 'demo-intro',
    title: 'Welcome to VoiceDocs Demo',
    description: 'Experience hands-free documentation interaction',
    subsections: [
      {
        id: 'demo-overview',
        title: 'Demo Overview',
        content: `Welcome to the VoiceDocs Demo! This interactive demonstration lets you experience all the voice-enabled features without creating an account.

**What you can try:**
- Voice Recognition: Click the microphone and ask questions
- AI Assistant: Get intelligent answers about documentation
- Text-to-Speech: Have content read aloud to you
- Navigation: Use voice commands to move through sections
- Search: Find information using natural language

**Getting Started:**
1. Click "Start Voice Recording" to begin
2. Ask a question like "How do I use voice recognition?"
3. Listen to the AI response or read it on screen
4. Try follow-up questions for deeper exploration

The demo uses simulated data but showcases the full capabilities of the VoiceDocs system.`,
        tags: ['demo', 'introduction', 'getting-started'],
        links: [
          { title: 'Try Voice Commands', url: '#demo-voice-commands', type: 'internal' },
          { title: 'Explore AI Features', url: '#demo-ai-features', type: 'internal' },
        ],
      },
      {
        id: 'demo-voice-commands',
        title: 'Voice Commands Demo',
        content: `The VoiceDocs system understands a variety of natural language voice commands:

**Navigation Commands:**
- "Go to [section name]" - Navigate to a specific section
- "Scroll down/up" - Move through content
- "Back" or "Previous" - Return to previous view

**Search Commands:**
- "Search for [topic]" - Find related documentation
- "Find information about [subject]" - Semantic search
- "What is [term]?" - Get definitions

**Control Commands:**
- "Start listening" - Activate voice recognition
- "Stop" - Pause voice input
- "Read this" - Activate text-to-speech
- "Stop reading" - Pause speech output

**AI Interaction:**
- "Explain [concept]" - Get detailed explanations
- "How do I [action]?" - Step-by-step guidance
- "Tell me more about [topic]" - Deep dive into subjects

Try these commands in the demo to see how natural voice interaction works!`,
        tags: ['voice', 'commands', 'demo'],
        links: [
          { title: 'AI Features', url: '#demo-ai-features', type: 'internal' },
        ],
      },
      {
        id: 'demo-ai-features',
        title: 'AI Assistant Features',
        content: `The AI Documentation Assistant provides intelligent, context-aware responses:

**Core Capabilities:**
- Natural Language Understanding: Ask questions in your own words
- Contextual Responses: Answers based on documentation content
- Smart Links: Automatic generation of relevant documentation links
- Follow-up Suggestions: Related questions to explore further

**How It Works:**
1. You ask a question (voice or text)
2. The AI analyzes your query and documentation
3. It generates a relevant, accurate response
4. Links to related sections are provided
5. Follow-up questions help you explore deeper

**Best Practices:**
- Be specific in your questions
- Include context when helpful
- Try rephrasing if results aren't ideal
- Use follow-up questions for clarity

The AI is designed to feel like talking to a knowledgeable colleague who knows all the documentation inside and out.`,
        tags: ['ai', 'assistant', 'features', 'demo'],
      },
    ],
  },
  {
    id: 'demo-accessibility',
    title: 'Accessibility Features',
    description: 'Voice docs for everyone',
    subsections: [
      {
        id: 'demo-tts',
        title: 'Text-to-Speech',
        content: `VoiceDocs includes comprehensive text-to-speech capabilities:

**Features:**
- Read Any Section: Click the speaker icon to have content read aloud
- Adjustable Speed: Control reading pace (0.5x to 2x)
- Voice Selection: Choose from available system voices
- Pause/Resume: Control playback at any time

**Use Cases:**
- Multitasking: Listen while working on other tasks
- Accessibility: Support for visually impaired users
- Learning: Audio reinforcement of written content
- Proofreading: Catch errors by hearing content read

**Settings:**
- Voice: Select male/female and accent options
- Rate: Speed of speech (words per minute)
- Pitch: Voice tone (lower or higher)
- Volume: Audio output level

Text-to-speech works alongside voice recognition for a fully hands-free documentation experience.`,
        tags: ['accessibility', 'text-to-speech', 'audio', 'demo'],
      },
      {
        id: 'demo-keyboard',
        title: 'Keyboard Navigation',
        content: `Full keyboard support for power users:

**Global Shortcuts:**
- Cmd/Ctrl + K: Open command palette
- ?: Show keyboard shortcuts help
- /: Focus search input
- Escape: Close modals and dialogs

**Navigation:**
- Tab: Move between interactive elements
- Enter: Activate focused element
- Arrow keys: Navigate within menus
- Home/End: Jump to start/end

**AI Assistant:**
- Cmd/Ctrl + Enter: Submit question
- Cmd/Ctrl + R: Start voice recording
- Escape: Close assistant

**Accessibility:**
- All features accessible via keyboard
- Logical tab order throughout
- Skip links for main content
- ARIA labels for screen readers

Combine keyboard shortcuts with voice commands for maximum efficiency!`,
        tags: ['keyboard', 'shortcuts', 'navigation', 'accessibility', 'demo'],
      },
    ],
  },
];

/**
 * Sample conversation history for demo
 */
export const sampleConversation: ConversationMessage[] = [
  {
    id: 'demo-msg-1',
    role: 'user',
    content: 'How do I use voice recognition in this app?',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'demo-msg-2',
    role: 'assistant',
    content: `Voice recognition in VoiceDocs is easy to use! Here's how to get started:

1. **Click the Microphone Button**: You'll find it in the AI Assistant panel or in the navigation bar.

2. **Grant Permission**: Your browser will ask for microphone access - click "Allow" to proceed.

3. **Start Speaking**: Once recording starts, speak your question or command clearly.

4. **Automatic Processing**: The system automatically detects when you've finished speaking and processes your input.

**Tips for best results:**
- Speak clearly at a normal pace
- Reduce background noise when possible
- Use complete sentences for complex questions
- Say "stop" to pause listening

Would you like to try it now? Just click the microphone button above!`,
    timestamp: Date.now() - 55000,
  },
  {
    id: 'demo-msg-3',
    role: 'user',
    content: 'What voice commands can I use?',
    timestamp: Date.now() - 30000,
  },
  {
    id: 'demo-msg-4',
    role: 'assistant',
    content: `VoiceDocs supports a variety of natural language voice commands:

**Navigation:**
- "Go to [section name]" - Navigate to a section
- "Show me [topic]" - Display related content
- "Back" or "Previous" - Return to previous view

**Search & Questions:**
- "Search for [keyword]" - Find documentation
- "What is [term]?" - Get definitions
- "How do I [action]?" - Get step-by-step help

**Control:**
- "Start listening" - Activate voice input
- "Stop" - Pause voice recognition
- "Read this aloud" - Text-to-speech activation
- "Stop reading" - Pause audio output

**Help:**
- "Give me a tour" - Start guided tour
- "Show shortcuts" - Display keyboard help
- "What can you do?" - List capabilities

You can speak naturally - the AI understands context and variations of these commands!`,
    timestamp: Date.now() - 25000,
  },
];

/**
 * Sample AI responses for demo interactions
 */
export const demoAIResponses: Record<string, AIResponse> = {
  'voice-recognition': {
    id: 'demo-resp-1',
    question: 'How do I use voice recognition?',
    answer: `Voice recognition in VoiceDocs allows hands-free interaction with documentation. Here's how to use it:

1. **Enable Microphone**: Click the microphone button in the AI Assistant
2. **Grant Permission**: Allow browser microphone access when prompted
3. **Speak Clearly**: Ask your question or give a command
4. **Wait for Processing**: The system automatically detects speech end

**Supported Commands:**
- Ask questions about documentation
- Navigate to different sections
- Search for specific topics
- Request text-to-speech reading

The system uses your browser's native Speech Recognition API for privacy and speed.`,
    timestamp: new Date(),
    links: [
      { title: 'Voice Features Guide', url: '#voice-features', type: 'documentation' },
      { title: 'Troubleshooting Voice', url: '#voice-troubleshooting', type: 'documentation' },
    ],
  },
  'ai-capabilities': {
    id: 'demo-resp-2',
    question: 'What can the AI assistant do?',
    answer: `The AI Documentation Assistant provides intelligent help:

**Core Features:**
- **Answer Questions**: Get accurate answers from documentation
- **Generate Links**: Automatic links to relevant sections
- **Follow-ups**: Suggested related questions
- **Voice Support**: Full voice interaction capability

**What You Can Ask:**
- How-to questions: "How do I configure voice settings?"
- Definitions: "What is continuous recognition?"
- Navigation: "Where can I find accessibility features?"
- Troubleshooting: "Voice isn't working, what should I check?"

The AI understands natural language and provides contextual, helpful responses.`,
    timestamp: new Date(),
    links: [
      { title: 'AI Best Practices', url: '#ai-best-practices', type: 'documentation' },
      { title: 'Voice Commands', url: '#voice-commands', type: 'documentation' },
    ],
  },
  'text-to-speech': {
    id: 'demo-resp-3',
    question: 'How does text-to-speech work?',
    answer: `Text-to-speech (TTS) lets you listen to documentation:

**How to Use:**
1. Click the speaker icon on any content
2. Or say "Read this aloud" with voice commands
3. Content will be read using your system's voice

**Customization:**
- **Speed**: Adjust reading pace (0.5x - 2x)
- **Voice**: Select from available system voices
- **Volume**: Control audio output level
- **Pitch**: Adjust voice tone

**Controls:**
- Click speaker again to pause
- Say "Stop reading" to end playback
- Use keyboard shortcuts for control

TTS is perfect for multitasking or accessibility needs!`,
    timestamp: new Date(),
    links: [
      { title: 'Accessibility Features', url: '#demo-accessibility', type: 'documentation' },
      { title: 'Voice Settings', url: '#voice-settings', type: 'documentation' },
    ],
  },
};

/**
 * Demo tour steps
 */
export const demoTourSteps = [
  {
    id: 'tour-welcome',
    title: 'Welcome to VoiceDocs!',
    description: 'This is a voice-enabled documentation system. Let me show you around.',
    target: 'header',
  },
  {
    id: 'tour-search',
    title: 'Search & Command Palette',
    description: 'Use the search bar or press Cmd+K to find anything quickly.',
    target: 'search',
  },
  {
    id: 'tour-ai-assistant',
    title: 'AI Assistant',
    description: 'Click here to open the AI assistant. Ask questions in natural language!',
    target: 'ai-button',
  },
  {
    id: 'tour-voice',
    title: 'Voice Recording',
    description: 'Click the microphone to start voice input. Speak your questions!',
    target: 'mic-button',
  },
  {
    id: 'tour-navigation',
    title: 'Documentation Navigation',
    description: 'Browse sections using the sidebar. Click to expand topics.',
    target: 'sidebar',
  },
  {
    id: 'tour-tts',
    title: 'Text-to-Speech',
    description: 'Click the speaker icon to have any section read aloud.',
    target: 'tts-button',
  },
  {
    id: 'tour-complete',
    title: 'You\'re Ready!',
    description: 'Start exploring! Try asking the AI assistant a question.',
    target: null,
  },
];

/**
 * Demo state type
 */
export interface DemoState {
  isActive: boolean;
  currentConversation: ConversationMessage[];
  tourStep: number;
  isTourActive: boolean;
  voiceEnabled: boolean;
  ttsEnabled: boolean;
}

/**
 * Initial demo state
 */
export const initialDemoState: DemoState = {
  isActive: true,
  currentConversation: sampleConversation,
  tourStep: 0,
  isTourActive: false,
  voiceEnabled: true,
  ttsEnabled: true,
};
