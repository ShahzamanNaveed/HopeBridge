import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './specs',
  testMatch: 'auth.spec.ts',
  workers: 1,
  globalSetup: './auth.setup.ts',
  timeout: 60000,
  outputDir: 'test-results/auth-runs',
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'off', screenshot: 'off' },
  projects: [{ name: 'auth-chromium', use: { browserName: 'chromium' } }],
});
