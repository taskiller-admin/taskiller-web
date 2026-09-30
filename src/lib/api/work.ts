import type { components } from './generated/schema';
import { api } from './client';

export type WorkItem = components['schemas']['WorkItemResponse'];
export type WorkTree = components['schemas']['WorkItemTreeNode'];
export type WorkItemKind = components['schemas']['WorkItemKind'];
export type WorkItemStatus = components['schemas']['WorkItemStatus'];
export type CreateWorkItemInput = components['schemas']['CreateWorkItemRequest'];
export type UpdateWorkItemInput = components['schemas']['UpdateWorkItemRequest'];
export type ReorderWorkItemInput = components['schemas']['ReorderWorkItemRequest'];

export class WorkConflictError extends Error {
  constructor(message = 'This work item changed on another client.') {
    super(message);
    this.name = 'WorkConflictError';
  }
}

function mutationKey() {
  return crypto.randomUUID();
}

export async function listWorkItems(filters: {
  kind?: WorkItemKind;
  status?: WorkItemStatus;
  parentId?: string | null;
  limit?: number;
  includeDeleted?: boolean;
} = {}) {
  const query = {
    limit: filters.limit ?? 100,
    includeDeleted: filters.includeDeleted ?? false,
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.parentId ? { parentId: filters.parentId } : {})
  };
  const { data, error } = await api.GET('/api/v1/work-items', {
    params: { query }
  });
  if (error || !data) throw error ?? new Error('Work items returned no data.');
  return data;
}

export async function listChores() {
  return listWorkItems({ kind: 'chore', limit: 100 });
}

export async function listProjects() {
  return listWorkItems({ kind: 'project', limit: 100 });
}

export async function listInboxChores() {
  const page = await listChores();
  return {
    ...page,
    items: page.items.filter((item) => item.parentId === null && item.deletedAt === null)
  };
}

export async function getWorkItem(id: string) {
  const { data, error, response } = await api.GET('/api/v1/work-items/{workItemId}', {
    params: { path: { workItemId: id } }
  });
  if (error || !data) throw error ?? new Error('Work item returned no data.');
  return { item: data, etag: response.headers.get('etag') };
}

export async function getWorkItemChildren(id: string) {
  const { data, error } = await api.GET('/api/v1/work-items/{workItemId}/children', {
    params: { path: { workItemId: id } }
  });
  if (error || !data) throw error ?? new Error('Work item children returned no data.');
  return data;
}

export async function getWorkItemTree(id: string) {
  const { data, error } = await api.GET('/api/v1/work-items/{workItemId}/tree', {
    params: { path: { workItemId: id } }
  });
  if (error || !data) throw error ?? new Error('Work item tree returned no data.');
  return data;
}

export async function getProjectNextAction(id: string) {
  const { data, error } = await api.GET('/api/v1/projects/{projectId}/next-action', {
    params: { path: { projectId: id } }
  });
  if (error || !data) throw error ?? new Error('Project next action returned no data.');
  return data;
}

export async function createWorkItem(input: CreateWorkItemInput) {
  const { data, error } = await api.POST('/api/v1/work-items', {
    params: { header: { 'Idempotency-Key': mutationKey() } },
    body: input
  });
  if (error || !data) throw error ?? new Error('Create work item returned no data.');
  return data;
}

export async function quickCaptureChore(name: string) {
  return createWorkItem({ kind: 'chore', name, status: 'draft' });
}

export async function updateWorkItem(
  id: string,
  input: UpdateWorkItemInput,
  etag?: string | null
) {
  const { data, error, response } = await api.PATCH('/api/v1/work-items/{workItemId}', {
    params: {
      path: { workItemId: id },
      header: etag ? { 'If-Match': etag } : undefined
    },
    body: input
  });
  if (response.status === 412) throw new WorkConflictError();
  if (error || !data) throw error ?? new Error('Update work item returned no data.');
  return { item: data, etag: response.headers.get('etag') };
}

export async function deleteWorkItem(id: string, etag?: string | null) {
  const { error, response } = await api.DELETE('/api/v1/work-items/{workItemId}', {
    params: {
      path: { workItemId: id },
      header: etag ? { 'If-Match': etag } : undefined
    }
  });
  if (response.status === 412) throw new WorkConflictError();
  if (error) throw error;
}

export async function reorderWorkItem(
  id: string,
  input: ReorderWorkItemInput,
  etag?: string | null
) {
  const { data, error, response } = await api.POST('/api/v1/work-items/{workItemId}/reorder', {
    params: {
      path: { workItemId: id },
      header: {
        'Idempotency-Key': mutationKey(),
        ...(etag ? { 'If-Match': etag } : {})
      }
    },
    body: input
  });
  if (response.status === 412) throw new WorkConflictError();
  if (error || !data) throw error ?? new Error('Reorder work item returned no data.');
  return data;
}

export type FlatTreeRow = { item: WorkTree; depth: number };

export function flattenWorkTree(root: WorkTree): FlatTreeRow[] {
  const rows: FlatTreeRow[] = [];
  function visit(item: WorkTree, depth: number) {
    rows.push({ item, depth });
    for (const child of item.children) visit(child, depth + 1);
  }
  visit(root, 0);
  return rows;
}
