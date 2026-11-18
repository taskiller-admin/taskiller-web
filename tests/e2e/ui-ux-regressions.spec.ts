import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => { await installMockApi(page); });

test('search stays within the screen and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/today');
  const trigger = page.getByRole('button', { name: 'Search work', exact: true });
  await trigger.click();
  const panel = page.getByRole('region', { name: 'Search Taskiller work' });
  const bounds = await panel.boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('account actions are available on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/today');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
});

test('failed capture keeps the draft and offers recovery', async ({ page }) => {
  await page.route('**/__api/api/v1/work-items', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({ status: 503, json: { title: 'Service unavailable', detail: 'Please try again.' } });
  });
  await page.goto('/today');
  await page.getByLabel('Quick capture chore').fill('Keep this draft');
  await page.getByRole('button', { name: 'Capture chore', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/try again|retry/i);
  await expect(page.getByLabel('Quick capture chore')).toHaveValue('Keep this draft');
});

test('export dialog takes focus, contains it and closes with Escape', async ({ page }) => {
  await page.goto('/today');
  await page.getByRole('button', { name: 'Account menu' }).click();
  const trigger = page.getByRole('button', { name: 'Export work', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Export your work' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeFocused();
});

test('authenticated Today has no serious accessibility violations', async ({ page }) => {
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(v => ['critical', 'serious'].includes(v.impact ?? ''))).toEqual([]);
});

test('search follows pagination and finds work beyond the first page', async ({ page }) => {
  await page.route('**/__api/api/v1/work-items?**', async route => {
    const url = new URL(route.request().url());
    const second = url.searchParams.get('cursor') === 'second';
    await route.fulfill({ json: { items: [{ id: second ? 'later-item' : 'first-item', kind: 'chore', name: second ? 'Find this later Chore' : 'First page', status: 'draft', description: null, parentId: null, deletedAt: null }], page: { hasMore: !second, nextCursor: second ? null : 'second' } } });
  });
  await page.goto('/today');
  await page.getByRole('button', { name: 'Search work', exact: true }).click();
  await page.getByRole('searchbox').fill('Find this later');
  await expect(page.getByRole('region', { name: 'Search Taskiller work' }).getByRole('link', { name: /Find this later Chore/ })).toBeVisible();
});

test('Settings sign-out clears private account data before another login', async ({ page }) => {
  let secondAccount = false;
  let releaseProfile!: () => void;
  const profileGate = new Promise<void>(resolve => releaseProfile = resolve);
  await page.route('**/__api/api/v1/auth/logout-all', r => r.fulfill({ status: 204 }));
  await page.route('**/__api/api/v1/auth/login', r => r.fulfill({ json: { accessToken: 'new-account-token', user: { id: 'second-user', displayName: 'Second account', email: 'second@example.com' } } }));
  await page.route('**/__api/api/v1/me', async route => {
    if (!secondAccount) return route.fallback();
    await profileGate;
    await route.fulfill({ json: { id: 'second-user', displayName: 'Second account', email: 'second@example.com', updatedAt: '2026-11-18T10:00:00Z', version: 1 }, headers: { ETag: '"second:v1"' } });
  });
  await page.goto('/settings');
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Release Tester');
  await page.getByRole('button', { name: 'Sign out all', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm all devices', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  secondAccount = true;
  await page.getByLabel('Email', { exact: true }).fill('second@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password-long-enough');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/today$/);
  await page.getByRole('button', { name: 'Account menu' }).click();
  const request = page.waitForRequest(r => new URL(r.url()).pathname === '/__api/api/v1/me');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await request;
  await expect(page.getByLabel('Display name', { exact: true })).toHaveCount(0);
  releaseProfile();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Second account');
});

test('first Import opens a native picker and then the accessible preview', async ({ page }) => {
  await page.goto('/today');
  await page.getByRole('button', { name: 'Account menu' }).click();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import work', exact: true }).click();
  await (await picker).setFiles('docs/export_format/taskiller-portable-example.json');
  const preview = page.getByRole('dialog', { name: 'Review your import' });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(preview).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
});
