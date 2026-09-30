import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing page exposes the primary entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Taskiller/);
  await expect(page.getByRole('heading', { name: 'Make the next move obvious.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create your workspace' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
});

test('login page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/login');
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
  expect(severe).toEqual([]);
});

test('unknown route renders the Taskiller 404 surface', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(page.getByRole('heading', { name: 'That page is not here.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to Today' })).toBeVisible();
});
