<script lang="ts">
  import AdminCommand from './AdminCommand.svelte';
  import type { Row } from '$lib/api/admin/contract';
  import { formatField, rowId, type Command, type Field } from '$lib/api/admin/views';
  let { rows, fields, label, link, actions, selected, toggle, onDone, refresh }: {
    rows: Row[]; fields: Field[]; label: string;
    link?: (row: Row) => string; actions?: (row: Row) => Command[];
    selected?: string[]; toggle?: (id: string) => void;
    onDone: (message: string) => void; refresh: () => void;
  } = $props();
</script>
{#if rows.length}
  <div class="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
    <table class="w-full text-left text-sm" aria-label={label}>
      <thead class="bg-[var(--surface-subtle)] text-xs">
        <tr>
          {#if toggle}<th class="p-3" scope="col">Select</th>{/if}
          {#each fields as [, heading]}<th scope="col" class="p-3">{heading}</th>{/each}
          {#if link || actions}<th scope="col" class="p-3">Actions</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as row}
          <tr class="border-t border-[var(--border)] align-top">
            {#if toggle}<td class="p-3"><input type="checkbox" aria-label={'Select ' + (row.email ?? row.id)} checked={selected?.includes(row.id)} disabled={!rowId(row.id) || (!selected?.includes(row.id) && (selected?.length ?? 0) >= 25)} onchange={() => toggle?.(row.id)} /></td>{/if}
            {#each fields as [key]}<td class="max-w-xs whitespace-pre-wrap break-words p-3">{formatField(key, row[key])}</td>{/each}
            {#if link || actions}
              <td class="p-3"><div class="flex min-w-24 flex-wrap items-center gap-2">
                {#if link && rowId(row.id)}<a class="font-bold text-[var(--accent-ink)] underline underline-offset-4" href={link(row)}>View details</a>{/if}
                {#each actions?.(row) ?? [] as command}<AdminCommand {command} {onDone} onConflict={refresh} />{/each}
              </div></td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="tk-panel p-6 text-sm text-[var(--muted)]">No records match this view.</p>
{/if}
