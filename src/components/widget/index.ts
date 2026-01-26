// VoiceDocs Widget - Embeddable Voice Assistant
export { VoiceDocsWidget, default as Widget } from './VoiceDocsWidget';
export { WidgetProvider, useWidget } from './WidgetContext';
export { MiniWidget } from './MiniWidget';

// Re-export types
export type {
  WidgetConfig,
  WidgetState,
  WidgetMode,
  WidgetPosition,
  DataSource,
  DataSourceType,
  DOMSelectors,
  DocumentationContent,
  BrandingConfig,
  AIConfig,
  NavigationConfig,
  NavigationTarget,
  VoiceConfig,
} from '../../types/widget';

// Re-export the default config
export { defaultWidgetConfig } from '../../types/widget';

// Re-export DOM navigator
export { DOMNavigator, getDOMNavigator, resetDOMNavigator } from '../../services/domNavigator';
