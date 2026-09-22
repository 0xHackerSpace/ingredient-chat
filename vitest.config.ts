import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so the federation plugin doesn't run in tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // e2e/ holds Playwright specs, not Vitest ones — its `*.spec.ts` files
    // otherwise match Vitest's default glob too.
    exclude: ['node_modules/**', 'e2e/**'],
  },
});
