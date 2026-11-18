<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import { analyticsRange, getWorkItemAnalytics } from '$lib/api/analytics';
  import { queryKeys } from '$lib/api/query-keys';
  import { formatDuration } from '$lib/utils';

  let { workItemId }: { workItemId: string } = $props();
  const range = analyticsRange(30);
  const analytics = createQuery(() => ({
    queryKey: queryKeys.analytics.workItem(workItemId, range.from, range.to),
    queryFn: () => getWorkItemAnalytics(workItemId, range.from, range.to)
  }));

  const adherence = $derived(
    analytics.data?.planAdherenceRate == null ? '—' : `${Math.round(analytics.data.planAdherenceRate * 100)}%`
  );
</script>

<section class="tk-panel rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
  <div class="flex items-center justify-between gap-3">
    <div>
      <div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite"><ChartLineUpIcon size={14} aria-hidden="true" /> Last 30 days</div>
      <h2 class="mt-1 font-bold">Observed execution</h2>
    </div>
    <a href={`/history?workItemId=${workItemId}`} class="flex min-h-11 items-center gap-1 text-xs font-bold text-tk-graphite hover:text-[var(--foreground)]"><ClockCounterClockwiseIcon size={14} aria-hidden="true" /> History</a>
  </div>

  {#if analytics.isPending}
    <p role="status" class="sr-only">Loading work analytics…</p>
    <div class="mt-5 grid grid-cols-2 gap-3">{#each Array(4) as _}<div class="h-14 animate-pulse rounded-[12px] bg-[var(--surface-subtle)]"></div>{/each}</div>
  {:else if analytics.isError || !analytics.data}
    <p role="alert" class="mt-4 text-sm leading-6 text-tk-graphite">Analytics could not be loaded. <button class="min-h-11 underline" onclick={() => analytics.refetch()}>Retry analytics</button></p>
  {:else}
    <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-[13px] bg-[var(--surface-raised)] p-3"><dt class="text-xs text-tk-graphite">Active work</dt><dd class="tk-mono mt-1 font-bold">{formatDuration(analytics.data.activeWorkSeconds)}</dd></div>
      <div class="rounded-[13px] bg-[var(--surface-raised)] p-3"><dt class="text-xs text-tk-graphite">Sessions</dt><dd class="tk-mono mt-1 font-bold">{analytics.data.sessionCount}</dd></div>
      <div class="rounded-[13px] bg-[var(--surface-raised)] p-3"><dt class="text-xs text-tk-graphite">Plan adherence</dt><dd class="tk-mono mt-1 font-bold">{adherence}</dd></div>
      <div class="rounded-[13px] bg-[var(--surface-raised)] p-3"><dt class="text-xs text-tk-graphite">Estimate error</dt><dd class="tk-mono mt-1 font-bold">{analytics.data.estimateErrorSeconds == null ? '—' : formatDuration(Math.abs(analytics.data.estimateErrorSeconds))}</dd></div>
    </dl>
  {/if}
</section>
