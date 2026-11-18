import { expect, test, type Page } from '@playwright/test';
import { installMockApi } from './mock-api';

const workId = '33333333-3333-4333-8333-333333333333';
const sessionId = '44444444-4444-4444-8444-444444444444';

async function focusFixture(page: Page, terminal = false) {
  await installMockApi(page);
  let work = { id: workId, kind: 'chore', name: 'Write the focus notes', status: 'ready', workTypeId: null, effectiveCharacteristics: null, estimatedEffortSeconds: 1500, version: 1 };
  let session = {
    id: sessionId, workItemId: workId, state: terminal ? 'completed' : 'paused', version: 1,
    currentSegmentIndex: 0, currentSegmentStartedAt: new Date(Date.now() - 60_000).toISOString(),
    pausedAt: new Date().toISOString(), endedAt: terminal ? new Date().toISOString() : null,
    planSnapshot: { segments: [{ kind: 'work', label: 'Write notes', durationMode: 'fixed', targetSeconds: 1500, optional: false, linkedWorkItemId: workId }] }
  };
  await page.route('**/__api/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/__api/api/v1', '');
    const method = route.request().method();
    if (path === `/work-items/${workId}`) {
      if (method === 'PATCH') {
        expect(route.request().headers()['if-match']).toBe('"work:1"');
        work = { ...work, ...route.request().postDataJSON(), version: 2 };
      }
      return route.fulfill({ json: work, headers: { ETag: '"work:1"' } });
    }
    if (path === '/work-types') return route.fulfill({ json: { items: [{ id: 'writing', displayName: 'Writing', system: true }] } });
    if (path.startsWith('/focus-plans')) return route.fulfill({ json: { items: [] } });
    if (path === `/execution-sessions/${sessionId}`) return route.fulfill({ json: session, headers: { ETag: '"session:1"' } });
    if (path === `/execution-sessions/${sessionId}/review`) return route.fulfill({ status: 404, json: {} });
    if (path === `/execution-sessions/${sessionId}/events`) {
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        if (body.type === 'work_item_completed') return route.fulfill({ status: 503, json: { detail: 'Please try again.' } });
        expect(body.type).toBe('resumed');
        session = { ...session, state: 'running', pausedAt: '', currentSegmentStartedAt: new Date(Date.now() - 60_000).toISOString(), version: 2 };
        return route.fulfill({ json: { session, event: { type: 'resumed' } }, headers: { ETag: '"session:2"' } });
      }
      return route.fulfill({ json: { items: [], page: { hasMore: false, nextCursor: null } } });
    }
    return route.fallback();
  });
}

test('paused-on-load clock moves after resume and keeps controls beside the clock', async ({ page }) => {
  await focusFixture(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`/session/${sessionId}`);
  const card = page.getByRole('region', { name: 'Active focus session' });
  await expect(card).toContainText('24:00');
  await card.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(card).not.toContainText('24:00', { timeout: 5000 });
  await expect(card.getByRole('link', { name: 'Open session' })).toHaveCount(0);
  const bounds = await card.getByRole('button', { name: 'Pause', exact: true }).boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(800);
  await page.getByRole('button', { name: 'Mark work complete' }).click();
  await expect(page.getByRole('alert')).toContainText('Please try again');
  await expect(page.getByText('Work item marked complete.', { exact: true })).toHaveCount(0);
});

test('review scales have named groups, verbal endpoints and protect an unsaved note', async ({ page }) => {
  await focusFixture(page, true);
  await page.goto(`/session/${sessionId}`);
  const focus = page.getByRole('group', { name: 'Focus', exact: true });
  await expect(focus).toContainText('1: Distracted');
  await focus.getByRole('button', { name: 'Focus, 5 of 5, Fully focused' }).click();
  await page.getByLabel('Note', { exact: true }).fill('Keep this reflection');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Leave focus' }).click();
  await expect(page).toHaveURL(new RegExp(`/session/${sessionId}$`));
  await expect(page.getByLabel('Note', { exact: true })).toHaveValue('Keep this reflection');
});

test('planning repairs a Work Type inline and protects a replacement draft', async ({ page }) => {
  await focusFixture(page);
  await page.goto(`/work/${workId}/plan`);
  await expect(page.getByRole('button', { name: 'Generate plan', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Work Type', exact: true }).selectOption('writing');
  await page.getByRole('button', { name: 'Save Work Type', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Generate plan', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start from scratch' }).click();
  await page.getByLabel('Plan name', { exact: true }).fill('Keep my plan');
  await expect(page.getByLabel('Plan name', { exact: true })).toHaveValue('Keep my plan');
  const replacement = page.waitForEvent('dialog');
  const replacing = page.getByRole('button', { name: 'Start from scratch' }).click();
  const confirmation = await replacement;
  expect(confirmation.message()).toBe('Replace your unsaved Focus Plan changes?');
  await confirmation.dismiss();
  await replacing;
  await expect(page.getByLabel('Plan name', { exact: true })).toHaveValue('Keep my plan');
});


test('focus refetch preserves a dirty reflection until the saved review is explicitly chosen', async ({ page }) => {
  await page.clock.install();
  await focusFixture(page, true);
  let saved = {
    sessionId, version: 1, focusScore: 2, fatigueScore: null,
    difficultyScore: null, satisfactionScore: null, note: 'Original reflection',
    createdAt: '2026-11-18T10:00:00Z', updatedAt: '2026-11-18T10:00:00Z'
  };
  await page.route(`**/__api/api/v1/execution-sessions/${sessionId}/review`, route => route.fulfill({ json: saved }));
  await page.goto(`/session/${sessionId}`);
  const note = page.getByLabel('Note', { exact: true });
  await expect(note).toHaveValue('Original reflection');
  await note.fill('My unfinished reflection');
  await page.getByRole('button', { name: 'Focus, 5 of 5, Fully focused' }).click();
  saved = { ...saved, version: 2, focusScore: 3, note: 'Reflection from another device' };
  await page.clock.fastForward(16_000);
  const refreshed = page.waitForResponse(response => response.url().endsWith(`/execution-sessions/${sessionId}/review`));
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
  await refreshed;
  await expect(page.getByRole('status').filter({ hasText: 'A newer saved review is available' })).toBeVisible();
  await expect(note).toHaveValue('My unfinished reflection');
  await expect(page.getByRole('button', { name: 'Focus, 5 of 5, Fully focused' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Use saved review', exact: true }).click();
  await expect(note).toHaveValue('Reflection from another device');
  await expect(page.getByRole('button', { name: 'Focus, 3 of 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Unsaved changes', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use saved review', exact: true })).toHaveCount(0);
});

test('saving a reflection accepts normalized returned data without a false remote conflict', async ({ page }) => {
  await focusFixture(page, true);
  let saved: Record<string, unknown> | null = null;
  await page.route(`**/__api/api/v1/execution-sessions/${sessionId}/review`, async route => {
    if (route.request().method() !== 'PUT') return saved
      ? route.fulfill({ json: saved })
      : route.fulfill({ status: 404, json: {} });
    const input = route.request().postDataJSON();
    expect(input.note).toBe('My completed reflection');
    saved = { ...input, sessionId, version: 1, createdAt: '2026-11-18T10:00:00Z', updatedAt: '2026-11-18T10:00:00Z' };
    return route.fulfill({ json: saved });
  });
  await page.goto(`/session/${sessionId}`);
  const note = page.getByLabel('Note', { exact: true });
  await note.fill('  My completed reflection  ');
  await page.getByRole('button', { name: 'Save review', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Review saved.' })).toBeVisible();
  await expect(note).toHaveValue('My completed reflection');
  await expect(page.getByText('Unsaved changes', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use saved review', exact: true })).toHaveCount(0);
  // Leaving a successfully saved reflection must not raise a draft-loss prompt.
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Leave focus' }).click();
  await expect(page).toHaveURL(/\/today$/);
});
