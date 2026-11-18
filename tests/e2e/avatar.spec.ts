import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => { await installMockApi(page); });

test('profile renders a local geometric avatar without initials', async ({ page }) => {
  await page.goto('/settings');
  const avatar = page.locator('#profile svg[data-avatar]').first();
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveAttribute('aria-hidden', 'true');
  await expect(avatar.locator('text, image')).toHaveCount(0);
  const initial = await avatar.getAttribute('data-avatar');
  await page.reload();
  await expect(avatar).toHaveAttribute('data-avatar', initial!);
});

test('regeneration and palette choices persist locally without storing email', async ({ page }) => {
  await page.goto('/settings');
  const avatar = page.locator('#profile svg[data-avatar]').first();
  await expect(avatar).toBeVisible();
  const original = await avatar.getAttribute('data-avatar');
  await page.getByRole('button', { name: 'Regenerate avatar', exact: true }).click();
  await expect(avatar).not.toHaveAttribute('data-avatar', original!);
  await page.getByRole('button', { name: 'Palette: Coral', exact: true }).click();
  await page.getByRole('button', { name: 'Style: Mosaic', exact: true }).click();
  const generated = await avatar.getAttribute('data-avatar');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  const stored = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.startsWith('taskiller:avatar:')));
  expect(stored).toHaveLength(1);
  expect(JSON.stringify(stored)).not.toContain('release@example.com');
  expect(JSON.stringify(stored)).not.toContain('@');
  await page.reload();
  await expect(avatar).toHaveAttribute('data-avatar', generated!);
  await expect(page.getByRole('button', { name: 'Palette: Coral', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Style: Mosaic', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('unavailable storage keeps the generator usable and reports its limit', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Regenerate avatar', exact: true }).click();
  await expect(page.getByText('Storage unavailable. This choice lasts until you reload.', { exact: true })).toBeVisible();
});

test('reduced motion disables autonomous avatar animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Style: Orbit', exact: true }).click();
  const orbit = page.locator('#profile svg[data-avatar] .orbit');
  await expect(orbit).toBeVisible();
  expect(await orbit.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});
