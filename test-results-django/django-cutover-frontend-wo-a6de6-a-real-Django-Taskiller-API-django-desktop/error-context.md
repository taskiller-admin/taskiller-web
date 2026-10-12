# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: django-cutover.spec.ts >> frontend works against a real Django Taskiller API
- Location: tests\e2e\django-cutover.spec.ts:9:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Django release chore 1791801021657-ef0a509655c5a8')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Django release chore 1791801021657-ef0a509655c5a8') with timeout 5000ms
  - waiting for getByText('Django release chore 1791801021657-ef0a509655c5a8')

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - link "Taskiller Today":
    - /url: /today
    - img "Taskiller"
  - navigation "Primary navigation":
    - link "Today":
      - /url: /today
      - img
      - text: Today
    - link "Inbox":
      - /url: /inbox
      - img
      - text: Inbox
    - link "Projects":
      - /url: /projects
      - img
      - text: Projects
    - link "History":
      - /url: /history
      - img
      - text: History
    - link "Analytics":
      - /url: /analytics
      - img
      - text: Analytics
  - search:
    - textbox "Search work":
      - /placeholder: Search work…
  - link "Capture":
    - /url: /inbox?capture=1
    - img
    - text: Capture
  - link "App guide":
    - /url: /guide
    - img
  - 'button "Appearance: System. Switch theme"'
  - link "Settings":
    - /url: /settings
    - img
  - link "Profile":
    - /url: /settings#profile
    - text: DE
  - button "Sign out":
    - img
- main:
  - text: Execution runway
  - heading "Today" [level=1]
  - paragraph: Keep the queue short enough to act on. Everything else can wait.
  - text: 0 open 0 unfiled
  - img
  - textbox "Quick capture chore":
    - /placeholder: Capture the next move…
  - button "Capture chore" [disabled]:
    - img
    - text: Capture
  - paragraph: Do next
  - heading "Executable work" [level=2]
  - link "Full inbox":
    - /url: /inbox
    - text: Full inbox
    - img
  - complementary:
    - img
    - paragraph: No active session
    - heading "Choose the work before choosing the timer." [level=2]
    - paragraph: Open a Chore or Sprint, shape its plan, then enter focus mode.
    - paragraph: Coming up
    - heading "Calendar pressure" [level=2]
    - link "Projects":
      - /url: /projects
    - paragraph: No planned starts or deadlines in the current queue.
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const api = (process.env.TASKILLER_DJANGO_API_URL ?? '').replace(/\/$/, '');
  4  | 
  5  | if (!api) {
  6  |   throw new Error('TASKILLER_DJANGO_API_URL is required for Django integration E2E');
  7  | }
  8  | 
  9  | test('frontend works against a real Django Taskiller API', async ({ page, request }) => {
  10 |   const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  11 |   const email = `django-e2e-${id}@example.com`;
  12 |   const password = 'Taskiller-django-e2e-password';
  13 | 
  14 |   expect((await request.get(`${api}/health/live`)).ok()).toBeTruthy();
  15 |   expect((await request.get(`${api}/health/ready`)).ok()).toBeTruthy();
  16 | 
  17 |   const schema = await request.get(`${api}/openapi.json`);
  18 |   expect(schema.ok()).toBeTruthy();
  19 |   const openapi = await schema.json();
  20 |   expect(openapi.paths['/api/v1/auth/login']).toBeTruthy();
  21 |   expect(openapi.paths['/api/v1/work-items']).toBeTruthy();
  22 | 
  23 |   const registration = await request.post(`${api}/api/v1/auth/register`, {
  24 |     data: {
  25 |       email,
  26 |       password,
  27 |       displayName: 'Django E2E',
  28 |       timezone: 'Europe/Istanbul',
  29 |       locale: 'en'
  30 |     }
  31 |   });
  32 |   expect(registration.status()).toBe(201);
  33 | 
  34 |   await page.goto('/login');
  35 |   await page.getByLabel('Email').fill(email);
  36 |   await page.getByLabel('Password').fill(password);
  37 |   await page.getByRole('button', { name: 'Log in' }).click();
  38 | 
  39 |   await expect(
  40 |     page.getByRole('alert'),
  41 |     'Login returned an application error'
  42 |   ).toBeHidden();
  43 | 
  44 |   await expect(page).toHaveURL(/\/today$/, {
  45 |     timeout: 15_000
  46 |   });
  47 |   await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  48 | 
  49 |   const choreName = `Django release chore ${id}`;
  50 |   await page.getByLabel('Quick capture chore').fill(choreName);
  51 |   await page.getByRole('button', { name: 'Capture chore' }).click();
  52 |   await expect(page.getByText(choreName)).toBeVisible();
  53 | 
  54 |   await page.reload();
> 55 |   await expect(page.getByText(choreName)).toBeVisible();
     |                                           ^ Error: expect(locator).toBeVisible() failed
  56 | });
  57 | 
```