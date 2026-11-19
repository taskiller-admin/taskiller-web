import { expect, test } from '@playwright/test';

test('protected admin links require a separate staff session', async ({ page }) => {
  const response = await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/login\?returnTo=/);
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  expect(response?.headers()['cache-control']).toContain('no-store');
});

test('admin relay rejects unknown routes and cross-origin writes', async ({ request }) => {
  expect((await request.get('/admin/api/not-allowed')).status()).toBe(404);
  expect((await request.post('/admin/api/auth/login', {
    headers: { Origin: 'https://untrusted.example' }, data: { username: 'staff', password: 'example' }
  })).status()).toBe(403);
});

test('staff enrollment accepts an existing password and clears the invitation URL', async ({ page }) => {
  await page.goto('/admin/enroll#token=fixture-invite');
  await expect(page).toHaveURL(/\/admin\/enroll$/);
  await expect(page.getByLabel('Invitation code')).toHaveValue('fixture-invite');
  await page.getByLabel('Password', { exact: true }).fill('existing9');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('FIXTUREKEY', { exact: true })).toBeVisible();
  await page.getByLabel('Authenticator code').fill('123456');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByText('fixture-recovery-code', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Continue to sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
});
