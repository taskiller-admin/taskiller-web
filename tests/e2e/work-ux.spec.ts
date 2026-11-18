import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

const id = '33333333-3333-4333-8333-333333333333';
function work(name: string, kind = 'project', workId = id) {
  return { id: workId, kind, name, status: 'draft', parentId: null, workTypeId: null,
    description: null, position: 1000, priority: null, estimatedEffortSeconds: null,
    plannedStartAt: null, deadlineAt: null, targetStartDate: null, targetEndDate: null,
    characteristicOverrides: null, effectiveCharacteristics: null, completedAt: null,
    createdAt: '2026-09-30T10:00:00Z', updatedAt: '2026-09-30T10:00:00Z', deletedAt: null, version: 1 };
}

test.beforeEach(async ({ page }) => {
  await installMockApi(page);
  await page.route('**/__api/api/v1/work-types', (route) => route.fulfill({ json: { items: [] } }));
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('release@example.com');
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/today$/);
});

test('kind tabs support keyboard, linked panels, reload and Project creation link', async ({ page }) => {
  await page.goto('/projects?kind=chore');
  const chores = page.getByRole('tab', { name: 'Chores', exact: true });
  await expect(chores).toHaveAttribute('aria-selected', 'true');
  await chores.focus();
  await page.keyboard.press('ArrowLeft');
  const sprints = page.getByRole('tab', { name: 'Sprints', exact: true });
  await expect(sprints).toBeFocused();
  await expect(page).toHaveURL(/kind=sprint/);
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', await sprints.getAttribute('id') as string);
  await page.reload();
  await expect(sprints).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('link', { name: 'create a Project', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toBeVisible();
});

test('Projects paints first page and requests subsequent pages only on Load more', async ({ page }) => {
  let nextPageRequests = 0;
  await page.route('**/__api/api/v1/work-items?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('limit') !== '24') return route.fallback();
    const more = url.searchParams.get('cursor') === 'second';
    if (more) nextPageRequests++;
    await route.fulfill({ json: { items: [work(more ? 'Second Project' : 'First Project', 'project', more ? '44444444-4444-4444-8444-444444444444' : id)], page: { hasMore: !more, nextCursor: more ? null : 'second' } } });
  });
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'First Project', exact: true })).toBeVisible();
  expect(nextPageRequests).toBe(0);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Second Project', exact: true })).toBeVisible();
  expect(nextPageRequests).toBe(1);
});

test('compact Work Types shows errors and composer preserves draft on cancelled navigation', async ({ page }) => {
  await page.route('**/__api/api/v1/work-types', (route) => route.fulfill({ status: 503, json: { title: 'Unavailable' } }));
  await page.goto('/inbox?filter=draft');
  await expect(page.getByRole('alert').filter({ hasText: 'Work Types could not be loaded' })).toBeVisible();
  const name = page.getByRole('textbox', { name: 'Chore name', exact: true });
  await name.fill('Preserve my draft');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(page).toHaveURL(/filter=draft/);
  await expect(name).toHaveValue('Preserve my draft');
});

test('Work Type dialog traps focus, closes on Escape and restores trigger', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.getByRole('button', { name: 'Create or manage Work Types' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Your Work Types' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 18; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('work detail distinguishes failed hierarchy and next work from empty data', async ({ page }) => {
  await page.route(`**/__api/api/v1/work-items/${id}`, (route) => route.fulfill({ json: work('Organize the release'), headers: { ETag: '"v1"' } }));
  await page.goto(`/work/${id}`);
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load the hierarchy' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load next work' })).toBeVisible();
  await expect(page.getByText('No children yet.', { exact: false })).toHaveCount(0);
  await expect(page.locator('main main')).toHaveCount(0);
});

test('editor announces save, clears the draft guard and preserves If-Match', async ({ page }) => {
  let item = work('Original Chore', 'chore');
  let match: string | undefined;
  await page.route(`**/__api/api/v1/work-items/${id}`, async (route) => {
    if (route.request().method() === 'PATCH') {
      match = route.request().headers()['if-match'];
      item = { ...item, ...route.request().postDataJSON() };
    }
    await route.fulfill({ json: item, headers: { ETag: '"v1"' } });
  });
  await page.goto(`/work/${id}`);
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Updated Chore');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Changes saved.' })).toBeVisible();
  expect(match).toBe('"v1"');
  let prompted = false;
  page.on('dialog', async (dialog) => { prompted = true; await dialog.dismiss(); });
  await page.getByRole('link', { name: 'Inbox', exact: true }).last().click();
  await expect(page).toHaveURL(/\/inbox$/);
  expect(prompted).toBe(false);
});


test('changing a Sprint parent protects drafts and resets protection after save', async ({ page }) => {
  const secondId = '44444444-4444-4444-8444-444444444444';
  let createdParent: string | undefined;
  await page.route('**/__api/api/v1/work-items?**', async (route) => {
    const kind = new URL(route.request().url()).searchParams.get('kind');
    await route.fulfill({ json: {
      items: kind === 'project' ? [work('First parent'), work('Second parent', 'project', secondId)] : [],
      page: { hasMore: false, nextCursor: null }
    } });
  });
  await page.route('**/__api/api/v1/work-items', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const input = route.request().postDataJSON();
    createdParent = input.parentId;
    await route.fulfill({ status: 201, json: { ...work(input.name, 'sprint'), ...input } });
  });
  await page.goto('/projects?kind=sprint');
  const parent = page.getByRole('combobox', { name: 'Create a Sprint inside a Project' });
  await expect(parent).toBeEnabled();
  await parent.selectOption(id);
  const name = page.getByRole('textbox', { name: 'Sprint name', exact: true });
  await name.fill('Keep this Sprint draft');

  const cancelled = page.waitForEvent('dialog');
  page.once('dialog', (dialog) => dialog.dismiss());
  await parent.selectOption(secondId);
  expect((await cancelled).message()).toContain('unsaved Sprint');
  await expect(parent).toHaveValue(id);
  await expect(name).toHaveValue('Keep this Sprint draft');

  const accepted = page.waitForEvent('dialog');
  page.once('dialog', (dialog) => dialog.accept());
  await parent.selectOption(secondId);
  expect((await accepted).message()).toContain('unsaved Sprint');
  await expect(parent).toHaveValue(secondId);
  await expect(name).toHaveValue('');

  await name.fill('Saved in second parent');
  await page.getByRole('button', { name: 'New Sprint', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sprint created.' })).toBeVisible();
  expect(createdParent).toBe(secondId);
  let promptedAfterSave = false;
  page.on('dialog', async (dialog) => { promptedAfterSave = true; await dialog.dismiss(); });
  await parent.selectOption(id);
  await expect(parent).toHaveValue(id);
  expect(promptedAfterSave).toBe(false);
});
