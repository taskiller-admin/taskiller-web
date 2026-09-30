import { apiBase, taskillerFetch } from './client';
import type { User } from './auth';

export type PreferredStrategy = 'auto' | 'continuous' | 'structured' | 'flexible';

export type UserPreferences = {
  timezone: string;
  locale: string;
  weekStartsOn: number;
  preferredStrategy: PreferredStrategy;
  preferredWorkBlockMinSeconds: number | null;
  preferredWorkBlockMaxSeconds: number | null;
  showReviewPrompt: boolean;
  version: number;
};

export type AuthSessionInfo = {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  current: boolean;
};

export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type DataExport = {
  requestId: string;
  status: ExportStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  archiveSizeBytes: number | null;
  archiveSha256: string | null;
  downloadUrl: string | null;
  failureCode: string | null;
};

export type AccountDeletion = {
  requestId: string;
  status: string;
  requestedAt: string;
  executeAfter: string;
};

export type UpdateProfileInput = { displayName?: string | null };
export type UpdatePreferencesInput = Partial<{
  timezone: string | null;
  locale: string | null;
  weekStartsOn: number | null;
  preferredStrategy: PreferredStrategy | null;
  preferredWorkBlockMinSeconds: number | null;
  preferredWorkBlockMaxSeconds: number | null;
  showReviewPrompt: boolean | null;
}>;

export class AccountConflictError extends Error {
  constructor(message = 'These settings changed on another client.') {
    super(message);
    this.name = 'AccountConflictError';
  }
}

function mutationKey() {
  return crypto.randomUUID();
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let problem: unknown = null;
    try {
      problem = await response.json();
    } catch {
      // Keep a useful HTTP error if the response has no JSON body.
    }
    throw problem ?? new Error(`Taskiller API request failed with HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

async function noContent(path: string, init: RequestInit) {
  const response = await taskillerFetch(`${apiBase}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers }
  });
  if (!response.ok) {
    let problem: unknown = null;
    try {
      problem = await response.json();
    } catch {
      // No JSON body is acceptable for error fallback.
    }
    throw problem ?? new Error(`Taskiller API request failed with HTTP ${response.status}.`);
  }
}

export async function getProfile() {
  const response = await taskillerFetch(`${apiBase}/api/v1/me`, {
    headers: { Accept: 'application/json' }
  });
  return { user: await parseJson<User>(response), etag: response.headers.get('etag') };
}

export async function updateProfile(input: UpdateProfileInput, etag: string | null) {
  const response = await taskillerFetch(`${apiBase}/api/v1/me`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(etag ? { 'If-Match': etag } : {})
    },
    body: JSON.stringify(input)
  });
  if (response.status === 412) throw new AccountConflictError('Your profile changed elsewhere.');
  return { user: await parseJson<User>(response), etag: response.headers.get('etag') };
}

export async function getPreferences() {
  const response = await taskillerFetch(`${apiBase}/api/v1/me/preferences`, {
    headers: { Accept: 'application/json' }
  });
  return {
    preferences: await parseJson<UserPreferences>(response),
    etag: response.headers.get('etag')
  };
}

export async function updatePreferences(input: UpdatePreferencesInput, etag: string | null) {
  const response = await taskillerFetch(`${apiBase}/api/v1/me/preferences`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(etag ? { 'If-Match': etag } : {})
    },
    body: JSON.stringify(input)
  });
  if (response.status === 412) {
    throw new AccountConflictError('Your preferences changed elsewhere.');
  }
  return {
    preferences: await parseJson<UserPreferences>(response),
    etag: response.headers.get('etag')
  };
}

export async function listAuthSessions() {
  const response = await taskillerFetch(`${apiBase}/api/v1/auth/sessions`, {
    headers: { Accept: 'application/json' }
  });
  return (await parseJson<{ items: AuthSessionInfo[] }>(response)).items;
}

export async function revokeAuthSession(id: string) {
  await noContent(`/api/v1/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function logoutAllSessions() {
  await noContent('/api/v1/auth/logout-all', { method: 'POST' });
}

export async function requestEmailVerification() {
  await noContent('/api/v1/auth/email-verification/request', { method: 'POST' });
}

export async function confirmEmailVerification(token: string) {
  await noContent('/api/v1/auth/email-verification/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
}

export async function requestPasswordReset(email: string) {
  await noContent('/api/v1/auth/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  await noContent('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
}

export async function requestDataExport() {
  const response = await taskillerFetch(`${apiBase}/api/v1/me/export-requests`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Idempotency-Key': mutationKey()
    }
  });
  return parseJson<DataExport>(response);
}

export async function getDataExport(id: string) {
  const response = await taskillerFetch(
    `${apiBase}/api/v1/me/export-requests/${encodeURIComponent(id)}`,
    { headers: { Accept: 'application/json' } }
  );
  return parseJson<DataExport>(response);
}

export function exportDownloadUrl(relativeUrl: string) {
  return `${apiBase}${relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`}`;
}

export async function requestAccountDeletion(etag: string | null) {
  const response = await taskillerFetch(`${apiBase}/api/v1/me`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(etag ? { 'If-Match': etag } : {})
    }
  });
  if (response.status === 412) {
    throw new AccountConflictError('Your account changed elsewhere. Refresh before deleting it.');
  }
  return parseJson<AccountDeletion>(response);
}
