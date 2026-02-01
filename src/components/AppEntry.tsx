/**
 * App Entry Component
 *
 * Entry point for the /app route that handles demo mode detection.
 * When VITE_DEMO_MODE=true, renders the VoiceStocksDemo component.
 * Otherwise, renders the full DocumentationPage.
 *
 * This allows the marketing landing page to remain unchanged while
 * the "Launch App" button behavior changes based on environment.
 */

import { isDemoModeEnabled } from '../utils/demoMode';
import DocumentationPage from './DocumentationPage';
import { VoiceStocksDemo } from '../pages/VoiceStocksDemo';

export function AppEntry() {
  // Check if demo mode is enabled via environment variable
  const isDemo = isDemoModeEnabled();

  if (isDemo) {
    // Show demo experience when VITE_DEMO_MODE=true
    return <VoiceStocksDemo />;
  }

  // Show full application when demo mode is disabled
  return <DocumentationPage />;
}

export default AppEntry;
