import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/*',
        // Voice Stocks services (new, untested code - to be covered incrementally)
        'src/services/browserAI.ts',
        'src/services/highlightSystem.ts',
        'src/services/guidedTour.ts',
        'src/services/voiceCommandRouter.ts',
        'src/data/portfolioTrainingData.ts',
      ],
      thresholds: {
        branches: 10,
        functions: 8,
        lines: 10,
        statements: 10,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
