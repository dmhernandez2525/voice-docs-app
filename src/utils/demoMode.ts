/**
 * Demo Mode Utilities
 *
 * Environment-based demo mode configuration for Voice Docs App.
 * When VITE_DEMO_MODE=true, the app shows the demo experience
 * instead of the full application at the /app route.
 */

/**
 * Check if demo mode is enabled via environment variable.
 * Returns true when VITE_DEMO_MODE is set to 'true' (case-insensitive).
 */
export function isDemoModeEnabled(): boolean {
  const demoMode = import.meta.env.VITE_DEMO_MODE;
  return demoMode?.toLowerCase() === 'true';
}

/**
 * Get the demo mode configuration status for debugging.
 */
export function getDemoModeStatus(): {
  enabled: boolean;
  envValue: string | undefined;
} {
  return {
    enabled: isDemoModeEnabled(),
    envValue: import.meta.env.VITE_DEMO_MODE,
  };
}
