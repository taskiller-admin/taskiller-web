import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export const adminHeaders = {
  'cache-control': 'private, no-store',
  'x-robots-tag': 'noindex, nofollow',
  'referrer-policy': 'no-referrer'
};

const id = '[a-zA-Z0-9_-]{1,80}';
const reads = new RegExp(`^(auth/csrf|me|overview|users|users/${id}(/(activity|sessions|work))?|work/${id}|jobs|privacy/requests(/${id})?|audit|staff|roles)$`);
const posts = new RegExp(`^(auth/(login|mfa|logout|step-up|enroll|enroll/confirm)|users/search|users/${id}/(suspend|reactivate|recovery-email|revoke-sessions|privacy/(export|deletion))|jobs/${id}/retry|staff/invitations|staff/${id}/revoke-access|work/${id}/correct|bulk/(preview|execute))$`);
const patches = new RegExp(`^staff/${id}/roles$`);
const auth = /^auth\//;
const limit = 64 * 1024;

export function problem(status: number, code: string, title: string) {
  return Response.json({ status, code, title }, {
    status, headers: { ...adminHeaders, 'content-type': 'application/problem+json' }
  });
}

export function enabled() { return env.TASKILLER_ADMIN_ENABLED === 'true'; }

function cookieNames() {
  return [
    env.TASKILLER_ADMIN_SESSION_COOKIE ?? 'taskiller_staff',
    env.TASKILLER_ADMIN_CSRF_COOKIE ?? 'taskiller_staff_csrf',
    env.TASKILLER_ADMIN_CHALLENGE_COOKIE ?? 'taskiller_staff_challenge'
  ].filter(name => /^[\w-]+$/.test(name));
}

export function hasStaffCookie(event: RequestEvent) {
  return Boolean(event.cookies.get(cookieNames()[0] ?? 'taskiller_staff'));
}

export async function upstream(event: RequestEvent, path: string, method = 'GET', body?: Uint8Array<ArrayBuffer>) {
  const base = new URL(env.TASKILLER_ADMIN_API_ORIGIN ?? '');
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Invalid admin origin');
  if (base.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('Admin upstream requires HTTPS');
  const url = new URL('/api/v1/admin/' + path, base);
  if (event.route.id?.includes('/api/[...path]')) url.search = event.url.search;
  const headers = new Headers({ accept: 'application/json, application/problem+json' });
  const cookies = cookieNames().flatMap(name => {
    const value = event.cookies.get(name);
    return value === undefined ? [] : [`${name}=${encodeURIComponent(value)}`];
  });
  if (cookies.length) headers.set('cookie', cookies.join('; '));
  if (method !== 'GET') {
    for (const name of ['origin', 'x-csrftoken', 'if-match', 'idempotency-key']) {
      const value = event.request.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('content-type', 'application/json');
  }
  return globalThis.fetch(url, { method, body, headers, redirect: 'manual', signal: AbortSignal.timeout(10_000), cache: 'no-store' });
}

export async function relay(event: RequestEvent, path: string) {
  const method = event.request.method;
  const allowed = method === 'GET' ? reads : method === 'POST' ? posts : method === 'PATCH' ? patches : undefined;
  if (!allowed?.test(path)) return problem(404, 'admin_route_not_found', 'Admin endpoint not found');
  if (method !== 'GET' && event.request.headers.get('origin') !== (env.TASKILLER_ADMIN_PUBLIC_ORIGIN ?? event.url.origin)) {
    return problem(403, 'admin_origin_forbidden', 'Request origin is not allowed');
  }
  if (!enabled()) return problem(503, 'admin_disabled', 'Admin access is unavailable');
  if (env.TASKILLER_ADMIN_WRITES !== 'true' && method !== 'GET' && !auth.test(path) && path !== 'users/search') {
    return problem(403, 'admin_writes_disabled', 'Administrative changes are disabled');
  }
  let body: Uint8Array<ArrayBuffer> | undefined;
  if (method !== 'GET') {
    if (event.request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return problem(415, 'invalid_content_type', 'Expected JSON');
    const reader = event.request.body?.getReader();
    if (!reader) return problem(400, 'invalid_body', 'Missing request body');
    const buffer = new Uint8Array(limit);
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (size + value.length > limit) {
          void reader.cancel().catch(() => {});
          return problem(413, 'body_too_large', 'Request is too large');
        }
        buffer.set(value, size);
        size += value.length;
      }
      body = buffer.slice(0, size);
    } catch { return problem(400, 'invalid_body', 'Could not read request'); }
    finally { reader.releaseLock(); }
  }
  try {
    const response = await upstream(event, path, method, body);
    if (response.status >= 300 && response.status < 400) return problem(502, 'admin_upstream_redirect', 'Admin service returned an unexpected redirect');
    const type = response.headers.get('content-type')?.split(';')[0].trim();
    if (response.body && type !== 'application/json' && type !== 'application/problem+json') {
      return problem(502, 'admin_upstream_response', 'Admin service returned an unexpected response');
    }
    const headers = new Headers(adminHeaders);
    for (const name of ['content-type', 'etag', 'retry-after', 'x-request-id']) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie()) {
      const [pair, ...attributes] = cookie.split(';');
      const index = pair.indexOf('=');
      if (index < 1 || !cookieNames().includes(pair.slice(0, index))) continue;
      const expiry = attributes.map(value => value.trim()).filter(value => /^(expires|max-age)=/i.test(value));
      headers.append('set-cookie', [pair, 'Path=/admin', 'HttpOnly', 'SameSite=Lax',
        ...(event.url.protocol === 'https:' ? ['Secure'] : []), ...expiry].join('; '));
    }
    return new Response(response.body, { status: response.status, headers });
  } catch { return problem(502, 'admin_upstream_unavailable', 'Could not reach the admin service'); }
}
