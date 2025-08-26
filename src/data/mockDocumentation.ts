import type { DocumentationSection } from '../types/documentation';

export const mockDocumentation: DocumentationSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using the voice-enabled documentation system',
    subsections: [
      {
        id: 'overview',
        title: 'System Overview',
        content: `This documentation system provides an intelligent, voice-enabled interface for accessing and searching through documentation. Key features include:

• **Voice Recognition**: Use your microphone to ask questions naturally
• **AI-Powered Search**: Get intelligent answers with contextual information
• **Smart Navigation**: Automatically generated links to relevant sections
• **Real-time Transcription**: Speech-to-text conversion in your browser

The system is designed to make documentation more accessible and interactive, allowing you to find information quickly through natural language queries.`,
        tags: ['overview', 'features', 'introduction'],
        links: [
          { title: 'Voice Features Guide', url: '#voice-features', type: 'internal' },
          { title: 'AI Assistant Help', url: '#ai-assistant', type: 'internal' },
        ],
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        content: `Get up and running with the documentation system in minutes:

1. **Enable Microphone**: Allow microphone access when prompted
2. **Try Voice Search**: Click the microphone button and ask a question
3. **Browse Sections**: Use the navigation menu to explore different topics
4. **Use AI Assistant**: Open the AI assistant for advanced queries
5. **Follow Links**: Click on generated links to navigate to relevant content

The system works best with clear, specific questions. Try asking "How do I use voice recognition?" or "What AI features are available?"`,
        tags: ['tutorial', 'setup', 'guide'],
        links: [
          { title: 'Voice Commands Reference', url: '#voice-commands', type: 'internal' },
        ],
      },
    ],
  },
  {
    id: 'voice-features',
    title: 'Voice Features',
    description: 'Comprehensive guide to voice recognition and transcription capabilities',
    subsections: [
      {
        id: 'voice-recognition',
        title: 'Voice Recognition Setup',
        content: `The voice recognition system uses your browser's built-in Speech Recognition API for accurate transcription:

**Browser Support:**
• Chrome/Chromium: Full support with webkitSpeechRecognition
• Firefox: Limited support, may require additional setup
• Safari: Partial support on macOS and iOS
• Edge: Full support with webkitSpeechRecognition

**Setup Requirements:**
1. **Microphone Access**: Grant permission when prompted
2. **Secure Connection**: HTTPS required for voice features
3. **Stable Internet**: Required for cloud-based recognition
4. **Clear Audio**: Use a quality microphone for best results

The system automatically falls back to manual input if voice recognition is unavailable.`,
        tags: ['voice', 'setup', 'browser', 'microphone'],
        links: [
          { title: 'Troubleshooting Voice Issues', url: '#voice-troubleshooting', type: 'internal' },
          { title: 'Browser Compatibility', url: 'https://caniuse.com/speech-recognition', type: 'external' },
        ],
      },
      {
        id: 'voice-commands',
        title: 'Voice Commands Reference',
        content: `Use these natural language patterns for best voice recognition results:

**Question Patterns:**
• "How do I..." - Get step-by-step instructions
• "What is..." - Get definitions and explanations
• "Where can I find..." - Navigate to specific sections
• "Show me..." - Display relevant information

**Example Commands:**
• "How do I enable voice recognition?"
• "What AI features are available?"
• "Where can I find the setup guide?"
• "Show me documentation about search features"

**Tips for Better Recognition:**
• Speak clearly and at normal pace
• Use complete sentences
• Avoid background noise
• Pause briefly before and after speaking`,
        tags: ['commands', 'voice', 'examples', 'tips'],
      },
      {
        id: 'voice-troubleshooting',
        title: 'Voice Troubleshooting',
        content: `Common voice recognition issues and solutions:

**Microphone Not Working:**
1. Check browser permissions in settings
2. Ensure microphone is not muted
3. Try refreshing the page
4. Test microphone in other applications

**Poor Recognition Accuracy:**
• Speak more slowly and clearly
• Reduce background noise
• Check microphone positioning
• Try using headphones with built-in mic

**Browser-Specific Issues:**
• Chrome: Clear site data and re-grant permissions
• Firefox: Enable media.webspeech.recognition.enable in about:config
• Safari: Ensure microphone access is enabled in System Preferences

If issues persist, use the text input as an alternative method.`,
        tags: ['troubleshooting', 'microphone', 'browser', 'issues'],
      },
    ],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Learn how to use the AI-powered documentation assistant',
    subsections: [
      {
        id: 'ai-capabilities',
        title: 'AI Assistant Capabilities',
        content: `The AI assistant provides intelligent responses to your documentation queries:

**Core Features:**
• **Natural Language Processing**: Understands questions in plain English
• **Contextual Responses**: Provides answers based on documentation content
• **Link Generation**: Automatically creates relevant documentation links
• **Follow-up Suggestions**: Recommends related topics to explore
• **Confidence Scoring**: Indicates reliability of responses

**Question Types:**
• **How-to Questions**: Step-by-step guidance
• **Definition Queries**: Explanations of concepts and features
• **Navigation Help**: Finding specific information
• **Troubleshooting**: Problem-solving assistance

The AI learns from the documentation corpus to provide accurate, contextual responses tailored to your needs.`,
        tags: ['ai', 'features', 'capabilities', 'nlp'],
        links: [
          { title: 'Best Practices for AI Queries', url: '#ai-best-practices', type: 'internal' },
        ],
      },
      {
        id: 'ai-best-practices',
        title: 'Best Practices for AI Queries',
        content: `Get the most out of the AI assistant with these best practices:

**Effective Question Formulation:**
• Be specific about what you want to know
• Include relevant context in your questions
• Use clear, complete sentences
• Mention specific features or sections when relevant

**Example Good Questions:**
• "How do I configure voice recognition settings?"
• "What's the difference between voice commands and text search?"
• "Where can I find troubleshooting information for microphone issues?"

**Example Poor Questions:**
• "Help" (too vague)
• "Voice" (incomplete)
• "It doesn't work" (lacks context)

**Using AI Responses:**
• Review confidence scores for reliability
• Follow suggested links for more detailed information
• Try follow-up questions for deeper understanding
• Copy responses for future reference`,
        tags: ['best-practices', 'questions', 'tips', 'usage'],
      },
    ],
  },
  {
    id: 'search-features',
    title: 'Search Features',
    description: 'Advanced search capabilities and filtering options',
    subsections: [
      {
        id: 'search-overview',
        title: 'Search System Overview',
        content: `The documentation system provides multiple search methods:

**Search Methods:**
• **Text Search**: Traditional keyword-based search
• **Voice Search**: Speak your queries naturally
• **AI-Powered Search**: Intelligent question answering
• **Tag-Based Filtering**: Browse by topic categories

**Search Features:**
• **Real-time Results**: Instant search as you type
• **Relevance Ranking**: Most relevant results appear first
• **Context Highlighting**: Search terms highlighted in results
• **Smart Suggestions**: Auto-complete and query suggestions

**Advanced Options:**
• **Boolean Operators**: Use AND, OR, NOT for complex queries
• **Phrase Search**: Use quotes for exact phrase matching
• **Wildcard Search**: Use * for partial word matching
• **Tag Filtering**: Filter results by content tags`,
        tags: ['search', 'features', 'methods', 'overview'],
      },
      {
        id: 'search-tips',
        title: 'Search Tips and Tricks',
        content: `Maximize your search effectiveness with these tips:

**Keyword Selection:**
• Use specific, descriptive terms
• Include synonyms for broader results
• Try different word forms (setup, configure, configuration)
• Use technical terms when appropriate

**Search Operators:**
• "exact phrase" - Find exact matches
• word1 AND word2 - Both terms must appear
• word1 OR word2 - Either term can appear
• -word - Exclude specific terms

**Filtering Strategies:**
• Use tags to narrow down results
• Combine text and voice search methods
• Start broad, then refine your search
• Check related sections for additional information

**Voice Search Tips:**
• Speak naturally and clearly
• Use complete questions
• Include context in your queries
• Try rephrasing if results aren't relevant`,
        tags: ['tips', 'search', 'operators', 'strategies'],
      },
    ],
  },
];
