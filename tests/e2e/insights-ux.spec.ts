import { expect, test } from '@playwright/test';
import { installMockApi } from './mock-api';

test.beforeEach(async ({ page }) => { page.on('pageerror', (error) => console.error('Insights page error:', error.message)); await installMockApi(page); });

test('History filters survive reload and Back with named state control', async ({ page }) => {
  await page.route('**/api/v1/execution-sessions?**', (route) => route.fulfill({ json: { items: [], page: { hasMore: false, nextCursor: null } } }));
  await page.goto('/history?range=7&state=completed');
  await expect(page.getByRole('button', { name: '7 days', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Session state')).toHaveValue('completed');
  await page.getByRole('button', { name: '90 days', exact: true }).click();
  await expect(page).toHaveURL(/range=90/);
  await page.reload();
  await expect(page.getByRole('button', { name: '90 days', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page.getByRole('button', { name: '7 days', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

async function analytics(page: import('@playwright/test').Page, populated = false) {
  await page.route('**/api/v1/execution-sessions?**', (route) => route.fulfill({ json: { items: [], page: { hasMore: false, nextCursor: null } } }));
  await page.route('**/api/v1/analytics/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const base = { from: '2026-11-01', to: '2026-11-18', timezone: 'UTC' };
    const json = path.endsWith('/summary') ? { ...base, activeWorkSeconds: populated ? 61 : 0, breakSeconds: 0, pausedSeconds: 0, sessionsCompleted: populated ? 1 : 0, sessionsAbandoned: 0, choresCompleted: 0, requiredSegmentsCompleted: 0, requiredSegmentsPlanned: 0 }
      : path.endsWith('/timeseries') ? { ...base, points: populated ? [{ bucketStart: '2026-11-18T00:00:00Z', activeWorkSeconds: 61, breakSeconds: 13, pausedSeconds: 0, sessionsCompleted: 1, choresCompleted: 0 }, { bucketStart: '2026-11-17T00:00:00Z', activeWorkSeconds: 0, breakSeconds: 0, pausedSeconds: 0, sessionsCompleted: 0, choresCompleted: 0 }] : [] }
      : path.endsWith('/focus-patterns') ? { ...base, items: [], timeOfDay: populated ? [{ hourStart: 9, activeWorkSeconds: 61, sessionCount: 1, medianFocusScore: 3.5 }] : [] }
      : { items: [] };
    return route.fulfill({ json });
  });
}

test('empty Analytics offers one useful next step', async ({ page }) => {
  await analytics(page);
  await page.goto('/analytics?range=7');
  await expect(page.getByRole('link', { name: 'Choose work' })).toBeVisible();
  await expect(page.getByText('Session completion', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '90d', exact: true }).click();
  await expect(page).toHaveURL(/range=90/);
  await page.goBack();
  await expect(page.getByRole('button', { name: '7d', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('charts expose exact values through keyboard and touch accessible tables', async ({ page }) => {
  await analytics(page, true);
  await page.goto('/analytics');
  await page.getByText('View activity data', { exact: true }).click();
  const activity = page.getByRole('table', { name: 'Activity by period' });
  await expect(activity).toBeVisible();
  await expect(activity.getByRole('cell', { name: '61', exact: true })).toBeVisible();
  await page.getByText('View hourly data', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('table', { name: 'Time of day' }).getByRole('cell', { name: '3.5', exact: true })).toBeVisible();
  const heights = await page.locator('[aria-hidden="true"] [data-series="active-work"]').evaluateAll((bars) => bars.map((bar) => (bar as HTMLElement).style.height));
  expect(heights).toContain('0px');
});

test('failed Analytics sections stay errors while successful data remains visible', async ({ page }) => {
  await analytics(page, true);
  await page.route('**/api/v1/analytics/work-types?**', (route) => route.fulfill({ status: 503, json: { title: 'Unavailable' } }));
  await page.goto('/analytics');
  await expect(page.getByRole('button', { name: 'Retry Work Types' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('View activity data', { exact: true })).toBeVisible();
  await expect(page.getByText('No work-type execution data in this period.')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Choose work' })).toHaveCount(0);
});

test('obsolete History failures cannot overwrite the latest filter', async ({ page }) => {
  let releaseOld: (() => void) | undefined;
  const oldResponse = new Promise<void>((resolve) => { releaseOld = resolve; });
  let requests = 0;
  await page.route('**/api/v1/execution-sessions?**', async (route) => {
    requests++;
    if (requests === 1) {
      await oldResponse;
      await route.fulfill({ status: 503, json: { title: 'Old range failed' } });
    } else {
      await route.fulfill({ json: { items: [], page: { hasMore: false, nextCursor: null } } });
    }
  });
  await page.goto('/history?range=7');
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: '90 days', exact: true }).click();
  await expect(page.getByText('No sessions in this slice.')).toBeVisible();
  const completed = page.waitForResponse((response) => response.status() === 503);
  releaseOld!();
  await completed;
  await expect(page.getByRole('button', { name: '90 days', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

const historyRecord = { id: 'history-record', workItemId: 'history-work', state: 'completed', sessionStartedAt: '2026-11-18T09:00:00Z', endedAt: '2026-11-18T09:25:00Z', planSnapshot: { segments: [] } };

test('failed filter changes never display sessions from the previous filter', async ({ page }) => {
  await page.route('**/api/v1/execution-sessions?**', route => {
    const range = new URL(route.request().url()).searchParams;
    const days = (Date.parse(range.get('to')!) - Date.parse(range.get('from')!)) / 86400000;
    return days > 30 ? route.fulfill({ status: 503, json: { detail: 'This range could not be loaded.' } }) : route.fulfill({ json: { items: [historyRecord], page: { hasMore: false, nextCursor: null } } });
  });
  await page.goto('/history?range=7');
  await expect(page.getByRole('link', { name: 'Open session', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '90 days', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('This range could not be loaded.');
  await expect(page.getByRole('link', { name: 'Open session', exact: true })).toHaveCount(0);
});

test('History pagination keeps its original date bounds', async ({ page }) => {
  await page.clock.install();
  const bounds: string[] = [];
  await page.route('**/api/v1/execution-sessions?**', route => {
    const query = new URL(route.request().url()).searchParams;
    bounds.push(JSON.stringify([query.get('from'), query.get('to')]));
    const second = query.get('cursor') === 'older';
    return route.fulfill({ json: { items: second ? [] : [historyRecord], page: { hasMore: !second, nextCursor: second ? null : 'older' } } });
  });
  await page.goto('/history');
  const older = page.getByRole('button', { name: 'Load older sessions', exact: true });
  await expect(older).toBeVisible();
  await page.clock.fastForward(5000);
  await older.click();
  await expect(older).toHaveCount(0);
  expect(bounds).toHaveLength(2);
  expect(bounds[1]).toBe(bounds[0]);
});

test('Analytics status waits for recent sessions and reports failures truthfully', async ({ page }) => {
  await analytics(page, true);
  let release!: () => void;
  const gate = new Promise<void>(resolve => release = resolve);
  await page.route('**/api/v1/execution-sessions?**', async route => { await gate; await route.fulfill({ status: 503, json: { title: 'Unavailable' } }); });
  await page.goto('/analytics');
  await expect(page.getByText('View activity data', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Loading analytics' })).toBeVisible();
  release();
  await expect(page.getByRole('status').filter({ hasText: 'Some analytics could not be loaded.' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('status').filter({ hasText: 'Analytics updated.' })).toHaveCount(0);
});
