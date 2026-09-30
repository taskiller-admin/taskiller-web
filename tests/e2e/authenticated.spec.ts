import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => {
  await installMockApi(page);
});

test('login bootstraps the authenticated app and quick capture refreshes Today', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('release@example.com');
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByText('Ship the release checklist')).toBeVisible();

  await page.getByLabel('Quick capture chore').fill('Write production notes');
  await page.getByRole('button', { name: 'Capture chore' }).click();

  await expect(page.getByText('Write production notes')).toBeVisible();
});

test('authenticated shell remains keyboard navigable', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('release@example.com');
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});
