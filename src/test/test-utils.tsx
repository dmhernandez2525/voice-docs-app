import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function that wraps components with necessary providers
 */
type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();

  // Add any providers here (ThemeProvider, etc.)
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

// Re-export commonly used utilities from testing-library
export {
  screen,
  waitFor,
  within,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';

// Override render with custom render
export { customRender as render };

/**
 * Mock voice recognition result
 */
export function mockSpeechRecognitionResult(
  transcript: string,
  confidence: number = 0.9
) {
  return {
    results: [
      [
        {
          transcript,
          confidence,
        },
      ],
    ],
    resultIndex: 0,
  };
}

/**
 * Wait for speech synthesis to complete (mock)
 */
export async function waitForSpeech(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Create a mock voice
 */
export function createMockVoice(
  name: string = 'Test Voice',
  lang: string = 'en-US'
): SpeechSynthesisVoice {
  return {
    name,
    lang,
    default: true,
    localService: true,
    voiceURI: `urn:moz-tts:speechd:${name}?${lang}`,
  };
}
