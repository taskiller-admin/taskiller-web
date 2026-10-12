<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { beforeNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { pendingPortableImport } from '$lib/portable/pending-import';
  import { listWorkItems } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { newImportSession, resumeImportedWork, exportScope, type ImportSession } from '$lib/portable/operations';
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
  let progressDone = $state(0);
  let session = $state<ImportSession | null>(null);
  let modal = $state(false);
  let confirmed = $state(false);

  $effect(() => {
    const pending = $pendingPortableImport;
    if (!pending) return;
    selected = pending.document;
    session = null;
    progressDone = 0;
    modal = Boolean(pending.document);
    error = pending.error;
    message = '';
    confirmed = false;
    pendingPortableImport.set(null);
  });

  beforeNavigate((navigation) => {
    if (busy && modal) navigation.cancel();
  });
  onMount(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (!busy || !modal) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  });

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
    session = null;
    progressDone = 0;
    confirmed = false;
    error = '';
    if (!file) return;
    busy = true;
    try {
      selected = await importFile(file);
      modal = true;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'File could not be opened.';
    } finally {
      busy = false;
      field.value = '';
    }
  }

  async function startImport(stripOptional = false) {
    if (!selected || busy || (!confirmed && !session)) return;
    if (!session) session = newImportSession(selected);
    if (stripOptional && session.failed) session.dropOptional.add(session.failed.sourceId);
    busy = true;
    modal = true;
    error = '';
    message = '';
    try {
      const count = await resumeImportedWork(session, (value) => {
        progressDone = value.done;
        progress = `${value.done}/${value.total}: ${value.message}`;
      });
      selected = null;
      session = null;
      confirmed = false;
      message = `Imported ${count} items successfully.`;
      modal = false;
      await client.invalidateQueries({ queryKey: queryKeys.work.all });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
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
      <p class="text-xs text-tk-graphite">Choose a JSON/ZIP file to review it before importing.</p>
      <p class="text-xs text-tk-graphite">Imports are currently created sequentially, not atomically. Avoid rerunning a partially completed import without reviewing the created items.</p>
    </div>
  </div>

  {#if message}<p class="mt-4 text-sm" role="status">{message}</p>{/if}
</section>

{#if modal && selected}
  <div class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/75 p-4" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="import-dialog-title" class="w-full max-w-xl rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-tk-graphite">Taskiller portable work</p>
          <h2 id="import-dialog-title" class="tk-display mt-2 text-2xl font-bold">{busy ? 'Importing your work' : error ? 'Import paused' : 'Review your import'}</h2>
          <p class="mt-2 text-sm text-tk-graphite">{selected.items.length} items · {selected.workTypes.length} Work Types</p>
        </div>
        {#if !busy}<button type="button" aria-label="Close import preview" class="rounded-lg px-3 py-2 text-sm text-tk-graphite hover:text-tk-ink" onclick={() => { modal = false; }}>Close</button>{/if}
      </div>
      <div class="mt-6 flex justify-between text-sm"><span>{busy ? progress || 'Connecting to Django…' : error ? 'Resolve the failure below, then resume.' : 'Ready to create copies in Draft status'}</span><span class="font-bold">{progressDone}/{selected.items.length}</span></div>
      <div class="mt-2 h-3 overflow-hidden rounded-full bg-[var(--surface-strong)]" role="progressbar" aria-label="Import progress" aria-valuemin="0" aria-valuemax={selected.items.length} aria-valuenow={progressDone}>
        <div class="h-full rounded-full bg-tk-strike transition-[width] duration-300" style={`width:${Math.round(100 * progressDone / selected.items.length)}%`}></div>
      </div>
      {#if error}
        <div class="mt-5 rounded-xl border border-red-400/35 bg-red-500/10 p-4 text-sm" role="alert">
          <p class="font-bold text-red-500">This item was not created</p>
          <p class="mt-2 break-words text-red-400">{error}</p>
          <p class="mt-2 text-xs text-tk-graphite">{progressDone} previous items were created. Resume will not create them again. Retrying with minimal fields removes optional metadata from the failed item only.</p>
        </div>
      {:else if !busy && !session}
        <label class="mt-5 flex items-start gap-3 text-sm"><input class="mt-1" type="checkbox" bind:checked={confirmed} />Create new items with new IDs. Existing work will not be overwritten.</label>
      {/if}
      <div class="mt-6 flex flex-wrap gap-2">
        {#if error}
          <button type="button" class="rounded-xl bg-tk-strike px-4 py-3 text-sm font-bold text-[#24110b]" onclick={() => startImport(false)}>Retry failed item</button>
          {#if session?.failed}<button type="button" class="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold" onclick={() => startImport(true)}>Retry without optional fields</button>{/if}
        {:else if !busy}
          <button type="button" disabled={!confirmed} class="rounded-xl bg-tk-strike px-5 py-3 text-sm font-bold text-[#24110b] disabled:opacity-50" onclick={() => startImport(false)}>Import {selected.items.length} items</button>
        {:else}
          <p class="text-xs text-tk-graphite" role="status">Import in progress. Navigation is disabled until this batch finishes or pauses.</p>
        {/if}
      </div>
    </section>
  </div>
{/if}
