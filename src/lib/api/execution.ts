import type { components } from './generated/schema';
import { api, taskillerJson } from './client';

export type ExecutionSession = components['schemas']['ExecutionSession'];
export type StartExecutionSessionInput = components['schemas']['StartExecutionSessionRequest'];
export type SessionEvent = components['schemas']['SessionEvent'];
export type SessionEventType = components['schemas']['SessionEventType'];
export type SessionEventInput = components['schemas']['CreateSessionEventRequest'];
export type SessionReview = components['schemas']['SessionReview'];
export type SessionReviewInput = components['schemas']['UpsertSessionReviewRequest'];

export type ExecutionSessionPage = {
  items: ExecutionSession[];
  page: { hasMore: boolean; nextCursor: string | null };
};

export type ExecutionSessionFilters = {
  limit?: number;
  cursor?: string | null;
  workItemId?: string | null;
  state?: 'running' | 'paused' | 'completed' | 'abandoned' | null;
  from?: string | null;
  to?: string | null;
};

export class OpenSessionConflictError extends Error {
  activeSession: ExecutionSession | null;

  constructor(activeSession: ExecutionSession | null) {
    super('Another execution session is already open.');
    this.name = 'OpenSessionConflictError';
    this.activeSession = activeSession;
  }
}

export class SessionConflictError extends Error {
  latest: { session: ExecutionSession; etag: string | null } | null;

  constructor(latest: { session: ExecutionSession; etag: string | null } | null) {
    super('This session changed elsewhere.');
    this.name = 'SessionConflictError';
    this.latest = latest;
  }
}

function mutationKey() {
  return crypto.randomUUID();
}

function isProblemCode(value: unknown, code: string) {
  return Boolean(value && typeof value === 'object' && 'code' in value && value.code === code);
}

export async function getActiveSession() {
  const { data, error } = await api.GET('/api/v1/execution-sessions/active');
  if (error || !data) throw error ?? new Error('Active session returned no data.');
  return data;
}

export async function getExecutionSession(id: string) {
  const { data, error, response } = await api.GET('/api/v1/execution-sessions/{executionSessionId}', {
    params: { path: { executionSessionId: id } }
  });
  if (error || !data) throw error ?? new Error('Execution session returned no data.');
  return { session: data, etag: response.headers.get('etag') };
}

export async function startExecutionSession(input: StartExecutionSessionInput) {
  const { data, error, response } = await api.POST('/api/v1/execution-sessions', {
    params: { header: { 'Idempotency-Key': mutationKey() } },
    body: input
  });

  if (response.status === 409 && isProblemCode(error, 'open_session_exists')) {
    const active = await getActiveSession();
    throw new OpenSessionConflictError(active.session);
  }

  if (error || !data) throw error ?? new Error('Start session returned no data.');
  return { session: data, etag: response.headers.get('etag') };
}

export async function listSessionEvents(id: string) {
  const items: SessionEvent[] = [];
  let cursor: string | null = null;
  let pages = 0;

  do {
    const { data, error } = await api.GET('/api/v1/execution-sessions/{executionSessionId}/events', {
      params: {
        path: { executionSessionId: id },
        query: { limit: 100, ...(cursor ? { cursor } : {}) }
      }
    });
    if (error || !data) throw error ?? new Error('Session events returned no data.');
    items.push(...data.items);
    cursor = data.page.hasMore ? data.page.nextCursor : null;
    pages += 1;
  } while (cursor && pages < 10);

  return {
    items,
    page: { hasMore: Boolean(cursor), nextCursor: cursor }
  };
}

export async function appendSessionEvent(
  id: string,
  input: SessionEventInput,
  etag: string | null
) {
  const { data, error, response } = await api.POST(
    '/api/v1/execution-sessions/{executionSessionId}/events',
    {
      params: {
        path: { executionSessionId: id },
        header: {
          'Idempotency-Key': mutationKey(),
          ...(etag ? { 'If-Match': etag } : {})
        }
      },
      body: {
        ...input,
        clientOccurredAt: input.clientOccurredAt ?? new Date().toISOString(),
        payload: input.payload ?? {}
      }
    }
  );

  if (response.status === 412) {
    let latest: { session: ExecutionSession; etag: string | null } | null = null;
    try {
      latest = await getExecutionSession(id);
    } catch {
      // Keep the original conflict if the follow-up read also fails.
    }
    throw new SessionConflictError(latest);
  }

  if (error || !data) throw error ?? new Error('Session event returned no data.');
  return { ...data, etag: response.headers.get('etag') };
}

export async function getSessionReview(id: string): Promise<SessionReview | null> {
  const { data, error, response } = await api.GET(
    '/api/v1/execution-sessions/{executionSessionId}/review',
    { params: { path: { executionSessionId: id } } }
  );
  if (response.status === 404) return null;
  if (error || !data) throw error ?? new Error('Session review returned no data.');
  return data;
}

export async function upsertSessionReview(id: string, input: SessionReviewInput) {
  const { data, error } = await api.PUT('/api/v1/execution-sessions/{executionSessionId}/review', {
    params: {
      path: { executionSessionId: id },
      header: { 'Idempotency-Key': mutationKey() }
    },
    body: input
  });
  if (error || !data) throw error ?? new Error('Session review returned no data.');
  return data;
}


export async function listExecutionSessions(filters: ExecutionSessionFilters = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(filters.limit ?? 25));
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.workItemId) params.set('workItemId', filters.workItemId);
  if (filters.state) params.set('state', filters.state);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  return (
    await taskillerJson<ExecutionSessionPage>(`/api/v1/execution-sessions?${params.toString()}`)
  ).data;
}
