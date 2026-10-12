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

export async function createImportedWork(
  doc: PortableDocument,
  progress: (value: ImportProgress) => void
): Promise<number> {
  const existingTypes = (await listWorkTypes()).items;
  const typeIds = new Map(existingTypes.map((type) => [type.slug, type.id]));
  const usedSlugs = new Set(doc.items.map((item) => item.workTypeSlug).filter((x): x is string => Boolean(x)));
  for (const slug of usedSlugs) {
    if (typeIds.has(slug)) continue;
    const type = doc.workTypes.find((t) => t.slug === slug);
    if (!type) throw new Error(`Work Type ${slug} is missing from the archive.`);
    const created = await createWorkType({
      slug: type.slug, displayName: type.displayName,
      description: type.description, characteristics: type.characteristics
    });
    typeIds.set(slug, created.id);
  }

  const imported = new Map<string, string>();
  const remaining = new Map<string, PortableItem>(doc.items.map((item) => [item.sourceId, item]));
  let done = 0;
  while (remaining.size > 0) {
    let advanced = false;
    for (const [sourceId, item] of remaining) {
      if (item.parentSourceId && !imported.has(item.parentSourceId)) continue;
      const created = await createWorkItem({
        kind: item.kind,
        name: item.name,
        description: item.description ?? undefined,
        parentId: item.parentSourceId ? imported.get(item.parentSourceId) : undefined,
        workTypeId: item.workTypeSlug ? typeIds.get(item.workTypeSlug) : undefined,
        priority: item.priority ?? undefined,
        estimatedEffortSeconds: item.estimatedEffortSeconds ?? undefined,
        plannedStartAt: item.plannedStartAt ?? undefined,
        deadlineAt: item.deadlineAt ?? undefined,
        targetStartDate: item.targetStartDate ?? undefined,
        targetEndDate: item.targetEndDate ?? undefined,
        characteristicOverrides: item.characteristicOverrides ?? undefined,
        status: 'draft'
      });
      imported.set(sourceId, created.id);
      remaining.delete(sourceId);
      done += 1;
      advanced = true;
      progress({ done, total: doc.items.length, message: `Imported ${item.name}` });
    }
    if (!advanced) throw new Error('Unable to resolve the imported work hierarchy.');
  }
  return done;
}
