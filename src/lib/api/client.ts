import { env } from '$env/dynamic/public';
import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';
import { getAccessToken, setAccessToken } from './access-token';

type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: unknown;
};

export const apiBase = env.PUBLIC_TASKILLER_API_URL?.replace(/\/$/, '') ?? '';
if (!apiBase) {
  console.warn('PUBLIC_TASKILLER_API_URL is not configured. API calls will fail until it is set.');
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${apiBase}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        setAccessToken(null);
        return false;
      }
      const body = (await response.json()) as AuthResponse;
      setAccessToken(body.accessToken);
      return true;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function taskillerFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const initial = new Request(input, init);
  const first = new Request(initial);
  const token = getAccessToken();
  if (token) first.headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(first);
  const isRefresh = new URL(first.url).pathname === '/api/v1/auth/refresh';
  if (response.status !== 401 || isRefresh) return response;

  const refreshed = await refreshAccessToken();
  if (!refreshed) return response;

  const retry = new Request(initial);
  const nextToken = getAccessToken();
  if (nextToken) retry.headers.set('Authorization', `Bearer ${nextToken}`);
  return fetch(retry);
}


export async function taskillerJson<T>(path: string, init?: RequestInit): Promise<{ data: T; response: Response }> {
  const response = await taskillerFetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    let problem: unknown = null;
    try {
      problem = await response.json();
    } catch {
      // Preserve a useful HTTP error even if the response body is not JSON.
    }
    throw problem ?? new Error(`Taskiller API request failed with HTTP ${response.status}.`);
  }

  return { data: (await response.json()) as T, response };
}

export const api = createClient<paths>({
  baseUrl: apiBase,
  credentials: 'include',
  fetch: taskillerFetch
});

export { refreshAccessToken };
