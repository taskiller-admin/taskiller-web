import type { RequestHandler } from './$types';
import { relay } from '$lib/server/admin/relay';

const handle: RequestHandler = event => relay(event, event.params.path);
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
