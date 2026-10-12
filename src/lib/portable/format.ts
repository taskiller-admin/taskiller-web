import JSZip from 'jszip';
import type { WorkItem, WorkType } from '$lib/api/work';

export const FORMAT = 'taskiller.portable.work.v1';
export const MAX_ARCHIVE_BYTES = 12 * 1024 * 1024;
export const MAX_ITEMS = 1500;

type Kind = WorkItem['kind'];
export type PortableWorkType = Pick<WorkType, 'slug' | 'displayName' | 'description' | 'characteristics'>;
export type PortableItem = Pick<WorkItem,
  'kind' | 'name' | 'description' | 'priority' | 'estimatedEffortSeconds' |
  'plannedStartAt' | 'deadlineAt' | 'targetStartDate' | 'targetEndDate' |
  'characteristicOverrides'> & {
    sourceId: string;
    parentSourceId: string | null;
    workTypeSlug: string | null;
    position: number;
  };
export type PortableDocument = {
  format: typeof FORMAT;
  createdAt: string;
  rootSourceId: string | null;
  workTypes: PortableWorkType[];
  items: PortableItem[];
};

export function buildDocument(items: WorkItem[], types: WorkType[], rootSourceId: string | null): PortableDocument {
  if (items.length > MAX_ITEMS) throw new Error(`Export is limited to ${MAX_ITEMS} work items.`);
  const byId = new Map(types.map((type) => [type.id, type.slug]));
  const slugs = new Set(items.map((item) => item.workTypeId ? byId.get(item.workTypeId) : undefined));
  return {
    format: FORMAT,
    createdAt: new Date().toISOString(),
    rootSourceId,
    workTypes: types.filter((type) => slugs.has(type.slug)).map((type) => ({
      slug: type.slug,
      displayName: type.displayName,
      description: type.description,
      characteristics: type.characteristics
    })),
    items: items.map((item) => ({
      sourceId: item.id,
      parentSourceId: item.parentId,
      kind: item.kind,
      name: item.name,
      description: item.description,
      priority: item.priority,
      position: item.position,
      estimatedEffortSeconds: item.estimatedEffortSeconds,
      plannedStartAt: item.plannedStartAt,
      deadlineAt: item.deadlineAt,
      targetStartDate: item.targetStartDate,
      targetEndDate: item.targetEndDate,
      characteristicOverrides: item.characteristicOverrides,
      workTypeSlug: item.workTypeId ? byId.get(item.workTypeId) ?? null : null
    }))
  };
}

function markdownItem(item: PortableItem, depth: number): string {
  const description = item.description?.trim();
  return `${'#'.repeat(Math.min(depth + 1, 6))} ${item.name}\n\n` +
    `- Kind: ${item.kind}\n- Work Type: ${item.workTypeSlug ?? 'None'}\n` +
    `- Priority: ${item.priority ?? 'Unspecified'}\n` +
    (description ? `\n${description}\n` : '') + '\n';
}

export function markdownDocument(doc: PortableDocument): string {
  const children = new Map<string | null, PortableItem[]>();
  for (const item of doc.items) {
    const key = item.parentSourceId && doc.items.some((candidate) => candidate.sourceId === item.parentSourceId)
      ? item.parentSourceId : null;
    children.set(key, [...(children.get(key) ?? []), item]);
  }
  for (const rows of children.values()) rows.sort((a, b) => a.position - b.position);
  const lines = ['<!-- Human-readable companion; data.json is authoritative for imports. -->', ''];
  const visited = new Set<string>();
  function walk(parent: string | null, depth: number) {
    for (const item of children.get(parent) ?? []) {
      if (visited.has(item.sourceId)) continue;
      visited.add(item.sourceId);
      lines.push(markdownItem(item, depth));
      walk(item.sourceId, depth + 1);
    }
  }
  walk(null, 0);
  return lines.join('\n');
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function exportDocument(doc: PortableDocument): Promise<{ blob: Blob; name: string }> {
  const prefix = doc.rootSourceId ? 'taskiller-item' : 'taskiller-workspace';
  if (doc.items.length === 1) {
    return {
      blob: new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }),
      name: `${prefix}.json`
    };
  }
  const zip = new JSZip();
  zip.file('data.json', JSON.stringify(doc, null, 2));
  zip.file('README.md', markdownDocument(doc));
  zip.file('manifest.json', JSON.stringify({ format: FORMAT, canonical: 'data.json', human: 'README.md' }, null, 2));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return { blob, name: `${prefix}.zip` };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const kinds: Kind[] = ['project', 'sprint', 'chore'];
export function validateDocument(raw: unknown): PortableDocument {
  if (!isObject(raw) || raw.format !== FORMAT || !Array.isArray(raw.items) || !Array.isArray(raw.workTypes)) {
    throw new Error('Not a Taskiller portable work v1 export.');
  }
  if (raw.items.length === 0 || raw.items.length > MAX_ITEMS) throw new Error('Invalid work item count.');
  if (raw.workTypes.length > MAX_ITEMS) throw new Error('Invalid Work Type count.');
  const ids = new Set<string>();
  const items: PortableItem[] = raw.items.map((item: unknown) => {
    if (!isObject(item) || typeof item.sourceId !== 'string' || !item.sourceId ||
        typeof item.name !== 'string' || !item.name.trim() || item.name.length > 300 ||
        !kinds.includes(item.kind as Kind) ||
        (item.parentSourceId !== null && typeof item.parentSourceId !== 'string') ||
        (item.workTypeSlug !== null && typeof item.workTypeSlug !== 'string')) {
      throw new Error('Import contains an invalid work item.');
    }
    if (ids.has(item.sourceId)) throw new Error('Duplicate work item IDs in import.');
    ids.add(item.sourceId);
    if (item.description != null && (typeof item.description !== 'string' || item.description.length > 20000)) {
      throw new Error('Invalid work item description.');
    }
    return item as unknown as PortableItem;
  });
  const byId = new Map(items.map((item) => [item.sourceId, item]));
  for (const item of items) {
    if (!item.parentSourceId) continue;
    const parent = byId.get(item.parentSourceId);
    if (!parent) throw new Error('Export has a reference to a parent outside the archive.');
    if ((item.kind === 'sprint' && parent.kind !== 'project') ||
        (item.kind === 'chore' && parent.kind === 'chore') ||
        item.kind === 'project') throw new Error('Invalid Project/Sprint/Chore hierarchy.');
  }
  for (const item of items) {
    let cursor: PortableItem | undefined = item;
    const seen = new Set<string>();
    while (cursor) {
      if (seen.has(cursor.sourceId)) throw new Error('Work hierarchy contains a cycle.');
      seen.add(cursor.sourceId);
      cursor = cursor.parentSourceId ? byId.get(cursor.parentSourceId) : undefined;
    }
  }
  const workTypes: PortableWorkType[] = raw.workTypes.map((type: unknown) => {
    if (!isObject(type) || typeof type.slug !== 'string' ||
        !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(type.slug) ||
        typeof type.displayName !== 'string' || !type.displayName.trim() ||
        type.displayName.length > 120 || !isObject(type.characteristics)) {
      throw new Error('Invalid Work Type in import.');
    }
    return type as unknown as PortableWorkType;
  });
  return {
    format: FORMAT,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    rootSourceId: typeof raw.rootSourceId === 'string' ? raw.rootSourceId : null,
    items,
    workTypes
  };
}

export async function importFile(file: File): Promise<PortableDocument> {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error('Import file exceeds 12 MB.');
  const extension = file.name.toLowerCase();
  let content: string;
  if (extension.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file, { checkCRC32: true });
    const entries = Object.values(zip.files);
    if (entries.length > MAX_ITEMS * 3 + 10) throw new Error('Too many files in ZIP.');
    const canonical = zip.file('data.json');
    if (!canonical) throw new Error('ZIP is missing its canonical data.json file.');
    content = await canonical.async('string');
  } else if (extension.endsWith('.json')) {
    content = await file.text();
  } else {
    throw new Error('Import a Taskiller .json or .zip export. Markdown is for reading.');
  }
  if (content.length > MAX_ARCHIVE_BYTES) throw new Error('Import data exceeds 12 MB.');
  return validateDocument(JSON.parse(content) as unknown);
}
