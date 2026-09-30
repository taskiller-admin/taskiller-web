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
    session.state === 'completed' ? 'bg-emerald-50 text-emerald-700' : session.state === 'abandoned' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'
  );
</script>

<div class="grid gap-4 border-b border-[var(--border)] py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
  <div class="min-w-0">
    <div class="flex flex-wrap items-center gap-2">
      <span class={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${stateTone}`}>{session.state}</span>
      <span class="text-xs text-tk-graphite">{formatShortDate(session.sessionStartedAt)}</span>
    </div>
    <a href={`/work/${session.workItemId}`} class="mt-2 block truncate text-[15px] font-bold hover:text-tk-blue">
      {work.data?.item.name || 'Loading work item…'}
    </a>
    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tk-graphite">
      <span>{session.planSnapshot.segments.length} planned segments</span>
      <span>{formatDuration(elapsedSeconds)} elapsed window</span>
      {#if session.planSnapshot.strategy}<span>{session.planSnapshot.strategy}</span>{/if}
    </div>
  </div>
  <a href={`/session/${session.id}`} class="inline-flex h-10 items-center justify-center gap-1 rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm font-bold hover:bg-[#f4f4f0]">Open session <ArrowRightIcon size={15} /></a>
</div>
