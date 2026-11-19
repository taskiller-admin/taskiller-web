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
