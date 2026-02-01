/**
 * AppEntry Component Tests
 *
 * Tests the conditional rendering of AppEntry based on demo mode.
 * We mock the demoMode utility to control which component is rendered.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the demoMode utility
vi.mock('../utils/demoMode', () => ({
  isDemoModeEnabled: vi.fn(),
}));

// Mock the child components
vi.mock('./DocumentationPage', () => ({
  default: () => <div data-testid="documentation-page">DocumentationPage</div>,
}));

vi.mock('../pages/VoiceStocksDemo', () => ({
  VoiceStocksDemo: () => <div data-testid="voice-stocks-demo">VoiceStocksDemo</div>,
}));

import { isDemoModeEnabled } from '../utils/demoMode';

// Wrapper for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
  </MemoryRouter>
);

describe('AppEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should render VoiceStocksDemo when demo mode is enabled', async () => {
    vi.mocked(isDemoModeEnabled).mockReturnValue(true);

    // Import after setting up the mock
    const { AppEntry } = await import('./AppEntry');

    render(
      <TestWrapper>
        <AppEntry />
      </TestWrapper>
    );

    expect(screen.getByTestId('voice-stocks-demo')).toBeInTheDocument();
    expect(screen.queryByTestId('documentation-page')).not.toBeInTheDocument();
  });

  it('should render DocumentationPage when demo mode is disabled', async () => {
    vi.mocked(isDemoModeEnabled).mockReturnValue(false);

    // Import after setting up the mock
    const { AppEntry } = await import('./AppEntry');

    render(
      <TestWrapper>
        <AppEntry />
      </TestWrapper>
    );

    expect(screen.getByTestId('documentation-page')).toBeInTheDocument();
    expect(screen.queryByTestId('voice-stocks-demo')).not.toBeInTheDocument();
  });

  it('should call isDemoModeEnabled to determine which component to render', async () => {
    vi.mocked(isDemoModeEnabled).mockReturnValue(false);

    const { AppEntry } = await import('./AppEntry');

    render(
      <TestWrapper>
        <AppEntry />
      </TestWrapper>
    );

    expect(isDemoModeEnabled).toHaveBeenCalled();
  });
});
