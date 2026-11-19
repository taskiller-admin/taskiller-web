import type { LayoutServerLoad } from './$types';
import { requireStaff } from '$lib/server/admin/session';
import { env } from '$env/dynamic/private';

export const load: LayoutServerLoad = async event => ({
  staff: await requireStaff(event), writesEnabled: env.TASKILLER_ADMIN_WRITES === 'true'
});
