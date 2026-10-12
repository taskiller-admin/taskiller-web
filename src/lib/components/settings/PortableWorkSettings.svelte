<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { listWorkItems } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { createImportedWork, exportScope } from '$lib/portable/operations';
  import { downloadBlob, exportDocument, importFile, type PortableDocument } from '$lib/portable/format';

  const client = useQueryClient();
  const roots = createQuery(() => ({
    queryKey: ['portable-export-roots'],
    queryFn: () => listWorkItems({ limit: 100 })
  }));
  let scope = $state('workspace');
  let selected = $state<PortableDocument | null>(null);
  let busy = $state(false);
  let message = $state('');
  let error = $state('');
  let progress = $state('');
  let confirmed = $state(false);

  async function download() {
    busy = true;
    error = '';
    message = '';
    try {
      const document = await exportScope(scope === 'workspace' ? null : scope);
      if (!document.items.length) throw new Error('There are no work items to export.');
      const file = await exportDocument(document);
      downloadBlob(file.blob, file.name);
      message = `Exported ${document.items.length} work items.`;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Export failed.';
    } finally {
      busy = false;
    }
  }

  async function onFile(event: Event) {
    const field = event.currentTarget as HTMLInputElement;
    const file = field.files?.[0];
    selected = null;
    confirmed = false;
    error = '';
    if (!file) return;
    busy = true;
    try {
      selected = await importFile(file);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'File could not be opened.';
    } finally {
      busy = false;
      field.value = '';
    }
  }

  async function startImport() {
    if (!selected || !confirmed || busy) return;
    busy = true;
    error = '';
    message = '';
    progress = '';
    try {
      const count = await createImportedWork(selected, (value) => {
        progress = `${value.done}/${value.total}: ${value.message}`;
      });
      selected = null;
      confirmed = false;
      message = `Imported ${count} items successfully. All imported items start in Draft.`;
      await client.invalidateQueries({ queryKey: queryKeys.work.all });
    } catch (cause) {
      error = `${cause instanceof Error ? cause.message : 'Import failed.'} Some items may already have been created; inspect your workspace before retrying.`;
      await client.invalidateQueries({ queryKey: queryKeys.work.all });
    } finally {
      busy = false;
    }
  }
</script>

<section id="portable" class="tk-panel rounded-[20px] p-6 sm:p-8">
  <h2 class="tk-display text-2xl font-bold">Export &amp; import work</h2>
  <p class="mt-2 text-sm leading-6 text-tk-graphite">Keep a portable copy of your work. JSON is always authoritative; multi-item archives also contain a readable Markdown summary.</p>

  <div class="mt-6 grid gap-8 md:grid-cols-2">
    <div class="space-y-4">
      <h3 class="font-bold">Export</h3>
      <label class="block text-sm font-semibold" for="portable-scope">Content</label>
      <select id="portable-scope" bind:value={scope} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm">
        <option value="workspace">Entire workspace</option>
        {#each roots.data?.items ?? [] as root}
          {#if root.parentId === null}
            <option value={root.id}>{root.kind}: {root.name}</option>
          {/if}
        {/each}
      </select>
      <button type="button" disabled={busy} onclick={download} class="rounded-xl bg-tk-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Working…' : 'Download export'}</button>
      <p class="text-xs text-tk-graphite">Single work item: JSON. Multiple work items: ZIP containing data.json and README.md.</p>
    </div>

    <div class="space-y-4">
      <h3 class="font-bold">Import</h3>
      <label for="portable-file" class="block text-sm font-semibold">Taskiller JSON or ZIP</label>
      <input id="portable-file" type="file" accept=".json,.zip,application/json,application/zip" disabled={busy} onchange={onFile} class="block w-full text-sm" />
      {#if selected}
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          <p class="font-bold">Import preview</p>
          <p>{selected.items.length} items, {selected.workTypes.length} referenced Work Types</p>
          <p class="mt-1 text-xs text-tk-graphite">{selected.items.filter((item) => item.kind === 'project').length} projects · {selected.items.filter((item) => item.kind === 'sprint').length} sprints · {selected.items.filter((item) => item.kind === 'chore').length} chores</p>
          <label class="mt-4 flex items-start gap-2 text-xs"><input type="checkbox" bind:checked={confirmed} /> Create copies with new IDs. Imported items start in Draft. Existing items will not be updated.</label>
          <button type="button" disabled={busy || !confirmed} onclick={startImport} class="mt-4 rounded-xl bg-tk-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Import work</button>
        </div>
      {/if}
      {#if progress}<p class="text-xs text-tk-graphite" aria-live="polite">{progress}</p>{/if}
      <p class="text-xs text-tk-graphite">Imports are currently created sequentially, not atomically. Avoid rerunning a partially completed import without reviewing the created items.</p>
    </div>
  </div>
  {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
  {#if message}<p class="mt-4 text-sm" role="status">{message}</p>{/if}
</section>
