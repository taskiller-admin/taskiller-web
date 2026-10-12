import { getWorkItemTree, listWorkItems, listWorkTypes, type WorkItem, type WorkTree } from '$lib/api/work';
import { taskillerJson } from '$lib/api/client';
import { buildDocument, type PortableDocument } from './format';

function flatten(node: WorkTree): WorkItem[] {
  return [node, ...node.children.flatMap(flatten)];
}

export async function exportScope(rootId: string | null): Promise<PortableDocument> {
  const types = (await listWorkTypes()).items;
  let items: WorkItem[] = [];
  if (rootId) {
    items = flatten(await getWorkItemTree(rootId));
  } else {
    let cursor: string | null = null;
    do {
      const response = await listWorkItems({ limit: 100, cursor });
      items.push(...response.items);
      if (!response.page.hasMore) break;
      cursor = response.page.nextCursor;
      if (!cursor) throw new Error('Work API returned no cursor for remaining work.');
    } while (true);
  }
  const ids = new Set(items.map((item) => item.id));
  const doc = buildDocument(items, types, rootId);
  for (const item of doc.items) {
    if (item.parentSourceId && !ids.has(item.parentSourceId)) item.parentSourceId = null;
  }
  return doc;
}

export type AtomicImportResult = {
  created: number;
  idMap: Record<string, string>;
  atomic: true;
};

export function importError(cause: unknown): string {
  if (cause && typeof cause === 'object') {
    const problem = cause as { title?: string; detail?: string; code?: string; meta?: { name?: string } };
    if (problem.title || problem.detail) {
      return [problem.meta?.name, problem.detail || problem.title, problem.code ? `(${problem.code})` : '']
        .filter(Boolean).join(' — ');
    }
  }
  return cause instanceof Error ? cause.message : String(cause);
}

export async function importAtomically(doc: PortableDocument, key: string): Promise<AtomicImportResult> {
  const { data } = await taskillerJson<AtomicImportResult>('/api/v1/portable-work/import', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(doc)
  });
  return data;
}

export function stripItemOptional(doc: PortableDocument, sourceId: string): PortableDocument {
  return {
    ...doc,
    items: doc.items.map((item) => item.sourceId === sourceId ? {
      ...item,
      description: null,
      priority: null,
      estimatedEffortSeconds: null,
      plannedStartAt: null,
      deadlineAt: null,
      targetStartDate: null,
      targetEndDate: null,
      characteristicOverrides: null
    } : item)
  };
}
