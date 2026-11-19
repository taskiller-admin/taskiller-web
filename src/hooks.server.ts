import type { Handle } from '@sveltejs/kit';
import { adminHeaders } from '$lib/server/admin/relay';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  if (!event.route.id?.startsWith('/(admin)/') && !/^\/admin(?:\/|$)/.test(event.url.pathname)) return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(adminHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
