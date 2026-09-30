import type { components } from './generated/schema';
import { api } from './client';

export type ExecutionSession = components['schemas']['ExecutionSession'];
export type StartExecutionSessionInput = components['schemas']['StartExecutionSessionRequest'];

export class OpenSessionConflictError extends Error {
  activeSession: ExecutionSession | null;

  constructor(activeSession: ExecutionSession | null) {
    super('Another execution session is already open.');
    this.name = 'OpenSessionConflictError';
    this.activeSession = activeSession;
  }
}

function mutationKey() {
  return crypto.randomUUID();
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

  if (response.status === 409 && error && typeof error === 'object' && 'code' in error) {
    if ((error as { code?: string }).code === 'open_session_exists') {
      const active = await getActiveSession();
      throw new OpenSessionConflictError(active.session);
    }
  }

  if (error || !data) throw error ?? new Error('Start session returned no data.');
  return { session: data, etag: response.headers.get('etag') };
}
