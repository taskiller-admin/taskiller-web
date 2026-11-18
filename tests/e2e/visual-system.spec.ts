import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => { await installMockApi(page); });

test('login shows an animated busy control and prevents duplicate submissions', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  await page.route('**/__api/api/v1/auth/login', async route => {
    requests++;
    await gate;
    await route.fallback();
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('release@example.com');
  await page.getByLabel('Password', { exact: true }).fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  const busy = page.getByRole('button', { name: 'Logging in…', exact: true });
  await expect(busy).toBeDisabled();
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(busy.locator('.tk-spinner')).toBeVisible();
  expect(await busy.locator('.tk-spinner').evaluate(el => getComputedStyle(el).animationName)).toBe('tk-spin');
  expect(requests).toBe(1);
  release();
  await expect(page).toHaveURL(/\/today$/);
});

test('logout presents visible feedback while the request is pending', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/__api/api/v1/auth/logout', async route => { await gate; await route.fallback(); });
  await page.goto('/today');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByText('Signing you out', { exact: true })).toBeVisible();
  expect(await page.getByRole('heading', { name: 'Today', exact: true, includeHidden: true }).evaluate(el => Boolean(el.closest('[inert]')))).toBe(true);
  await expect(page.locator('.tk-operation-overlay .tk-spinner')).toBeVisible();
  release();
  await expect(page).toHaveURL(/\/login$/);
});

test('capture is visibly busy and preserves its response announcement', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/__api/api/v1/work-items', async route => {
    if (route.request().method() === 'POST') await gate;
    await route.fallback();
  });
  await page.goto('/today');
  await page.getByLabel('Quick capture chore').fill('Make the interface feel alive');
  await page.getByRole('button', { name: 'Capture chore', exact: true }).click();
  const busy = page.getByRole('button', { name: 'Saving chore', exact: true });
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(busy.locator('.tk-spinner')).toBeVisible();
  release();
  await expect(page.getByRole('status').filter({ hasText: 'Make the interface feel alive' })).toBeVisible();
});

test('autonomous workspace motion stops for reduced motion without hiding content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  const durations = await page.locator('.tk-hero-orbit-track').evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).animationDuration)));
  expect(durations.every(duration => duration <= 0.001)).toBe(true);
  await expect(page.getByLabel('Quick capture chore')).toBeVisible();
});


test('motion control pauses autonomous effects and persists the choice', async ({ page }) => {
  await page.goto('/today');
  await page.getByRole('button', { name: 'Pause animations', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused');
  expect(await page.locator('.tk-today-orbit .tk-hero-orbit-track').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Resume animations', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume animations', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'active');
});


test('surface entrances keep fixed planning controls in the viewport', async ({ page }) => {
  await page.goto('/today');
  const bounds = await page.locator('.tk-page').evaluate(async root => {
    const panel = document.createElement('section');
    panel.className = 'tk-panel';
    const control = document.createElement('button');
    control.className = 'fixed';
    control.style.cssText = 'bottom:20px;left:20px;width:40px;height:40px';
    panel.append(control);
    root.append(panel);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const bounds = control.getBoundingClientRect();
    const result = { bottom: bounds.bottom, viewport: innerHeight };
    panel.remove();
    return result;
  });
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewport);
  expect(bounds.bottom).toBeGreaterThan(bounds.viewport - 60);
});
