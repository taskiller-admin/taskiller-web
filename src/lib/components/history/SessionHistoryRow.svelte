<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import { getWorkItem } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import type { ExecutionSession } from '$lib/api/execution';
  import { formatDuration, formatShortDate } from '$lib/utils';

  let { session }: { session: ExecutionSession } = $props();
  const work = createQuery(() => ({
    queryKey: queryKeys.work.detail(session.workItemId),
    queryFn: () => getWorkItem(session.workItemId),
    staleTime: 60_000
  }));

  const elapsedSeconds = $derived(
    Math.max(0, Math.round(((session.endedAt ? Date.parse(session.endedAt) : Date.now()) - Date.parse(session.sessionStartedAt)) / 1000))
  );
  const stateTone = $derived(
    session.state === 'completed' ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]' : session.state === 'abandoned' ? 'bg-[var(--warning-bg)] text-amber-800' : 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
  );
</script>

<div class="history-entry tk-content-auto grid gap-4 border-b border-[var(--border)] py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
  <div class="min-w-0">
    <div class="flex flex-wrap items-center gap-2">
      <span class={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${stateTone}`}>{session.state}</span>
      <span class="text-xs text-tk-graphite">{formatShortDate(session.sessionStartedAt)}</span>
    </div>
    <a href={`/work/${session.workItemId}`} class="mt-2 block break-words text-[15px] font-bold hover:text-tk-blue">
      {work.data?.item.name || (work.isError ? 'Work item unavailable' : 'Loading work item…')}
    </a>
    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tk-graphite">
      <span>{session.planSnapshot.segments.length} planned segments</span>
      <span>{formatDuration(elapsedSeconds)} elapsed window</span>
      {#if session.planSnapshot.strategy}<span>{session.planSnapshot.strategy}</span>{/if}
    </div>
  </div>
  <a href={`/session/${session.id}`} class="inline-flex min-h-11 items-center justify-center gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold hover:bg-[var(--surface-subtle)]">Open session <ArrowRightIcon size={15} aria-hidden="true" /></a>
</div>

<style>
  .history-entry { position: relative; margin-left: 8px; padding-left: 26px; border-left: 2px solid var(--border); transition: background-color 220ms; }
  .history-entry::before { content: ''; position: absolute; top: 24px; left: -6px; width: 10px; height: 10px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 5px var(--surface); transition: background-color 220ms, box-shadow 220ms; }
  .history-entry:hover { background: color-mix(in srgb, var(--blue) 3%, transparent); }
  .history-entry:hover::before { background: var(--accent); box-shadow: 0 0 0 6px var(--accent-soft); }
  @media (prefers-reduced-motion: reduce) { .history-entry, .history-entry::before { transition: none; } }
</style>
