import { expect, test } from '@playwright/test';

for (const mode of ['listing', 'search'] as const) {
  test(`Users ${mode} includes historical accounts and keeps optional filters across pages`, async ({ page }) => {
    await page.context().addCookies([{ name: 'taskiller_staff', value: 'fixture-session', url: 'http://127.0.0.1:4173/admin' }]);
    const directoryRequest = (search: boolean) => page.waitForRequest(request =>
      new URL(request.url()).pathname === (search ? '/admin/api/users/search' : '/admin/api/users'));
    const search = mode === 'search';
    const query = search ? { query: 'Historical' } : {};
    async function filters(action: () => Promise<unknown>, isSearch = search) {
      const [request] = await Promise.all([directoryRequest(isSearch), action()]);
      return isSearch ? request.postDataJSON() : Object.fromEntries(new URL(request.url()).searchParams);
    }

    expect(await filters(() => page.goto('/admin/users'), false)).toEqual({});
    await expect(page.getByText('Sample User', { exact: true })).toBeVisible();
    if (search) {
      expect(await filters(() => page.getByLabel('Search users').fill('Historical'))).toEqual(query);
      await expect(page.getByText('Historical Verified', { exact: true })).toBeVisible();
    }
    const nextPage = page.getByRole('button', { name: 'Next page' });
    expect(await filters(() => nextPage.click())).toEqual({ ...query, cursor: '1' });
    await expect(page.getByText(search ? 'Historical Unverified' : 'Historical Verified', { exact: true })).toBeVisible();
    expect(await filters(() => page.getByRole('button', { name: 'Previous page' }).click())).toEqual(query);

    await nextPage.click();
    await expect(page.getByText(search ? 'Historical Unverified' : 'Historical Verified', { exact: true })).toBeVisible();
    const verification = page.getByLabel('Email verification');
    expect(await filters(() => verification.selectOption('false'))).toEqual({ ...query, verified: search ? false : 'false' });
    await expect(page.getByText('Historical Unverified', { exact: true })).toBeVisible();
    expect(await filters(() => verification.selectOption('true'))).toEqual({ ...query, verified: search ? true : 'true' });
    await expect(page.getByText(search ? 'Historical Verified' : 'Sample User', { exact: true })).toBeVisible();
    expect(await filters(() => verification.selectOption(''))).toEqual(query);

    await page.getByText('All registration dates', { exact: true }).click();
    const from = page.getByLabel('From (UTC)');
    const before = page.getByLabel('Before (UTC)');
    const start = '2024-01-01T00:00:00Z';
    const end = '2025-01-01T00:00:00Z';
    expect(await filters(() => from.fill('2024-01-01'))).toEqual({ ...query, start });
    expect(await filters(() => nextPage.click())).toEqual({ ...query, start, cursor: '1' });
    expect(await filters(() => before.fill('2025-01-01'))).toEqual({ ...query, start, end });
    await expect(page.getByText('Historical Unverified', { exact: true })).toBeVisible();
    await expect(nextPage).toBeHidden();
    expect(await filters(() => from.fill(''))).toEqual({ ...query, end });
    expect(await filters(() => before.fill(''))).toEqual(query);
  });
}

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
