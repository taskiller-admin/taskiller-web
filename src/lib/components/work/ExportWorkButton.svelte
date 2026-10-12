<script lang="ts">
  import { exportScope } from '$lib/portable/operations';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import { downloadBlob, exportDocument } from '$lib/portable/format';

  let { workId, label = 'Export', compact = false }: { workId: string | null; label?: string; compact?: boolean } = $props();
  let exporting = $state(false);
  let error = $state('');

  async function save() {
    if (exporting) return;
    exporting = true;
    error = '';
    try {
      const doc = await exportScope(workId);
      if (!doc.items.length) throw new Error('No work items available for export.');
      const result = await exportDocument(doc);
      downloadBlob(result.blob, result.name);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Export failed';
    } finally {
      exporting = false;
    }
  }
</script>

<div class="inline-flex flex-col items-start gap-1">
  <button type="button" onclick={save} disabled={exporting}
    class={compact
      ? 'grid size-8 shrink-0 place-items-center rounded-[9px] border border-[var(--border)] bg-[var(--surface)] text-tk-graphite transition-colors hover:border-[var(--border-strong)] hover:text-tk-ink disabled:opacity-50'
      : 'inline-flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite hover:text-tk-ink disabled:opacity-50'}
    aria-label={label} title={label}>
    <DownloadSimpleIcon size={16} weight={exporting ? 'fill' : 'regular'} />
    {#if !compact}<span>{exporting ? 'Exporting…' : label}</span>{/if}
  </button>
  {#if error}<span role="alert" class="text-xs text-red-700">{error}</span>{/if}
</div>
