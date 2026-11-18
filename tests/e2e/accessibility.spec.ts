import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installMockApi } from './mock-api';

const workId = '33333333-3333-4333-8333-333333333333';
const sessionId = '44444444-4444-4444-8444-444444444444';
async function workspace(page: Page) {
  await installMockApi(page);
  const work = { id: workId, kind: 'chore', name: 'Draft the launch announcement', description: 'Write a clear introduction and review it with the team.', status: 'ready', parentId: null, workTypeId: null, effectiveCharacteristics: null, characteristicOverrides: null, estimatedEffortSeconds: 1500, priority: 3, plannedStartAt: null, deadlineAt: null, targetStartDate: null, targetEndDate: null, createdAt: '2026-11-18T08:00:00Z', updatedAt: '2026-11-18T08:00:00Z', completedAt: null, deletedAt: null, position: 1000, version: 1 };
  await page.route('**/__api/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/__api/api/v1', '');
    let body: unknown;
    if (path === '/work-types') body = { items: [] };
    else if (path === '/work-items') body = { items: [work], page: { hasMore: false, nextCursor: null } };
    else if (path === `/work-items/${workId}`) body = work;
    else if (path === '/focus-plans') body = { items: [] };
    else if (path === '/me/preferences') body = { timezone: 'Africa/Nairobi', locale: 'en', weekStartsOn: 1, preferredStrategy: 'auto', preferredWorkBlockMinSeconds: null, preferredWorkBlockMaxSeconds: null, showReviewPrompt: true, version: 1 };
    else if (path === '/auth/sessions') body = { items: [] };
    else if (path === '/execution-sessions') body = { items: [], page: { hasMore: false, nextCursor: null } };
    else if (path === `/execution-sessions/${sessionId}`) body = { id: sessionId, workItemId: workId, state: 'running', currentSegmentIndex: 0, currentSegmentStartedAt: new Date(Date.now() - 60_000).toISOString(), pausedAt: null, endedAt: null, version: 1, planSnapshot: { segments: [{ kind: 'work', label: 'Write the first draft', targetSeconds: 1500, durationMode: 'fixed', optional: false }] } };
    else if (path.endsWith('/events')) body = { items: [], page: { hasMore: false, nextCursor: null } };
    else if (path === '/analytics/summary') body = { activeWorkSeconds: 3600, breakSeconds: 300, pausedSeconds: 60, sessionsCompleted: 2, sessionsAbandoned: 0, choresCompleted: 1, requiredSegmentsCompleted: 2, requiredSegmentsPlanned: 3, planAdherenceRate: 2 / 3, medianUninterruptedWorkSeconds: 1500, medianEstimateErrorSeconds: 300, medianStartDelaySeconds: 60 };
    else if (path === '/analytics/timeseries') body = { timezone: 'Africa/Nairobi', points: [{ bucketStart: '2026-11-18T00:00:00Z', activeWorkSeconds: 3600, breakSeconds: 300, pausedSeconds: 60, sessionsCompleted: 2, choresCompleted: 1 }] };
    else if (path === '/analytics/work-types') body = { items: [] };
    else if (path === '/analytics/focus-patterns') body = { items: [], timezone: 'Africa/Nairobi', timeOfDay: [{ hourStart: 9, activeWorkSeconds: 3600, sessionCount: 2, medianFocusScore: 4 }] };
    else if (path.startsWith('/analytics/work-items/')) body = { workItemId: workId, activeWorkSeconds: 3600, sessionCount: 2, requiredSegmentsCompleted: 2, requiredSegmentsPlanned: 3 };
    else return route.fallback();
    return route.fulfill({ json: body, headers: { ETag: '"a11y:v1"' } });
  });
}

for (const theme of ['light', 'dark']) {
  test(`${theme} main surfaces have readable controls and stay within viewport`, async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    await workspace(page);
    await page.addInitScript(value => localStorage.setItem('taskiller-theme', value), theme);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const paths = ['/', '/login', '/register', '/forgot-password', '/verify-email', '/today', '/inbox', '/projects', '/history', '/analytics', '/settings', `/work/${workId}`, `/work/${workId}/plan`, `/session/${sessionId}`];
    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const result = await new AxeBuilder({ page }).analyze();
      const severe = result.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''));
      expect.soft(severe, `${theme} ${path}`).toEqual([]);
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${path}`).toBe(true);
      if (['/', '/today', '/analytics', '/settings', `/work/${workId}/plan`, `/session/${sessionId}`].includes(path)) {
        const name = path === '/' ? 'landing' : path.startsWith('/work/') ? 'plan' : path.startsWith('/session/') ? 'session' : path.slice(1);
        await page.screenshot({ path: testInfo.outputPath(`${theme}-${name}.png`), fullPage: true });
      }
    }
    expect(errors).toEqual([]);
  });
}
