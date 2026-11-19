import { expect, test } from '@playwright/test';

test('overview charts use real backend windows and preserve job drill-down filters', async ({ page }) => {
  await page.context().addCookies([{ name: 'taskiller_staff', value: 'fixture-session', url: 'http://127.0.0.1:4173/admin' }]);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Activity over time' })).toBeVisible();
  await page.getByLabel('Date range').selectOption('7');
  await page.getByRole('button', { name: 'Registrations', exact: true }).click();
  await page.getByText('View chart data', { exact: true }).click();
  const table = page.getByRole('table', { name: 'Registrations data' });
  await expect(table.getByRole('row')).toHaveCount(8);
  await expect(table.getByRole('cell', { name: '2', exact: true })).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth + 1));
  const jobs = page.waitForRequest(request => request.url().includes('/admin/api/jobs?'));
  await page.getByRole('link', { name: 'Review failed jobs' }).click();
  expect(new URL((await jobs).url()).searchParams.get('state')).toBe('dead');
  await expect(page.getByLabel('Default window')).toHaveValue('7');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('dead');
});

test('staff MFA, private search, conflict recovery and logout through the relay', async ({ page }) => {
  await page.goto('/admin/users');
  await page.context().addCookies([{ name: 'product_only', value: 'fixture', url: 'http://127.0.0.1:4173' }]);
  await page.getByLabel('Staff username').fill('operator');
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await page.getByLabel('Authenticator code').fill('123456');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
  const request = page.waitForRequest(req => req.url().endsWith('/admin/api/users/search'));
  await page.getByLabel('Search users').fill('sample@example.invalid');
  expect((await request).postDataJSON().query).toBe('sample@example.invalid');
  expect(page.url()).not.toContain('sample');
  await page.getByRole('link', { name: 'View details' }).click();
  await page.getByRole('button', { name: 'Suspend account' }).click();
  const dialog = page.getByRole('dialog', { name: 'Suspend account' });
  await dialog.getByLabel('Reason').fill('Review requested');
  await dialog.getByRole('button', { name: 'Confirm action' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Account changed');
  await dialog.getByRole('button', { name: 'Reload record' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/login\?returnTo=/);
});
