import type { components } from './generated/schema';
import { api } from './client';

export type WorkItem = components['schemas']['WorkItemResponse'];

export async function listChores() {
  const { data, error } = await api.GET('/api/v1/work-items', {
    params: { query: { kind: 'chore', limit: 50, includeDeleted: false } }
  });
  if (error || !data) throw error ?? new Error('Work items returned no data.');
  return data;
}

export async function quickCaptureChore(name: string) {
  const { data, error } = await api.POST('/api/v1/work-items', {
    params: { header: { 'Idempotency-Key': crypto.randomUUID() } },
    body: { kind: 'chore', name, status: 'draft' }
  });
  if (error || !data) throw error ?? new Error('Create work item returned no data.');
  return data;
}
