import type { PageServerLoad } from './$types';
import { enabled } from '$lib/server/admin/relay';

export const load: PageServerLoad = () => ({ enabled: enabled() });
