# Demo Mode

This document explains the environment-based demo mode feature for Voice Docs App.

## Overview

Demo mode allows the deployed application to show a streamlined demo experience instead of the full documentation app. This is useful for:

- Preview deployments where you want to showcase features
- Marketing environments where the full app isn't needed
- Testing the Voice Stocks widget in isolation

## How It Works

The demo mode is controlled by the `VITE_DEMO_MODE` environment variable:

- **`VITE_DEMO_MODE=true`**: The `/app` route renders `VoiceStocksDemo` component
- **`VITE_DEMO_MODE=false`** (or unset): The `/app` route renders the full `DocumentationPage`

### Architecture

```
Landing Page (/)
       |
       v
  "Launch App"
       |
       v
   /app route
       |
       +---> VITE_DEMO_MODE=true  ---> VoiceStocksDemo
       |
       +---> VITE_DEMO_MODE=false ---> DocumentationPage (full app)
```

The landing/marketing page is **not affected** by demo mode - it always shows the same content.

### Files Involved

- `src/utils/demoMode.ts` - Utility functions for checking demo mode
- `src/components/AppEntry.tsx` - Entry component that conditionally renders based on demo mode
- `src/App.tsx` - Uses `AppEntry` at the `/app` route
- `render.yaml` - Sets `VITE_DEMO_MODE=true` for production deployment

## Configuration

### Local Development

Create a `.env` file in the project root:

```bash
# Show demo at /app
VITE_DEMO_MODE=true

# Show full app at /app (default behavior)
VITE_DEMO_MODE=false
```

### Render Deployment

The `render.yaml` is configured with demo mode enabled by default:

```yaml
envVars:
  - key: VITE_DEMO_MODE
    value: "true"
```

To disable demo mode in production:
1. Update `render.yaml` to set `value: "false"`
2. Or override via Render Dashboard > Service > Environment

### Environment Variable Priority

Vite environment variables are embedded at build time, so:
1. Variables in `render.yaml` are applied during the build
2. Changes require a new deployment to take effect
3. Runtime changes to env vars won't affect the built static files

## Testing Demo Mode Locally

```bash
# Test demo mode
VITE_DEMO_MODE=true npm run dev

# Test full app mode
VITE_DEMO_MODE=false npm run dev
```

## Direct Demo Access

Regardless of demo mode setting, the demo is always accessible at:
- `/voice-stocks-demo` - Direct route to VoiceStocksDemo component

This allows testing the demo experience even when the main app is in full mode.

## Implementation Details

### demoMode.ts

```typescript
export function isDemoModeEnabled(): boolean {
  const demoMode = import.meta.env.VITE_DEMO_MODE;
  return demoMode?.toLowerCase() === 'true';
}
```

The function:
- Reads `VITE_DEMO_MODE` from Vite's import.meta.env
- Performs case-insensitive comparison
- Returns `false` if the variable is unset or any value other than 'true'

### AppEntry.tsx

```typescript
export function AppEntry() {
  const isDemo = isDemoModeEnabled();

  if (isDemo) {
    return <VoiceStocksDemo />;
  }

  return <DocumentationPage />;
}
```

Simple conditional rendering based on the demo mode check.

## Troubleshooting

### Changes not taking effect
- Ensure you've restarted the dev server after changing `.env`
- For production, trigger a new deployment after changing `render.yaml`

### Demo mode not detected
- Check that the variable is prefixed with `VITE_` (required by Vite)
- Verify the value is exactly `"true"` (case-insensitive, but quoted in YAML)

### TypeScript errors
- The `VITE_DEMO_MODE` type is declared in `src/vite-env.d.ts`
