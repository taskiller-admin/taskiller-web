<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { beforeNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { pendingPortableImport } from '$lib/portable/pending-import';
  import { listAllWorkItems } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { exportScope, importAtomically, importError, stripItemOptional } from '$lib/portable/operations';
  import { downloadBlob, exportDocument, importFile, markdownDocument, FORMAT, type PortableDocument } from '$lib/portable/format';
  import { modalFocus } from '$lib/actions/modal';

  const client = useQueryClient();
  let scope = $state('workspace');
  let selected = $state<PortableDocument | null>(null);
  let busy = $state(false);
  let exporting = $state(false);
  let exportOpen = $state(false);
  const roots = createQuery(() => ({ queryKey: ['portable-export-roots'], queryFn: () => listAllWorkItems(), enabled: exportOpen }));
  let exportFormat = $state<'auto' | 'json' | 'zip'>('auto');
  let includeSummary = $state(true);
  let fileInput: HTMLInputElement;
  let message = $state('');
  let error = $state('');
  let modal = $state(false);
  let confirmed = $state(false);
  let stage = $state<'preview' | 'sending' | 'done'>('preview');
  let failedSourceId = $state<string | null>(null);
  let attemptKey = $state('');

  $effect(() => {
    const pending = $pendingPortableImport;
    if (!pending) return;
    selected = pending.document;
    error = pending.error;
    modal = Boolean(pending.document);
    confirmed = false;
    failedSourceId = null;
    attemptKey = '';
    stage = 'preview';
    pendingPortableImport.set(null);
  });

  beforeNavigate((navigation) => { if (busy) navigation.cancel(); });
  onMount(() => {
    const openImport = () => { if (!busy) fileInput?.click(); };
    const openExport = () => { if (!busy) { error = ''; exportOpen = true; } };
    const importSuppliedFile = (event: Event) => { if (!busy) void previewFile((event as CustomEvent<File>).detail); };
    window.addEventListener('taskiller:portable-import', openImport);
    window.addEventListener('taskiller:portable-export', openExport);
    window.addEventListener('taskiller:portable-import-file', importSuppliedFile);
    const protect = (event: BeforeUnloadEvent) => {
      if (!busy) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => {
      window.removeEventListener('beforeunload', protect);
      window.removeEventListener('taskiller:portable-import', openImport);
      window.removeEventListener('taskiller:portable-export', openExport);
      window.removeEventListener('taskiller:portable-import-file', importSuppliedFile);
    };
  });

  async function download() {
    exporting = true;
    error = '';
    try {
      const document = await exportScope(scope === 'workspace' ? null : scope);
      if (!document.items.length) throw new Error('There are no work items to export.');
      let file: { blob: Blob; name: string };
      if (exportFormat === 'json') {
        file = { blob: new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' }), name: 'taskiller-work.json' };
      } else if (exportFormat === 'zip') {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        zip.file('data.json', JSON.stringify(document, null, 2));
        if (includeSummary) zip.file('README.md', markdownDocument(document));
        zip.file('manifest.json', JSON.stringify({ format: FORMAT, canonical: 'data.json', human: includeSummary ? 'README.md' : null }, null, 2));
        file = { blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }), name: 'taskiller-work.zip' };
      } else {
        file = await exportDocument(document);
      }
      downloadBlob(file.blob, file.name);
      message = `Exported ${document.items.length} work items.`;
      exportOpen = false;
    } catch (cause) {
      error = importError(cause);
    } finally {
      exporting = false;
    }
  }

  async function onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await previewFile(file);
  }

  async function previewFile(file: File) {
    error = '';
    try {
      selected = await importFile(file);
      confirmed = false;
      failedSourceId = null;
      attemptKey = '';
      stage = 'preview';
      modal = true;
    } catch (cause) {
      error = importError(cause);
      exportOpen = false;
    }
  }

  async function startImport(removeOptional = false) {
    if (!selected || busy || !confirmed) return;
    if (removeOptional && failedSourceId) {
      selected = stripItemOptional(selected, failedSourceId);
      attemptKey = '';
    }
    if (!attemptKey) attemptKey = crypto.randomUUID();
    busy = true;
    stage = 'sending';
    error = '';
    try {
      const result = await importAtomically(selected, attemptKey);
      message = `Imported ${result.created} work items. Existing work was preserved.`;
      selected = null;
      modal = false;
      confirmed = false;
      attemptKey = '';
      stage = 'done';
      await client.invalidateQueries({ queryKey: queryKeys.work.all });
      await client.invalidateQueries({ queryKey: ['portable-export-roots'] });
    } catch (cause) {
      error = importError(cause);
      const object = cause && typeof cause === 'object' ? cause as { meta?: { sourceId?: string } } : null;
      failedSourceId = object?.meta?.sourceId ?? null;
      stage = 'preview';
    } finally {
      busy = false;
    }
  }
</script>

<input bind:this={fileInput} type="file" accept=".json,.zip,application/json,application/zip" disabled={busy} onchange={onFile} class="sr-only" aria-label="Choose Taskiller import file" />

{#if exportOpen}
  <div class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/75 p-4" role="presentation">
    <div use:modalFocus={{ onclose: () => (exportOpen = false), canClose: () => !exporting }} role="dialog" aria-modal="true" aria-labelledby="export-dialog-title" class="w-full max-w-xl rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Taskiller portable work</p>
          <h2 id="export-dialog-title" class="tk-display mt-2 text-2xl font-bold">Export your work</h2>
          <p class="mt-2 text-sm text-[var(--muted)]">Choose exactly what to back up or share. Your existing work is never changed.</p>
        </div>
        <button type="button" disabled={exporting} class="rounded-lg px-3 py-2 text-sm text-[var(--muted)] disabled:opacity-50" onclick={() => (exportOpen = false)}>Close</button>
      </div>
      <div class="mt-6 space-y-5">
        <div>
          <label class="block text-sm font-bold" for="portable-scope">Work to include</label>
          <p class="mb-2 text-xs text-[var(--muted)]">An individual project or sprint includes its descendants. Full workspace includes all work.</p>
          <select id="portable-scope" bind:value={scope} disabled={exporting} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm">
            <option value="workspace">Entire workspace</option>
            {#each roots.data?.items ?? [] as root}
              {#if root.parentId === null}<option value={root.id}>{root.kind}: {root.name}</option>{/if}
            {/each}
          </select>
          {#if roots.isPending}<p class="mt-1 text-xs text-[var(--muted)]">Loading available work…</p>{/if}
          {#if roots.isError}<p role="alert" class="mt-1 text-xs text-red-500">Could not load work scopes. Please retry.</p><button type="button" class="min-h-11 text-sm underline" onclick={() => roots.refetch()}>Retry work scopes</button>{/if}
        </div>
        <fieldset class="space-y-2">
          <legend class="text-sm font-bold">File format</legend>
          <label class="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-sm"><input type="radio" bind:group={exportFormat} value="auto" disabled={exporting} class="mt-1" /><span><strong>Recommended · Automatic</strong><span class="mt-1 block text-xs text-[var(--muted)]">JSON for one item, ZIP for multiple items. Portable and reimportable.</span></span></label>
          <label class="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-sm"><input type="radio" bind:group={exportFormat} value="json" disabled={exporting} class="mt-1" /><span><strong>JSON</strong><span class="mt-1 block text-xs text-[var(--muted)]">Structured, editable data for integrations and backups.</span></span></label>
          <label class="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-sm"><input type="radio" bind:group={exportFormat} value="zip" disabled={exporting} class="mt-1" /><span><strong>ZIP archive</strong><span class="mt-1 block text-xs text-[var(--muted)]">Canonical data.json, manifest and optional readable Markdown.</span></span></label>
        </fieldset>
        {#if exportFormat === 'zip'}<label class="flex items-start gap-3 text-sm"><input type="checkbox" bind:checked={includeSummary} disabled={exporting} class="mt-1" />Include human-readable README.md summary</label>{/if}
        <div class="rounded-xl bg-[var(--surface-strong)] p-4 text-xs leading-6 text-[var(--muted)]">
          <strong class="text-[var(--foreground)]">Included:</strong> work hierarchy, task descriptions, priorities, estimates, schedules and referenced Work Types.<br />
          <strong class="text-[var(--foreground)]">Not included:</strong> account credentials, active sessions or analytics history.<br />
          Imports create draft copies with new IDs; they do not overwrite current work. The archive is subject to the portable format's item limits.
        </div>
      </div>
      {#if error}<p class="mt-4 text-sm text-red-500" role="alert">{error}</p>{/if}
      {#if message}<p class="mt-4 text-sm text-[var(--muted)]" role="status">{message}</p>{/if}
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" disabled={exporting} class="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold" onclick={() => (exportOpen = false)}>Cancel</button>
        <button type="button" disabled={exporting || busy} onclick={download} class="rounded-xl bg-tk-strike px-5 py-3 text-sm font-bold text-[#24110b] disabled:opacity-50">{exporting ? 'Preparing download…' : 'Download export'}</button>
      </div>
    </div>
  </div>
{/if}

{#if message && !exportOpen && !modal}<p class="fixed bottom-24 right-4 z-[110] max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" role="status">{message}</p>{/if}

{#if error && !exportOpen && !modal}
  <div class="fixed bottom-24 right-4 z-[110] max-w-sm rounded-xl border border-red-500/30 bg-[var(--surface)] p-4 shadow-2xl" role="alert">
    <p class="text-sm font-bold text-red-500">Import could not be opened</p>
    <p class="mt-1 text-xs text-[var(--muted)]">{error}</p>
    <button type="button" class="mt-2 text-xs font-bold underline" onclick={() => fileInput?.click()}>Choose another file</button>
    <button type="button" class="ml-4 text-xs underline" onclick={() => (error = '')}>Dismiss</button>
  </div>
{/if}

{#if modal && selected}
  <div class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/75 p-4" role="presentation">
    <div use:modalFocus={{ onclose: () => (modal = false), canClose: () => !busy }} role="dialog" aria-modal="true" aria-labelledby="import-dialog-title" class="w-full max-w-xl rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Taskiller portable work</p>
          <h2 id="import-dialog-title" class="tk-display mt-2 text-2xl font-bold">{busy ? 'Importing your work' : error ? 'Resolve import issue' : 'Review your import'}</h2>
          <p class="mt-2 text-sm text-[var(--muted)]">{selected.items.length} work items · {selected.workTypes.length} Work Types</p>
        </div>
        {#if !busy}<button type="button" aria-label="Close import preview" class="rounded-lg px-3 py-2 text-sm text-[var(--muted)]" onclick={() => (modal = false)}>Close</button>{/if}
      </div>
      <div class="mt-6 flex justify-between text-sm"><span>{busy ? 'Saving your work…' : 'Ready to import'}</span><span>{busy ? 'Working' : 'Preview'}</span></div>
      <div class="mt-2 h-3 overflow-hidden rounded-full bg-[var(--surface-strong)]" role="progressbar" aria-label="Import progress" aria-valuemin="0" aria-valuemax="100" aria-valuetext={busy ? 'Saving all items' : 'Awaiting confirmation'}>
        <div class="h-full rounded-full bg-tk-strike transition-[width] duration-300" style="width:100%"></div>
      </div>
      <p class="mt-2 text-xs text-[var(--muted)]">{busy ? 'Saving all items together. Please wait for confirmation.' : 'All entries will be created in Draft status with new IDs.'}</p>
      {#if error}
        <div class="mt-5 rounded-xl border border-red-400/35 bg-red-500/10 p-4 text-sm" role="alert">
          <p class="font-bold text-red-500">Import could not be confirmed</p>
          <p class="mt-2 break-words text-red-400">{error}</p>
          <p class="mt-2 text-xs text-[var(--muted)]">Retry to confirm the result. Retrying this file will not create duplicate copies.</p>
        </div>
      {/if}
      <label class="mt-5 flex items-start gap-3 text-sm"><input class="mt-1" type="checkbox" bind:checked={confirmed} disabled={busy}/>Create copies with new IDs. Existing items remain unchanged.</label>
      <div class="mt-6 flex flex-wrap gap-2">
        <button type="button" disabled={busy || !confirmed} class="rounded-xl bg-tk-strike px-5 py-3 text-sm font-bold text-[#24110b] disabled:opacity-50" onclick={() => startImport(false)}>{error ? 'Retry import' : `Import ${selected.items.length} items`}</button>
        {#if error && failedSourceId}<button type="button" disabled={busy || !confirmed} class="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold" onclick={() => startImport(true)}>Retry without optional fields on failed item</button>{/if}
      </div>
      {#if busy}<p class="mt-4 text-xs text-[var(--muted)]" role="status">Keep this tab open while your work is being imported.</p>{/if}
    </div>
  </div>
{/if}
