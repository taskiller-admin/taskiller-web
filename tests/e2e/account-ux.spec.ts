import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => { await installMockApi(page); });

test('registration explains password requirements and reveals without changing the password', async ({ page }) => {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('long-enough-password');
  await expect(page.getByText('Use at least 10 characters.')).toBeVisible();
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('long-enough-password');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(page.getByRole('link', { name: 'Taskiller home' }).first()).toHaveAttribute('href', '/');
});

test('manual email verification has a named token field', async ({ page }) => {
  await page.goto('/verify-email');
  await expect(page.getByLabel('Verification token')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verify email', exact: true })).toBeDisabled();
});

test('failed settings requests show recovery instead of editable defaults or empty devices', async ({ page }) => {
  await page.route('**/api/v1/me/preferences', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/v1/auth/sessions', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('/settings');
  await expect(page.getByText('Could not load your preferences. Your saved preferences have not changed.')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Save preferences' })).toHaveCount(0);
  await expect(page.getByText('Could not load devices. Refresh to try again.')).toBeVisible();
  await expect(page.getByText('No active sessions were returned.')).toHaveCount(0);
  await expect(page.getByLabel('Type DELETE MY ACCOUNT to continue.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete account', exact: true }).click();
  await expect(page.getByLabel('Type DELETE MY ACCOUNT to continue.')).toBeVisible();
});

test('profile draft navigation is protected and cancellation retains the draft', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Display name', { exact: true }).fill('Unsaved account name');
  let prompts = 0;
  page.on('dialog', async dialog => { prompts += 1; await dialog.dismiss(); });
  await page.getByRole('link', { name: 'Today', exact: true }).first().click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Unsaved account name');
  expect(prompts).toBeGreaterThanOrEqual(1);
});

test('saving a profile sends its ETag, announces success and clears draft protection', async ({ page }) => {
  let suppliedEtag = '';
  await page.route('**/api/v1/me', async route => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    suppliedEtag = route.request().headers()['if-match'] ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { ETag: '"profile:v2"' }, body: JSON.stringify({
      id: '11111111-1111-4111-8111-111111111111', email: 'release@example.com', displayName: 'Saved account name',
      emailVerified: true, createdAt: '2026-09-30T10:00:00Z', updatedAt: '2026-11-18T10:00:00Z', version: 2
    }) });
  });
  await page.goto('/settings');
  await page.getByLabel('Display name', { exact: true }).fill('Saved account name');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeVisible();
  expect(suppliedEtag).toBeTruthy();
  let prompted = false;
  page.on('dialog', async dialog => { prompted = true; await dialog.dismiss(); });
  await page.getByRole('link', { name: 'Today', exact: true }).first().click();
  await expect(page).toHaveURL(/\/today$/);
  expect(prompted).toBe(false);
});
