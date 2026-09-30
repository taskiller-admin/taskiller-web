<script lang="ts">
  import CaretUpIcon from 'phosphor-svelte/lib/CaretUpIcon';
  import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import type { WorkItem } from '$lib/api/work';
  import Button from '$lib/components/ui/Button.svelte';
  import KindMark from './KindMark.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import { formatDuration, formatShortDate, kindLabel } from '$lib/utils';

  let {
    item,
    depth = 0,
    showKind = true,
    canMoveUp = false,
    canMoveDown = false,
    onmoveup,
    onmovedown
  }: {
    item: WorkItem;
    depth?: number;
    showKind?: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    onmoveup?: () => void;
    onmovedown?: () => void;
  } = $props();
</script>

<div
  class="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border)] py-3.5 last:border-b-0"
  style={`padding-left:${Math.min(depth, 4) * 22}px`}
>
  <a href={`/work/${item.id}`} class="flex min-w-0 items-center gap-3 rounded-[12px] py-1.5">
    {#if showKind}<KindMark kind={item.kind} />{/if}
    <div class="min-w-0 flex-1">
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="truncate font-semibold text-tk-ink">{item.name}</span>
        <StatusBadge status={item.status} />
      </div>
      <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tk-graphite">
        {#if showKind}<span>{kindLabel(item.kind)}</span>{/if}
        {#if item.estimatedEffortSeconds !== null}<span class="tk-mono">{formatDuration(item.estimatedEffortSeconds)}</span>{/if}
        {#if item.deadlineAt}<span>Due {formatShortDate(item.deadlineAt)}</span>{/if}
        {#if item.priority}<span>P{item.priority}</span>{/if}
      </div>
    </div>
  </a>

  <div class="flex items-center gap-1">
    {#if onmoveup || onmovedown}
      <Button size="icon" variant="ghost" disabled={!canMoveUp} aria-label={`Move ${item.name} up`} onclick={onmoveup}>
        <CaretUpIcon size={16} weight="bold" />
      </Button>
      <Button size="icon" variant="ghost" disabled={!canMoveDown} aria-label={`Move ${item.name} down`} onclick={onmovedown}>
        <CaretDownIcon size={16} weight="bold" />
      </Button>
    {/if}
    <a class="grid size-9 place-items-center rounded-[11px] text-tk-graphite opacity-70 transition hover:bg-black/[0.05] hover:text-tk-ink group-hover:opacity-100" href={`/work/${item.id}`} aria-label={`Open ${item.name}`}>
      <ArrowUpRightIcon size={17} />
    </a>
  </div>
</div>
