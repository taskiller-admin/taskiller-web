import { writable } from 'svelte/store';
import type { PortableDocument } from './format';

export type PendingPortableImport = { document: PortableDocument | null; error: string };
export const pendingPortableImport = writable<PendingPortableImport | null>(null);
