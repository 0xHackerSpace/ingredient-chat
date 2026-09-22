import { defineConfig } from '@playwright/test';

// E2E_TARGET=preview tests the production build (run `npm run build` first);
// the default tests the dev server.
const preview = process.env.E2E_TARGET === 'preview';
const baseURL = 'http://localhost:5174';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: preview ? 'npm run preview' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
