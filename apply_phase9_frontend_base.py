#!/usr/bin/env python3
from pathlib import Path
import json
repo = Path.cwd()
if not (repo/'package.json').exists(): raise SystemExit('Run from taskiller-web root.')

def write(path, content):
    target = repo/path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')
    print(f'updated {path}')
write(Path('playwright.django.config.ts'), "import { defineConfig, devices } from '@playwright/test';\n\nconst baseURL = 'http://127.0.0.1:4173';\nconst djangoApi = process.env.TASKILLER_DJANGO_API_URL?.replace(/\\/$/, '');\n\nif (!djangoApi) {\n  throw new Error(\n    'TASKILLER_DJANGO_API_URL is required, e.g. http://127.0.0.1:8000'\n  );\n}\n\nprocess.env.PUBLIC_TASKILLER_API_URL = djangoApi;\n\nexport default defineConfig({\n  testDir: './tests/e2e',\n  testMatch: /django-cutover\\.spec\\.ts/,\n  fullyParallel: false,\n  forbidOnly: !!process.env.CI,\n  retries: process.env.CI ? 1 : 0,\n  workers: 1,\n  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',\n  outputDir: 'test-results-django',\n  use: {\n    baseURL,\n    serviceWorkers: 'block',\n    trace: 'on-first-retry',\n    screenshot: 'only-on-failure'\n  },\n  projects: [\n    { name: 'django-desktop', use: { ...devices['Desktop Chrome'] } }\n  ],\n  webServer: {\n    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',\n    url: `${baseURL}/healthz`,\n    timeout: 180_000,\n    reuseExistingServer: !process.env.CI\n  }\n});\n")
write(Path('tests/e2e/django-cutover.spec.ts'), "import { expect, test } from '@playwright/test';\n\nconst api = process.env.TASKILLER_DJANGO_API_URL!.replace(/\\/$/, '');\n\ntest('frontend works against a real Django Taskiller API', async ({ page, request }) => {\n  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;\n  const email = `django-e2e-${id}@example.com`;\n  const password = 'Taskiller-django-e2e-password';\n\n  expect((await request.get(`${api}/health/live`)).ok()).toBeTruthy();\n  expect((await request.get(`${api}/health/ready`)).ok()).toBeTruthy();\n\n  const schema = await request.get(`${api}/openapi.json`);\n  expect(schema.ok()).toBeTruthy();\n  const openapi = await schema.json();\n  expect(openapi.paths['/api/v1/auth/login']).toBeTruthy();\n  expect(openapi.paths['/api/v1/work-items']).toBeTruthy();\n\n  const registration = await request.post(`${api}/api/v1/auth/register`, {\n    data: {\n      email,\n      password,\n      displayName: 'Django E2E',\n      timezone: 'Europe/Istanbul',\n      locale: 'en'\n    }\n  });\n  expect(registration.status()).toBe(201);\n\n  await page.goto('/login');\n  await page.getByLabel('Email').fill(email);\n  await page.getByLabel('Password').fill(password);\n  await page.getByRole('button', { name: 'Log in' }).click();\n\n  await expect(page).toHaveURL(/\\/today$/);\n  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();\n\n  const choreName = `Django release chore ${id}`;\n  await page.getByLabel('Quick capture chore').fill(choreName);\n  await page.getByRole('button', { name: 'Capture chore' }).click();\n  await expect(page.getByText(choreName)).toBeVisible();\n\n  await page.reload();\n  await expect(page.getByText(choreName)).toBeVisible();\n});\n")
write(Path('PHASE9_DJANGO_E2E.md'), '# Phase 9 Real-Django E2E\n\nFrontend source: `c49bedaf7dc33dc13403d298be092b02562def09`\n\nRun against a disposable Django backend:\n\n```bash\nTASKILLER_DJANGO_API_URL=http://127.0.0.1:8000 npm run test:e2e:django\n```\n\nThe backend must allow `http://127.0.0.1:4173` in `TASKILLER_CORS_ORIGINS`.\n')

package = repo/'package.json'
data = json.loads(package.read_text(encoding='utf-8'))
data.setdefault('scripts', {})['test:e2e:django'] = 'playwright test --config playwright.django.config.ts'
package.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print('patched package.json')
print('\nPhase 9 frontend real-Django E2E mode applied.')
