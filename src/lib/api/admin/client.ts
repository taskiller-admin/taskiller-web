export class AdminProblem extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function adminRequest<T>(path: string, options: {
  method?: 'POST' | 'PATCH'; body?: unknown; etag?: string; key?: string; signal?: AbortSignal
} = {}) {
  const { method, body, etag, key, signal } = options;
  const headers = new Headers({ accept: 'application/json' });
  if (method) {
    const { data } = await adminRequest<{ csrfToken: string }>('auth/csrf', { signal });
    if (typeof data?.csrfToken !== 'string' || !data.csrfToken) throw new AdminProblem(502, 'invalid_csrf', 'Could not prepare a secure request.');
    headers.set('x-csrftoken', data.csrfToken);
    headers.set('content-type', 'application/json');
    if (etag) headers.set('if-match', etag);
    if (key) headers.set('idempotency-key', key);
  }
  const response = await fetch('/admin/api/' + path, {
    method: method ?? 'GET', headers, body: method ? JSON.stringify(body ?? {}) : undefined,
    signal, cache: 'no-store', redirect: 'error', credentials: 'same-origin'
  });
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = new AdminProblem(response.status, data?.code ?? 'admin_request_failed',
      data?.detail ?? data?.title ?? 'The admin request could not be completed.');
    if ((response.status === 401 && !path.startsWith('auth/')) ||
      (response.status === 403 && !path.startsWith('auth/') && !['admin_step_up_required', 'step_up_required'].includes(error.code))) {
      window.dispatchEvent(new CustomEvent('taskiller:admin-access', { detail: response.status }));
    }
    throw error;
  }
  if (data === undefined && response.status !== 204) throw new AdminProblem(502, 'invalid_response', 'The admin service returned an invalid response.');
  return { data: data as T, etag: response.headers.get('etag') ?? undefined };
}

export function adminMessage(cause: unknown) {
  return cause instanceof AdminProblem ? cause.message : 'Could not reach the admin service. Try again.';
}
