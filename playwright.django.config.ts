import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';
const djangoApi = process.env.TASKILLER_DJANGO_API_URL?.replace(/\/$/, '');

if (!djangoApi) {
  throw new Error(
    'TASKILLER_DJANGO_API_URL is required, e.g. http://127.0.0.1:8000'
  );
}

process.env.PUBLIC_TASKILLER_API_URL = djangoApi;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /django-cutover\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results-django',
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'django-desktop', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: `${baseURL}/healthz`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
});
