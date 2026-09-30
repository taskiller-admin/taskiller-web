import type { Page, Route } from '@playwright/test';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'release@example.com',
  displayName: 'Release Tester',
  emailVerified: true,
  createdAt: '2026-09-30T10:00:00Z',
  updatedAt: '2026-09-30T10:00:00Z',
  version: 1
};

function workItem(name: string, position: number) {
  return {
    id: crypto.randomUUID(),
    kind: 'chore',
    parentId: null,
    workTypeId: null,
    name,
    description: null,
    status: 'draft',
    position,
    priority: null,
    estimatedEffortSeconds: null,
    plannedStartAt: null,
    deadlineAt: null,
    targetStartDate: null,
    targetEndDate: null,
    characteristicOverrides: null,
    effectiveCharacteristics: null,
    completedAt: null,
    createdAt: '2026-09-30T10:00:00Z',
    updatedAt: '2026-09-30T10:00:00Z',
    deletedAt: null,
    version: 1
  };
}

async function json(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(body)
  });
}

export async function installMockApi(page: Page) {
  let chores = [workItem('Ship the release checklist', 1000)];

  await page.route('**/__api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__api/, '');
    const method = request.method();

    if (method === 'POST' && path === '/api/v1/auth/login') {
      return json(route, { accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, user });
    }
    if (method === 'POST' && path === '/api/v1/auth/refresh') {
      return json(route, { accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, user });
    }
    if (method === 'GET' && path === '/api/v1/me') {
      return json(route, user, 200, { ETag: '"user:11111111-1111-4111-8111-111111111111:v1"' });
    }
    if (method === 'GET' && path === '/api/v1/work-items') {
      return json(route, { items: chores, page: { hasMore: false, nextCursor: null } });
    }
    if (method === 'POST' && path === '/api/v1/work-items') {
      const body = request.postDataJSON() as { name: string };
      const created = workItem(body.name, (chores.length + 1) * 1000);
      chores = [...chores, created];
      return json(route, created, 201);
    }
    if (method === 'GET' && path === '/api/v1/execution-sessions/active') {
      return json(route, { session: null });
    }
    if (method === 'POST' && path === '/api/v1/auth/logout') {
      return route.fulfill({ status: 204 });
    }

    return json(
      route,
      {
        type: '/problems/not_mocked',
        title: 'Not mocked',
        status: 404,
        code: 'not_mocked',
        instance: path
      },
      404
    );
  });
}
