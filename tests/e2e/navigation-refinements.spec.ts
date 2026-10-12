import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => { await installMockApi(page); });

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('release@example.com');
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/today$/);
}

test('compact search opens below the navigation and closes with Escape', async ({ page }) => {
  await login(page);
  await page.goto('/projects');
  await expect(page.getByRole('button', { name: 'Search work' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search Projects, Sprints and Chores' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Search work' }).click();
  const search = page.getByRole('searchbox', { name: 'Search Projects, Sprints and Chores' });
  await expect(search).toBeFocused();
  await search.fill('guide');
  await expect(page.getByRole('link', { name: 'Taskiller guide' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toHaveCount(0);
});

test('Projects tab has Project, Sprint, and Chore views', async ({ page }) => {
  await login(page);
  await page.goto('/projects');
  for (const kind of ['Projects', 'Sprints', 'Chores']) {
    await page.getByRole('tab', { name: kind }).click();
    await expect(page.getByRole('tab', { name: kind })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: kind, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'New Chore' })).toBeVisible();
});

test('Work Type manager escapes clipped creation form', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 650 });
  await login(page);
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Create or manage Work Types' }).click();
  const dialog = page.getByRole('dialog', { name: 'Your Work Types' });
  await expect(dialog).toBeVisible();
  const overlayParentIsBody = await dialog.evaluate((element) => element.parentElement?.parentElement === document.body);
  expect(overlayParentIsBody).toBe(true);
  const box = await dialog.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(651);
  await dialog.getByRole('button', { name: 'Close Work Type manager' }).click();
  await expect(dialog).toHaveCount(0);
});
