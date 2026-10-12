<script lang="ts">
  import { exportScope } from '$lib/portable/operations';
  import { downloadBlob, exportDocument } from '$lib/portable/format';

  let { workId, label = 'Export' }: { workId: string | null; label?: string } = $props();
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
    class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite hover:text-tk-ink disabled:opacity-50"
    aria-label={label}>
    {exporting ? 'Exporting…' : label}
  </button>
  {#if error}<span role="alert" class="text-xs text-red-700">{error}</span>{/if}
</div>
