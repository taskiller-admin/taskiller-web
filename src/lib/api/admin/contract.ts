import type { components } from './schema';

export type Staff = Pick<components['schemas']['AdminStaffMeResponse'], 'staffId' | 'displayName' | 'capabilities' | 'expiresAt' | 'idleExpiresAt'>;
export type AdminSchema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type Row = Record<string, unknown> & { id: string };
export interface Page { items: Row[]; nextCursor: string | null }
export type Overview = Partial<AdminSchema<'AdminOverview'>>;

export const capabilities = {
  overview: 'view_overview', users: 'view_users', sessions: 'view_users',
  activity: 'view_activity', jobs: 'view_jobs', privacy: 'manage_privacy',
  audit: 'view_audit', staff: 'manage_staff', privateWork: 'read_private',
  suspend: 'manage_accounts', reactivate: 'manage_accounts', recovery: 'recovery_email',
  revoke: 'manage_accounts', retry: 'retry_jobs',
  retryPrivacy: 'manage_privacy', correctWork: 'read_private'
} as const;

export const navItems = [
  { path: '', label: 'Overview', capability: capabilities.overview },
  { path: 'users', label: 'Users', capability: capabilities.users },
  { path: 'operations', label: 'Operations', capability: capabilities.jobs },
  { path: 'privacy', label: 'Privacy requests', capability: capabilities.privacy },
  { path: 'audit', label: 'Audit log', capability: capabilities.audit },
  { path: 'staff', label: 'Staff & roles', capability: capabilities.staff }
];

export function validStaff(value: unknown): value is Staff {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Staff>;
  return typeof row.staffId === 'string' && typeof row.displayName === 'string' &&
    typeof row.expiresAt === 'string' && Number.isFinite(Date.parse(row.expiresAt)) &&
    typeof row.idleExpiresAt === 'string' && Number.isFinite(Date.parse(row.idleExpiresAt)) &&
    Array.isArray(row.capabilities) && row.capabilities.every(value => typeof value === 'string');
}
