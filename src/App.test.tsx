import { describe, it, expect } from 'vitest';
import { render, screen } from './test/test-utils';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // App should render successfully
    expect(document.body).toBeInTheDocument();
  });

  it('renders the main documentation page', () => {
    render(<App />);
    // Look for common elements that should be present
    // This test should be expanded based on actual App content
    expect(screen.getByRole('main') || document.querySelector('main')).toBeTruthy();
  });
});
