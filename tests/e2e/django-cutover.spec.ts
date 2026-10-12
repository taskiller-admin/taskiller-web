import { expect, test } from '@playwright/test';

const api = (process.env.TASKILLER_DJANGO_API_URL ?? '').replace(/\/$/, '');

if (!api) {
  throw new Error('TASKILLER_DJANGO_API_URL is required for Django integration E2E');
}

test('frontend works against a real Django Taskiller API', async ({ page, request }) => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `django-e2e-${id}@example.com`;
  const password = 'Taskiller-django-e2e-password';

  expect((await request.get(`${api}/health/live`)).ok()).toBeTruthy();
  expect((await request.get(`${api}/health/ready`)).ok()).toBeTruthy();

  const schema = await request.get(`${api}/openapi.json`);
  expect(schema.ok()).toBeTruthy();
  const openapi = await schema.json();
  expect(openapi.paths['/api/v1/auth/login']).toBeTruthy();
  expect(openapi.paths['/api/v1/work-items']).toBeTruthy();

  const registration = await request.post(`${api}/api/v1/auth/register`, {
    data: {
      email,
      password,
      displayName: 'Django E2E',
      timezone: 'Europe/Istanbul',
      locale: 'en'
    }
  });
  expect(registration.status()).toBe(201);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(
    page.getByRole('alert'),
    'Login returned an application error'
  ).toBeHidden();

  await expect(page).toHaveURL(/\/today$/, {
    timeout: 15_000
  });
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  const choreName = `Django release chore ${id}`;
  await page.getByLabel('Quick capture chore').fill(choreName);
  await page.getByRole('button', { name: 'Capture chore' }).click();
  await expect(page.getByText(choreName)).toBeVisible();

  await page.reload();
  // A hard reload must first restore the session from the secure refresh cookie.
  // Free-tier API cold starts can take longer than Playwright's 5s assertion default.
  await expect(page).toHaveURL(/\/today$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({
    timeout: 30_000
  });
  await expect(page.getByText(choreName)).toBeVisible({ timeout: 45_000 });
});
