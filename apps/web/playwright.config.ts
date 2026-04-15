import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
  },
  webServer: [
    {
      command: 'pnpm --filter @vibe/api dev',
      cwd: '../..',
      env: {
        HOST: '127.0.0.1',
        PORT: '3000',
      },
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --host 127.0.0.1 --port 4173',
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:3000',
      },
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
