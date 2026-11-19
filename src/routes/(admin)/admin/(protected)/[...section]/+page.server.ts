import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireStaff } from '$lib/server/admin/session';
import { navItems, capabilities } from '$lib/api/admin/contract';

export const load: PageServerLoad = async event => {
  const staff = await requireStaff(event);
  const path = event.params.section;
  const account = /^users\/([a-zA-Z0-9_-]{1,80})$/.exec(path);
  const work = /^work\/([a-zA-Z0-9_-]{1,80})$/.exec(path);
  if (account || work) {
    if (!staff.capabilities.includes(work ? capabilities.privateWork : capabilities.users)) error(403, 'You do not have access to this record');
    const id = (work ?? account)?.[1];
    if (!id) error(404, 'Record not found');
    return { section: work ? 'work' : 'account', id, kind: work ? event.url.searchParams.get('kind') ?? 'chore' : undefined };
  }
  const section = navItems.find(item => item.path === path);
  if (!section) error(404, 'Admin page not found');
  if (path && !staff.capabilities.includes(section.capability)) error(403, 'You do not have access to this section');
  return { section: path || 'overview', id: '' };
};
