// VoiceDocs Widget Configuration Types

export type WidgetMode = 'floating' | 'inline' | 'fullscreen' | 'mini';
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type DataSourceType = 'static' | 'api' | 'dom' | 'custom';

export interface DataSource {
  type: DataSourceType;
  // For static data
  content?: DocumentationContent[];
  // For API data
  endpoint?: string;
  headers?: Record<string, string>;
  // For DOM reading
  selectors?: DOMSelectors;
  // For custom data
  fetchFn?: () => Promise<DocumentationContent[]>;
}

export interface DOMSelectors {
  // Main content area
  contentSelector?: string;
  // Navigation elements
  navSelector?: string;
  // Headings for structure
  headingSelectors?: string[];
  // Sections to index
  sectionSelector?: string;
  // Elements to ignore
  ignoreSelectors?: string[];
}

export interface DocumentationContent {
  id: string;
  title: string;
  content: string;
  type?: 'section' | 'page' | 'faq' | 'guide' | 'api';
  tags?: string[];
  url?: string;
  elementId?: string; // DOM element ID for navigation
  metadata?: Record<string, unknown>;
}

export interface BrandingConfig {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logo?: string;
  title?: string;
  subtitle?: string;
  welcomeMessage?: string;
  placeholder?: string;
}

export interface AIConfig {
  // System prompt additions
  systemPromptAddition?: string;
  // Context about the website/company
  context?: string;
  // Custom response handlers
  responseTransform?: (response: string) => string;
  // Max conversation history
  maxHistory?: number;
  // Temperature for responses
  temperature?: number;
}

export interface NavigationConfig {
  // Enable DOM navigation
  enableDOMNavigation?: boolean;
  // Enable scroll to section
  enableScrollTo?: boolean;
  // Enable page navigation
  enablePageNavigation?: boolean;
  // Smooth scroll
  smoothScroll?: boolean;
  // Scroll offset (for fixed headers)
  scrollOffset?: number;
  // Navigation callback
  onNavigate?: (target: NavigationTarget) => void;
  // Custom navigation handler
  customNavigate?: (target: NavigationTarget) => Promise<boolean>;
}

export interface NavigationTarget {
  type: 'element' | 'url' | 'section' | 'page';
  target: string; // Element ID, URL, or section name
  label?: string;
}

export interface VoiceConfig {
  // Enable voice input
  enableVoiceInput?: boolean;
  // Enable voice output (TTS)
  enableVoiceOutput?: boolean;
  // Default to talk mode
  defaultTalkMode?: boolean;
  // Voice language
  language?: string;
  // TTS voice name
  voiceName?: string;
  // TTS rate
  rate?: number;
  // TTS pitch
  pitch?: number;
  // Silence timeout (ms)
  silenceTimeout?: number;
}

export interface WidgetConfig {
  // Unique instance ID
  instanceId?: string;

  // Display mode
  mode?: WidgetMode;

  // Position (for floating mode)
  position?: WidgetPosition;

  // Data source configuration
  dataSource?: DataSource;

  // Branding
  branding?: BrandingConfig;

  // AI configuration
  ai?: AIConfig;

  // Navigation configuration
  navigation?: NavigationConfig;

  // Voice configuration
  voice?: VoiceConfig;

  // Feature toggles
  features?: {
    search?: boolean;
    history?: boolean;
    export?: boolean;
    darkMode?: boolean;
    keyboard?: boolean;
    minimize?: boolean;
  };

  // Callbacks
  callbacks?: {
    onOpen?: () => void;
    onClose?: () => void;
    onMessage?: (message: string, role: 'user' | 'assistant') => void;
    onError?: (error: Error) => void;
    onNavigate?: (target: NavigationTarget) => void;
  };

  // Custom CSS class
  className?: string;

  // Z-index for floating mode
  zIndex?: number;
}

// Navigation command patterns
export interface NavigationCommand {
  pattern: RegExp;
  type: NavigationTarget['type'];
  extract: (match: RegExpMatchArray) => string;
}

// DOM element info for navigation
export interface DOMElementInfo {
  id: string;
  tagName: string;
  text: string;
  type: 'heading' | 'section' | 'link' | 'button' | 'nav-item';
  selector: string;
  rect?: DOMRect;
}

// Page structure
export interface PageStructure {
  title: string;
  url: string;
  headings: DOMElementInfo[];
  sections: DOMElementInfo[];
  links: DOMElementInfo[];
  navItems: DOMElementInfo[];
}

// Widget state
export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  mode: WidgetMode;
  unreadCount: number;
}

// Default configuration
export const defaultWidgetConfig: Required<WidgetConfig> = {
  instanceId: 'voicedocs-default',
  mode: 'floating',
  position: 'bottom-right',
  dataSource: { type: 'dom' },
  branding: {
    primaryColor: '#6366f1',
    title: 'Voice Assistant',
    subtitle: 'Ask me anything',
    welcomeMessage: "Hi! I'm your voice assistant. Ask me anything about this page or navigate using voice commands.",
    placeholder: 'Type or speak your question...',
  },
  ai: {
    maxHistory: 50,
    temperature: 0.7,
  },
  navigation: {
    enableDOMNavigation: true,
    enableScrollTo: true,
    enablePageNavigation: true,
    smoothScroll: true,
    scrollOffset: 80,
  },
  voice: {
    enableVoiceInput: true,
    enableVoiceOutput: true,
    defaultTalkMode: false,
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    silenceTimeout: 3000,
  },
  features: {
    search: true,
    history: true,
    export: false,
    darkMode: true,
    keyboard: true,
    minimize: true,
  },
  callbacks: {},
  className: '',
  zIndex: 9999,
};
