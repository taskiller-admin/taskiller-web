import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';
process.env.PUBLIC_TASKILLER_API_URL ??= `${baseURL}/__api`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: `${baseURL}/healthz`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
});
