import {
  createWorkItem, createWorkType, getWorkItemTree, listWorkItems, listWorkTypes,
  type WorkItem, type WorkTree
} from '$lib/api/work';
import { buildDocument, type PortableDocument, type PortableItem } from './format';

function flatten(node: WorkTree): WorkItem[] {
  return [node, ...node.children.flatMap(flatten)];
}

export async function exportScope(rootId: string | null): Promise<PortableDocument> {
  const types = (await listWorkTypes()).items;
  let items: WorkItem[];
  if (rootId) {
    items = flatten(await getWorkItemTree(rootId));
  } else {
    items = [];
    // Page with cursor so an entire workspace is exported, not just the first 100 records.
    let cursor: string | null = null;
    do {
      const response = await listWorkItems({ limit: 100, cursor });
      items.push(...response.items);
      if (!response.page.hasMore) break;
      cursor = response.page.nextCursor;
      if (!cursor) throw new Error('Work API indicated more data without a cursor.');
    } while (true);
  }
  const ids = new Set(items.map((item) => item.id));
  const doc = buildDocument(items, types, rootId);
  for (const item of doc.items) {
    if (item.parentSourceId && !ids.has(item.parentSourceId)) item.parentSourceId = null;
  }
  return doc;
}

export type ImportProgress = { done: number; total: number; message: string };
export type ImportSession = {
  doc: PortableDocument;
  imported: Map<string, string>;
  typeIds: Map<string, string>;
  done: number;
  failed: PortableItem | null;
  dropOptional: Set<string>;
};

export function newImportSession(doc: PortableDocument): ImportSession {
  return { doc, imported: new Map(), typeIds: new Map(), done: 0, failed: null, dropOptional: new Set() };
}

function errorDetails(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === 'object') {
    const value = cause as Record<string, unknown>;
    const title = typeof value.title === 'string' ? value.title : 'API rejected the item';
    const detail = typeof value.detail === 'string' ? value.detail : '';
    const code = typeof value.code === 'string' ? ` [${value.code}]` : '';
    const meta = value.meta ? ` ${JSON.stringify(value.meta)}` : '';
    return `${title}${code}: ${detail}${meta}`.trim();
  }
  return String(cause);
}

export async function resumeImportedWork(
  session: ImportSession,
  progress: (value: ImportProgress) => void
): Promise<number> {
  const { doc, imported, typeIds } = session;
  const existingTypes = (await listWorkTypes()).items;
  for (const type of existingTypes) typeIds.set(type.slug, type.id);
  const usedSlugs = new Set(doc.items.map((item) => item.workTypeSlug).filter((x): x is string => Boolean(x)));
  for (const slug of usedSlugs) {
    if (typeIds.has(slug)) continue;
    const type = doc.workTypes.find((t) => t.slug === slug);
    if (!type) throw new Error(`Work Type ${slug} is missing from the archive.`);
    try {
      const created = await createWorkType({ slug: type.slug, displayName: type.displayName,
        description: type.description, characteristics: type.characteristics });
      typeIds.set(slug, created.id);
    } catch (cause) { throw new Error(`Could not create Work Type “${slug}”: ${errorDetails(cause)}`); }
  }
  const remaining = new Map(doc.items.filter((item) => !imported.has(item.sourceId)).map((item) => [item.sourceId, item]));
  session.failed = null;
  while (remaining.size > 0) {
    let advanced = false;
    for (const [sourceId, item] of remaining) {
      if (item.parentSourceId && !imported.has(item.parentSourceId)) continue;
      session.failed = item;
      const safe = session.dropOptional.has(sourceId);
      try {
        const created = await createWorkItem({
          kind: item.kind, name: item.name,
          description: safe ? undefined : item.description ?? undefined,
          parentId: item.parentSourceId ? imported.get(item.parentSourceId) : undefined,
          workTypeId: item.workTypeSlug ? typeIds.get(item.workTypeSlug) : undefined,
          priority: safe ? undefined : item.priority ?? undefined,
          estimatedEffortSeconds: safe ? undefined : item.estimatedEffortSeconds ?? undefined,
          plannedStartAt: safe ? undefined : item.plannedStartAt ?? undefined,
          deadlineAt: safe ? undefined : item.deadlineAt ?? undefined,
          targetStartDate: safe ? undefined : item.targetStartDate ?? undefined,
          targetEndDate: safe ? undefined : item.targetEndDate ?? undefined,
          characteristicOverrides: safe ? undefined : item.characteristicOverrides ?? undefined,
          status: 'draft'
        });
        imported.set(sourceId, created.id);
        remaining.delete(sourceId);
        session.done += 1;
        session.failed = null;
        advanced = true;
        progress({ done: session.done, total: doc.items.length, message: `Imported ${item.name}` });
      } catch (cause) {
        throw new Error(`Item ${session.done + 1}/${doc.items.length} “${item.name}” failed: ${errorDetails(cause)}`);
      }
    }
    if (!advanced) throw new Error('Unable to resolve the imported work hierarchy.');
  }
  return session.done;
}

export async function createImportedWork(doc: PortableDocument, progress: (value: ImportProgress) => void): Promise<number> {
  return resumeImportedWork(newImportSession(doc), progress);
}
