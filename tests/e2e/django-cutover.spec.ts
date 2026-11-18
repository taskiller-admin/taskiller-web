import { expect, test } from '@playwright/test';

const api = (process.env.TASKILLER_DJANGO_API_URL ?? '').replace(/\/$/, '');

if (!api) {
  throw new Error('TASKILLER_DJANGO_API_URL is required for Django integration E2E');
}

test('frontend works against a real Django Taskiller API', async ({ page, request }) => {
  test.setTimeout(120_000);
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
  await expect(page.getByText(choreName, { exact: true })).toBeVisible();

  await page.reload();
  // A hard reload must first restore the session from the secure refresh cookie.
  // Free-tier API cold starts can take longer than Playwright's 5s assertion default.
  await expect(page).toHaveURL(/\/today$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({
    timeout: 30_000
  });
  await expect(page.getByText(choreName, { exact: true })).toBeVisible({ timeout: 45_000 });

  // Exercise the complete work loop against actual ETags and session timestamps.
  await page.getByText(choreName, { exact: true }).click();
  await page.getByRole('link', { name: 'Plan & Start', exact: true }).click();
  const workType = page.getByRole('combobox', { name: 'Work Type', exact: true });
  await expect.poll(() => workType.locator('option').count()).toBeGreaterThan(1);
  const typeId = await workType.locator('option').nth(1).getAttribute('value');
  await workType.selectOption(typeId!);
  await page.getByRole('button', { name: 'Save Work Type', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Generate plan', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start from scratch', exact: true }).click();
  await page.getByRole('button', { name: 'Save & start', exact: true }).click();
  await expect(page).toHaveURL(/\/session\//);
  const start = page.getByRole('button', { name: 'Start segment', exact: true });
  if (await start.count()) await start.click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Complete segment', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Finished.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Focus, 4 of 5', exact: true }).click();
  await page.getByLabel('Note', { exact: true }).fill('Verified a complete session against Django.');
  await page.getByRole('button', { name: 'Save review', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Review saved.' })).toBeVisible();
  await page.getByRole('link', { name: 'Leave focus', exact: true }).click();
  await expect(page).toHaveURL(/\/today$/);
});
