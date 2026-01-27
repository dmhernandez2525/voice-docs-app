/**
 * Voice Stocks Type Definitions
 *
 * Core types for the Voice Stocks embeddable voice assistant system.
 * These types support DOM navigation, visual highlighting, browser AI,
 * and training data for contextual responses.
 */

// ============================================================================
// DOM Navigator Types
// ============================================================================

export interface PageMap {
  sections: Section[];
  navigation: NavItem[];
  buttons: ButtonInfo[];
  forms: FormInfo[];
  media: MediaInfo[];
  landmarks: LandmarkInfo[];
  lastUpdated: number;
}

export interface Section {
  id: string;
  element: HTMLElement;
  title: string;
  description?: string;
  boundingRect: DOMRect;
  children: string[]; // IDs of child elements
  level: number; // Heading level (1-6) or 0 for non-heading sections
}

export interface NavItem {
  id: string;
  element: HTMLElement;
  text: string;
  href?: string;
  isExternal: boolean;
  isActive: boolean;
}

export interface ButtonInfo {
  id: string;
  element: HTMLElement;
  text: string;
  ariaLabel?: string;
  type: 'button' | 'submit' | 'reset' | 'link';
  isDisabled: boolean;
}

export interface FormInfo {
  id: string;
  element: HTMLFormElement;
  name?: string;
  action?: string;
  fields: FormFieldInfo[];
}

export interface FormFieldInfo {
  id: string;
  element: HTMLElement;
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  isRequired: boolean;
}

export interface MediaInfo {
  id: string;
  element: HTMLElement;
  type: 'image' | 'video' | 'audio' | 'iframe';
  src?: string;
  alt?: string;
  title?: string;
}

export interface LandmarkInfo {
  id: string;
  element: HTMLElement;
  role: string;
  label?: string;
}

export interface ElementContext {
  element: HTMLElement;
  purpose: string;
  interactionHint: string;
  relatedElements: string[];
  path: string; // CSS selector path
}

// ============================================================================
// Visual Highlighting Types
// ============================================================================

export type HighlightStyle = 'glow' | 'outline' | 'overlay' | 'arrow';

export interface SpotlightOptions {
  style: HighlightStyle;
  color?: string;
  duration?: number;
  dimBackground?: boolean;
  pulseAnimation?: boolean;
}

export interface ScrollOptions {
  position: 'center' | 'top' | 'bottom';
  behavior: 'smooth' | 'instant';
  offset?: number;
}

export interface HighlightState {
  activeHighlights: Map<string, HighlightInstance>;
  isDimmed: boolean;
}

export interface HighlightInstance {
  id: string;
  element: HTMLElement;
  style: HighlightStyle;
  overlayElement?: HTMLElement;
  cleanup: () => void;
}

// ============================================================================
// Browser AI Types
// ============================================================================

export interface BrowserAICapabilities {
  isAvailable: boolean;
  supportsPromptAPI: boolean;
  supportsStreaming: boolean;
  maxTokens?: number;
}

export interface AISession {
  id: string;
  systemPrompt: string;
  prompt: (input: string) => Promise<string>;
  promptStreaming?: (input: string) => ReadableStream<string>;
  destroy: () => void;
}

export interface PageInterpretation {
  summary: string;
  mainPurpose: string;
  keyElements: InterpretedElement[];
  suggestedActions: string[];
}

export interface InterpretedElement {
  selector: string;
  purpose: string;
  interactionType: 'click' | 'input' | 'scroll' | 'hover' | 'read';
  naturalDescription: string;
}

// ============================================================================
// Training Data Types
// ============================================================================

export interface VoiceStocksTrainingData {
  version: string;
  identity: IdentityConfig;
  knowledge: KnowledgeBase;
  capabilities: Capability[];
  templates: ResponseTemplates;
  integrations?: IntegrationConfig;
}

export interface IdentityConfig {
  name: string;
  role: string;
  personality: string;
  greeting: string;
  avatar?: string;
}

export interface KnowledgeBase {
  faqs: FAQ[];
  facts: Fact[];
  documents: DocumentRef[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  followUps?: string[];
}

export interface Fact {
  topic: string;
  value: string | string[] | number | boolean;
  context?: string;
  unit?: string;
}

export interface DocumentRef {
  id: string;
  title: string;
  path: string;
  type: 'markdown' | 'json' | 'text';
  tags?: string[];
}

export interface Capability {
  name: string;
  description: string;
  triggers: string[];
  handler?: string; // Function name to call
  requiresConfirmation?: boolean;
}

export interface ResponseTemplates {
  greeting: string;
  fallback: string;
  handoff: string;
  goodbye: string;
  error?: string;
  thinking?: string;
}

export interface IntegrationConfig {
  calendar?: {
    provider: string;
    enabled: boolean;
  };
  crm?: {
    provider: string;
    enabled: boolean;
  };
  analytics?: {
    provider: string;
    trackingId?: string;
    enabled: boolean;
  };
}

// ============================================================================
// Guided Tour Types
// ============================================================================

export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  autoStart?: boolean;
}

export interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  description: string;
  action: 'spotlight' | 'scroll' | 'point' | 'highlight';
  voiceScript?: string; // Optional - can be generated dynamically by AI
  position?: 'top' | 'bottom' | 'left' | 'right';
  waitForInteraction?: boolean;
}

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  tourConfig: TourConfig | null;
  completedSteps: string[];
}

// ============================================================================
// Voice Command Types
// ============================================================================

export interface VoiceCommand {
  pattern: RegExp;
  handler: CommandHandler;
  description: string;
  category: 'navigation' | 'tour' | 'system' | 'query';
}

export type CommandHandler = (
  match: RegExpMatchArray,
  context: CommandContext
) => CommandResult | Promise<CommandResult>;

export interface CommandContext {
  transcript: string;
  conversationHistory: ConversationMessage[];
  currentPage: PageMap;
  tourState?: TourState;
}

export interface CommandResult {
  handled: boolean;
  action?: () => void | Promise<void>;
  response?: string;
  passToAI?: boolean;
  shouldSpeak?: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    confidence?: number;
    source?: string;
    action?: string;
  };
}

// ============================================================================
// Widget Configuration Types
// ============================================================================

export interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: string;
  defaultOpen: boolean;
  showToggleButton: boolean;
  enableVoice: boolean;
  enableTour: boolean;
  trainingDataUrl?: string;
  customStyles?: Record<string, string>;
}

export interface WidgetCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onQuestion?: (question: string) => void;
  onResponse?: (response: string) => void;
  onError?: (error: Error) => void;
  onNavigate?: (target: string) => void;
}
