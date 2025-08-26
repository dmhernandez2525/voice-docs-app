import type { DirectAnswer } from '../types/documentation';

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async answerQuestion(question: string, context?: string[]): Promise<DirectAnswer> {
    // Log context for future extensibility
    if (context && context.length > 0) {
      console.log('Processing question with context:', context.length, 'items');
    }
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate contextual responses based on question content
    const questionLower = question.toLowerCase();
    let answer = '';
    let confidence = 0.8;

    if (questionLower.includes('voice') || questionLower.includes('transcription')) {
      answer = `Voice transcription in this system uses the browser's built-in Speech Recognition API. To use voice features:

1. **Enable Microphone**: Click the microphone button to start recording
2. **Speak Clearly**: Speak your question or command clearly into the microphone
3. **Automatic Transcription**: The system will automatically convert your speech to text
4. **AI Processing**: Your transcribed text is then processed by the AI assistant

The system supports continuous speech recognition and provides real-time feedback during recording. Make sure your browser has microphone permissions enabled for the best experience.`;
      confidence = 0.95;
    } else if (questionLower.includes('documentation') || questionLower.includes('search')) {
      answer = `The documentation search system provides intelligent search capabilities:

1. **Text Search**: Type your questions or keywords in the search box
2. **Voice Search**: Use the microphone button for voice-to-text input
3. **AI-Powered Results**: Get contextual answers with relevant documentation links
4. **Smart Filtering**: Results are automatically filtered by relevance and confidence

The system can understand natural language queries and provides direct answers along with links to relevant documentation sections.`;
      confidence = 0.9;
    } else if (questionLower.includes('ai') || questionLower.includes('assistant')) {
      answer = `The AI Assistant helps you find information and generate documentation:

**Key Features:**
- **Natural Language Processing**: Ask questions in plain English
- **Contextual Responses**: Get answers based on your documentation corpus
- **Link Generation**: Automatically generates relevant documentation links
- **Voice Integration**: Supports voice commands and speech-to-text
- **Follow-up Questions**: Suggests related topics to explore

The assistant learns from your documentation to provide accurate, contextual responses.`;
      confidence = 0.92;
    } else if (questionLower.includes('how') || questionLower.includes('setup') || questionLower.includes('configure')) {
      answer = `To get started with this documentation system:

1. **Browse Documentation**: Use the navigation menu to explore different sections
2. **Search Content**: Use the search bar to find specific information
3. **Ask Questions**: Use the AI assistant for natural language queries
4. **Voice Commands**: Click the microphone for hands-free interaction
5. **Follow Links**: Click on generated links to navigate to relevant sections

The system is designed to be intuitive and provides multiple ways to access information.`;
      confidence = 0.85;
    } else {
      answer = `I found information related to your question. Here are the key points:

- The system provides comprehensive documentation search capabilities
- Voice transcription is available for hands-free interaction
- AI-powered responses help you find relevant information quickly
- Multiple search methods are supported (text, voice, natural language)

For more specific information, try asking about particular features or use more specific keywords in your question.`;
      confidence = 0.7;
    }

    // Generate mock sources and follow-up questions
    const sources = this.generateMockSources(questionLower);
    const followUpQuestions = this.generateFollowUpQuestions(questionLower);
    const actionableSteps = this.extractActionableSteps(answer);

    return {
      answer,
      confidence,
      sources,
      followUpQuestions,
      actionableSteps,
    };
  }

  private generateMockSources(question: string) {
    const allSources = [
      {
        id: 'voice-features',
        title: 'Voice Recognition Features',
        content: 'Comprehensive guide to voice transcription and speech recognition capabilities.',
        tags: ['voice', 'transcription', 'speech'],
      },
      {
        id: 'ai-assistant',
        title: 'AI Documentation Assistant',
        content: 'How to use the AI assistant for intelligent documentation search and generation.',
        tags: ['ai', 'assistant', 'search'],
      },
      {
        id: 'search-functionality',
        title: 'Advanced Search Features',
        content: 'Documentation on search capabilities, filtering, and result ranking.',
        tags: ['search', 'filtering', 'results'],
      },
      {
        id: 'getting-started',
        title: 'Getting Started Guide',
        content: 'Quick start guide for new users of the documentation system.',
        tags: ['setup', 'configuration', 'tutorial'],
      },
    ];

    // Return relevant sources based on question content
    return allSources.filter(source => 
      source.tags.some(tag => question.includes(tag))
    ).slice(0, 3);
  }

  private generateFollowUpQuestions(question: string): string[] {
    if (question.includes('voice')) {
      return [
        'How do I enable microphone permissions?',
        'What browsers support voice recognition?',
        'Can I use voice commands for navigation?',
      ];
    } else if (question.includes('search')) {
      return [
        'How do I filter search results?',
        'What search operators are supported?',
        'Can I save my search queries?',
      ];
    } else if (question.includes('ai')) {
      return [
        'How accurate are AI responses?',
        'Can the AI learn from my documentation?',
        'What types of questions work best?',
      ];
    } else {
      return [
        'How do I get started with the system?',
        'What features are available?',
        'Where can I find more detailed documentation?',
      ];
    }
  }

  private extractActionableSteps(answer: string): string[] {
    // Extract numbered steps or bullet points
    const stepRegex = /(\d+\.|•|\*)\s*\*?\*?([^•*\n]+)/g;
    const steps: string[] = [];
    let match;

    while ((match = stepRegex.exec(answer)) !== null) {
      const step = match[2].trim().replace(/\*\*/g, '');
      if (step.length > 5) {
        steps.push(step);
      }
    }

    return steps.slice(0, 5);
  }
}

export const aiService = AIService.getInstance();
