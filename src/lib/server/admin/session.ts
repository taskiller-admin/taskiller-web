import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { enabled, hasStaffCookie, upstream } from './relay';
import { validStaff } from '$lib/api/admin/contract';

export function staffFor(event: RequestEvent) {
  return event.locals.adminStaff ??= loadStaff(event);
}

async function loadStaff(event: RequestEvent) {
  if (!enabled() || !hasStaffCookie(event)) return null;
  const response = await upstream(event, 'me').catch(() => error(503, 'Admin service unavailable'));
  if ([401, 403].includes(response.status)) return null;
  if (!response.ok) error(503, 'Admin service unavailable');
  const staff: unknown = await response.json().catch(() => null);
  if (!validStaff(staff)) error(502, 'Invalid staff session response');
  const { staffId, displayName, capabilities, expiresAt } = staff;
  return { staffId, displayName, capabilities, expiresAt };
}

export async function requireStaff(event: RequestEvent) {
  const staff = await staffFor(event);
  if (!staff) redirect(303, '/admin/login?returnTo=' + encodeURIComponent(event.url.pathname));
  return staff;
}
