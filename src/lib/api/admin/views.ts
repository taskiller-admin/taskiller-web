import { capabilities as c, type Row } from './contract';

export interface Command {
  label: string;
  description: string;
  path: string;
  body?: Record<string, unknown>;
  method?: 'PATCH';
  etag?: string;
  danger?: boolean;
  disabled?: boolean;
  queued?: boolean;
  initialReason?: string;
}

export type Field = [key: string, label: string];
export const userFields: Field[] = [['displayName', 'Name'], ['email', 'Email'], ['lifecycle', 'Account status'], ['emailVerified', 'Email verified'], ['createdAt', 'Registered']];
export const sessionFields: Field[] = [['deviceName', 'Device'], ['lastUsedAt', 'Last used'], ['expiresAt', 'Expires'], ['revokedAt', 'Revoked']];
export const activityFields: Field[] = [['timestamp', 'Time'], ['source', 'Source'], ['type', 'Event']];
export const jobFields: Field[] = [['type', 'Job type'], ['state', 'Status'], ['attempts', 'Attempts'], ['updatedAt', 'Updated'], ['maxAttempts', 'Attempt limit']];
export const privacyFields: Field[] = [['type', 'Request type'], ['state', 'Status'], ['userId', 'Account'], ['createdAt', 'Requested'], ['completedAt', 'Completed']];
export const auditFields: Field[] = [['timestamp', 'Time'], ['actorId', 'Actor'], ['action', 'Action'], ['targetType', 'Target type'], ['targetId', 'Target'], ['outcome', 'Outcome'], ['reasonCode', 'Reason'], ['requestId', 'Request ID'], ['changes', 'Changes']];
export const staffFields: Field[] = [['displayName', 'Name'], ['roles', 'Roles'], ['capabilities', 'Capabilities'], ['mfaEnrolled', 'MFA enrolled'], ['enabled', 'Enabled']];
export const workFields: Field[] = [['name', 'Name'], ['kind', 'Kind'], ['state', 'Status'], ['updatedAt', 'Updated']];

const safeId = /^[a-zA-Z0-9_-]{1,80}$/;
export function rowId(value: unknown): value is string { return typeof value === 'string' && safeId.test(value); }
export function formatField(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.every(value => typeof value === 'string') ? value.join(', ') || '—' : '—';
  if (key === 'changes' && typeof value === 'object') return JSON.stringify(value, null, 2);
  if (typeof value === 'number') return new Intl.NumberFormat().format(value);
  if (typeof value !== 'string') return '—';
  if ((key.endsWith('At') || key === 'timestamp') && Number.isFinite(Date.parse(value))) return new Date(value).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  return value;
}

export function rowActions(section: string, row: Row, allowed: string[], writes: boolean, id: string, etag?: string): Command[] {
  if (!writes || !rowId(row.id)) return [];
  const actions: Command[] = [];
  const add = (capability: string, command: Command) => { if (allowed.includes(capability)) actions.push(command); };
  const offered = (action: string) => Array.isArray(row.eligibleActions) && row.eligibleActions.includes(action);
  const version = etag ?? (typeof row.etag === 'string' ? row.etag : undefined);
  const target = typeof row.displayName === 'string' && row.displayName ? row.displayName : typeof row.email === 'string' ? row.email : row.id;
  if (section === 'account') {
    const path = 'users/' + row.id;
    if (row.lifecycle === 'active') add(c.suspend, { label: 'Suspend account', path: path + '/suspend', description: 'Suspend ' + target + ' and revoke all active sessions.', etag: version, disabled: !version, danger: true });
    if (row.lifecycle === 'suspended') add(c.reactivate, { label: 'Reactivate account', path: path + '/reactivate', description: 'Restore access for ' + target + '. Revoked sessions stay revoked.', etag: version, disabled: !version });
    if (row.lifecycle === 'active') add(c.recovery, { label: 'Request recovery email', path: path + '/recovery-email', description: 'Queue a recovery email for ' + target + '.', queued: true });
    for (const [kind, label] of [['export', 'Request data export'], ['deletion', 'Schedule account deletion']] as const) {
      add(c.privacy, { label, path: path + '/privacy/' + kind, description: label + ' for ' + target + '.', etag: version, disabled: !version, danger: kind === 'deletion', queued: true });
    }
    add(c.revoke, { label: 'Revoke all sessions', path: path + '/revoke-sessions', description: 'Sign ' + target + ' out on all devices.', danger: true });
  }
  if (section === 'sessions' && !row.revokedAt && rowId(id)) add(c.revoke, { label: 'Revoke session', path: 'users/' + id + '/revoke-sessions', body: { sessionId: row.id }, description: 'Sign out device session ' + row.id + '.', danger: true });
  if (section === 'jobs' && (offered('retry') || offered('jobs.retry'))) add(c.retry, { label: 'Retry job', path: 'jobs/' + row.id + '/retry', description: 'Queue another attempt for job ' + row.id + '.', queued: true });
  if (section === 'staff' && row.enabled === true) add(c.staff, { label: 'Revoke staff access', path: 'staff/' + row.id + '/revoke-access', description: 'Remove console access and end staff sessions for ' + target + '.', danger: true, etag: version, disabled: !version });
  return actions;
}
