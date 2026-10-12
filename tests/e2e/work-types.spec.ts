import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

const typeId = '22222222-2222-4222-8222-222222222222';

test('creates a custom Work Type with six characteristics and immediately selects it', async ({ page }) => {
  await installMockApi(page);
  let items: unknown[] = [];
  let createdBody: Record<string, unknown> | null = null;

  await page.route('**/__api/api/v1/work-types**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path !== '/__api/api/v1/work-types') return route.fallback();
    if (request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items }) });
    }
    if (request.method() === 'POST') {
      createdBody = request.postDataJSON() as Record<string, unknown>;
      const item = { ...createdBody, id: typeId, system: false, version: 1 };
      items = [item];
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(item) });
    }
    return route.fulfill({ status: 404 });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('release@example.com');
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.goto('/projects');

  await page.getByRole('button', { name: 'Create or manage Work Types' }).click();
  const dialog = page.getByRole('dialog', { name: 'Your Work Types' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Display name' }).fill('Research Writing');
  await dialog.getByRole('textbox', { name: 'Slug' }).fill('research-writing');
  await dialog.getByRole('textbox', { name: 'Description' }).fill('Writing and studying research papers.');
  await dialog.getByRole('combobox', { name: 'Cognitive demand' }).selectOption('high');
  await dialog.getByRole('combobox', { name: 'Learning mode' }).selectOption('practice');
  await dialog.getByRole('button', { name: 'Create Work Type' }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Work type' })).toHaveValue(typeId);
  expect(createdBody).toMatchObject({
    slug: 'research-writing',
    displayName: 'Research Writing',
    description: 'Writing and studying research papers.',
    characteristics: {
      cognitiveDemand: 'high', interruptionSensitivity: 'medium',
      continuityNeed: 'medium', repetitiveness: 'medium',
      physicality: 'sedentary', learningMode: 'practice'
    }
  });
});
