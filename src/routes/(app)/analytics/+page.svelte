<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery } from '@tanstack/svelte-query';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import ActivityChart from '$lib/components/analytics/ActivityChart.svelte';
  import HourPatternChart from '$lib/components/analytics/HourPatternChart.svelte';
  import MetricCard from '$lib/components/analytics/MetricCard.svelte';
  import SessionHistoryRow from '$lib/components/history/SessionHistoryRow.svelte';
  import {
    analyticsRange,
    getAnalyticsSummary,
    getAnalyticsTimeseries,
    getFocusPatterns,
    getWorkTypeAnalytics,
    type AnalyticsBucket
  } from '$lib/api/analytics';
  import { listExecutionSessions } from '$lib/api/execution';
  import { queryKeys } from '$lib/api/query-keys';
  import { formatDuration } from '$lib/utils';

  type RangeDays = 7 | 30 | 90;
  const rangeDays = $derived<RangeDays>(['7', '30', '90'].includes(page.url.searchParams.get('range') ?? '') ? Number(page.url.searchParams.get('range')) as RangeDays : 30);
  let anchorIso = $state(new Date().toISOString());
  const fromIso = $derived(analyticsRange(rangeDays, anchorIso).from);
  const toIso = $derived(anchorIso);
  const bucket = $derived<AnalyticsBucket>(rangeDays > 45 ? 'week' : 'day');

  const summary = createQuery(() => ({
    queryKey: queryKeys.analytics.summary(fromIso, toIso),
    queryFn: () => getAnalyticsSummary(fromIso, toIso)
  }));
  const timeseries = createQuery(() => ({
    queryKey: queryKeys.analytics.timeseries(fromIso, toIso, bucket),
    queryFn: () => getAnalyticsTimeseries(fromIso, toIso, bucket)
  }));
  const workTypes = createQuery(() => ({
    queryKey: queryKeys.analytics.workTypes(fromIso, toIso),
    queryFn: () => getWorkTypeAnalytics(fromIso, toIso)
  }));
  const focusPatterns = createQuery(() => ({
    queryKey: queryKeys.analytics.focusPatterns(fromIso, toIso),
    queryFn: () => getFocusPatterns(fromIso, toIso)
  }));
  const recentSessions = createQuery(() => ({
    queryKey: queryKeys.execution.history({ from: fromIso, to: toIso, limit: 6 }),
    queryFn: () => listExecutionSessions({ from: fromIso, to: toIso, limit: 6 })
  }));

  const loading = $derived(summary.isPending || timeseries.isPending || workTypes.isPending || focusPatterns.isPending);
  const failed = $derived(summary.isError || timeseries.isError || workTypes.isError || focusPatterns.isError || recentSessions.isError);
  const updating = $derived(loading || recentSessions.isPending || summary.isFetching || timeseries.isFetching || workTypes.isFetching || focusPatterns.isFetching || recentSessions.isFetching);
  const empty = $derived(!loading && !recentSessions.isPending && !failed && !!summary.data &&
    summary.data.activeWorkSeconds === 0 && summary.data.breakSeconds === 0 && summary.data.pausedSeconds === 0 &&
    summary.data.sessionsCompleted === 0 && summary.data.sessionsAbandoned === 0 && summary.data.choresCompleted === 0 &&
    summary.data.requiredSegmentsPlanned === 0 &&
    !(timeseries.data?.points.some((point) => point.activeWorkSeconds || point.breakSeconds || point.pausedSeconds || point.sessionsCompleted || point.choresCompleted)) &&
    !workTypes.data?.items.length && !focusPatterns.data?.items.length &&
    !(focusPatterns.data?.timeOfDay.some((item) => item.activeWorkSeconds || item.sessionCount)) && !recentSessions.data?.items.length);
  const adherence = $derived(
    summary.data?.planAdherenceRate == null ? '—' : `${Math.round(summary.data.planAdherenceRate * 100)}%`
  );
  const completionTotal = $derived((summary.data?.sessionsCompleted ?? 0) + (summary.data?.sessionsAbandoned ?? 0));
  const completionRate = $derived(
    completionTotal === 0 ? '—' : `${Math.round(((summary.data?.sessionsCompleted ?? 0) / completionTotal) * 100)}%`
  );
  const sortedTypes = $derived(
    [...(workTypes.data?.items ?? [])].sort((a, b) => b.activeWorkSeconds - a.activeWorkSeconds)
  );
  const eligiblePatterns = $derived(
    (focusPatterns.data?.items ?? []).filter((item) => item.recommendationPersonalizationEligible)
  );

  function setRange(days: RangeDays) {
    const url = new URL(page.url);
    url.searchParams.set('range', String(days));
    void goto(url, { keepFocus: true, noScroll: true });
  }

  function refresh() {
    anchorIso = new Date().toISOString();
  }

  function signedDuration(value: number | null | undefined) {
    if (value == null) return '—';
    if (value === 0) return '0 min';
    return `${value > 0 ? '+' : '−'}${formatDuration(Math.abs(value))}`;
  }

  function percent(value: number | null | undefined) {
    return value == null ? '—' : `${Math.round(value * 100)}%`;
  }

  function focus(value: number | null | undefined) {
    return value == null ? '—' : `${value.toFixed(1)} / 5`;
  }
</script>

<svelte:head><title>Analytics — Taskiller</title></svelte:head>

<div class="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--border)] pb-7">
    <div>
      <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite"><ChartLineUpIcon size={15} class="text-tk-strike" aria-hidden="true" /> Observed execution</div>
      <h1 class="tk-display text-4xl font-extrabold">Analytics</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">A descriptive view of how work actually unfolded. Taskiller reports patterns and calibration; it does not turn them into a productivity score.</p>
    </div>
    <div class="flex items-center gap-2">
      {#each [[7, '7d'], [30, '30d'], [90, '90d']] as option}
        <button class={`min-h-11 rounded-full px-3.5 text-xs font-bold transition ${rangeDays === option[0] ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'border border-[var(--border)] bg-[var(--surface)] text-tk-graphite hover:text-[var(--foreground)]'}`} aria-pressed={rangeDays === option[0]} onclick={() => setRange(option[0] as RangeDays)}>{option[1]}</button>
      {/each}
      <Button variant="secondary" size="icon" aria-label="Refresh analytics" onclick={refresh}><ArrowClockwiseIcon size={16} aria-hidden="true" /></Button>
    </div>
  </header>

  <p role="status" class="sr-only">{updating ? 'Loading analytics…' : failed ? 'Some analytics could not be loaded.' : 'Analytics updated.'}</p>
  {#if empty}
    <section class="tk-panel mt-7 p-6">
      <h2 class="text-xl font-bold">See how your work unfolds</h2>
      <p class="mt-2 text-[var(--muted)]">No Execution Sessions in this period yet. Choose a Chore and start a session to see activity, timing, and review patterns here.</p>
      <a href="/projects?kind=chore" class="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-4 font-bold text-[#27150e]">Choose work</a>
    </section>
  {:else}
  <div class="mt-5 flex items-start gap-2 rounded-[14px] bg-tk-blue/8 px-4 py-3 text-xs leading-5 text-[var(--foreground)]"><InfoIcon size={16} class="mt-0.5 shrink-0" aria-hidden="true" /> Focus scores come from your own reviews. Time-of-day and work-type patterns are descriptive; they do not prove that a particular hour, timer, or work type caused better performance.</div>

  {#if failed}
    <div role="alert" class="mt-6 rounded-[16px] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">Some analytics could not be loaded. Refresh to try again; available sections are shown below.</div>
  {/if}

  {#if summary.isError}
    <p role="alert" class="mt-7">Summary and calibration could not be loaded. <button class="min-h-11 underline" onclick={() => summary.refetch()}>Retry summary</button></p>
  {:else}
  <section class="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard label="Active work" value={summary.isPending ? '…' : formatDuration(summary.data?.activeWorkSeconds)} detail={summary.data ? `${summary.data.sessionsCompleted} completed sessions` : 'Loading summary…'} tone="accent" />
    <MetricCard label="Plan adherence" value={summary.isPending ? '…' : adherence} detail={summary.data ? `${summary.data.requiredSegmentsCompleted} of ${summary.data.requiredSegmentsPlanned} required segments` : 'Loading summary…'} tone="blue" />
    <MetricCard label="Session completion" value={summary.isPending ? '…' : completionRate} detail={summary.data ? `${summary.data.sessionsAbandoned} abandoned in range` : 'Loading summary…'} tone="green" />
    <MetricCard label="Chores completed" value={summary.isPending ? '…' : String(summary.data?.choresCompleted ?? 0)} detail={`Across the selected ${rangeDays}-day window`} />
  </section>

  {/if}
  <div class="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
    <section class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Activity</p>
          <h2 class="mt-1 text-xl font-bold">Work, breaks, and pauses</h2>
        </div>
        <span class="text-xs font-semibold text-tk-graphite">{bucket === 'day' ? 'Daily' : 'Weekly'} buckets · {timeseries.data?.timezone ?? '—'}</span>
      </div>
      <div class="mt-6">
        {#if timeseries.isPending}<div class="h-[250px] animate-pulse rounded-[16px] bg-[var(--surface-subtle)]"></div>{:else if timeseries.isError}<p role="alert">Activity could not be loaded. <button class="min-h-11 underline" onclick={() => timeseries.refetch()}>Retry activity</button></p>{:else if timeseries.data?.points.length}<ActivityChart points={timeseries.data.points} />{:else}<div class="grid h-[230px] place-items-center text-sm text-tk-graphite">No execution activity in this period.</div>{/if}
      </div>
    </section>

    {#if summary.data && !summary.isError}
    <section class="rounded-[14px] bg-tk-ink p-6 text-white">
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">Calibration</p>
      <h2 class="tk-display mt-2 text-2xl font-bold">What the plan felt like in reality.</h2>
      <dl class="mt-7 space-y-5">
        <div class="flex items-end justify-between gap-4 border-b border-white/10 pb-4"><dt class="text-sm text-white/80">Median uninterrupted work</dt><dd class="tk-mono text-lg font-bold">{formatDuration(summary.data?.medianUninterruptedWorkSeconds)}</dd></div>
        <div class="flex items-end justify-between gap-4 border-b border-white/10 pb-4"><dt class="text-sm text-white/80">Median estimate error</dt><dd class="tk-mono text-lg font-bold">{signedDuration(summary.data?.medianEstimateErrorSeconds)}</dd></div>
        <div class="flex items-end justify-between gap-4"><dt class="text-sm text-white/80">Median start delay</dt><dd class="tk-mono text-lg font-bold">{formatDuration(summary.data?.medianStartDelaySeconds)}</dd></div>
      </dl>
      <p class="mt-6 text-xs leading-5 text-white/80">Estimate error is intentionally shown with its sign. Use it for calibration over repeated work, not as a grade on any single session.</p>
    </section>
    {/if}
  </div>

  <section class="mt-7 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Time of day</p>
        <h2 class="mt-1 text-xl font-bold">When execution happened</h2>
      </div>
      <span class="text-xs font-semibold text-tk-graphite">Timezone · {focusPatterns.data?.timezone ?? '—'}</span>
    </div>
    <div class="mt-7">{#if focusPatterns.isPending}<div class="h-[200px] animate-pulse rounded-[16px] bg-[var(--surface-subtle)]"></div>{:else if focusPatterns.isError}<p role="alert">Hourly patterns could not be loaded. <button class="min-h-11 underline" onclick={() => focusPatterns.refetch()}>Retry patterns</button></p>{:else if focusPatterns.data}<HourPatternChart items={focusPatterns.data.timeOfDay} />{/if}</div>
  </section>

  <div class="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
    <section class="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)]">
      <div class="border-b border-[var(--border)] p-5 sm:p-6">
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Work types</p>
        <h2 class="mt-1 text-xl font-bold">Execution by context</h2>
      </div>
      {#if workTypes.isPending}
        <div class="space-y-2 p-5">{#each Array(5) as _}<div class="h-14 animate-pulse rounded-[12px] bg-[var(--surface-subtle)]"></div>{/each}</div>
      {:else if workTypes.isError}<p role="alert" class="p-5">Work Type analytics could not be loaded. <button class="min-h-11 underline" onclick={() => workTypes.refetch()}>Retry Work Types</button></p>
      {:else if sortedTypes.length === 0}
        <div class="p-10 text-center text-sm text-tk-graphite">No work-type execution data in this period.</div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full min-w-[650px] text-left text-sm">
            <caption class="sr-only">Execution analytics by work type</caption>
            <thead class="bg-[var(--surface-subtle)] text-[10px] font-bold uppercase tracking-[0.08em] text-tk-graphite"><tr><th scope="col" class="px-5 py-3">Work type</th><th scope="col" class="px-4 py-3">Active</th><th scope="col" class="px-4 py-3">Sessions</th><th scope="col" class="px-4 py-3">Completion</th><th scope="col" class="px-4 py-3">Focus</th><th scope="col" class="px-4 py-3">Estimate error</th></tr></thead>
            <tbody>
              {#each sortedTypes as row}
                <tr class="border-t border-[var(--border)]"><td class="px-5 py-4 font-bold">{row.workTypeSlug || 'Uncategorized'}</td><td class="tk-mono px-4 py-4">{formatDuration(row.activeWorkSeconds)}</td><td class="tk-mono px-4 py-4">{row.sessionCount}</td><td class="tk-mono px-4 py-4">{percent(row.completionRate)}</td><td class="tk-mono px-4 py-4">{focus(row.medianFocusScore)}</td><td class="tk-mono px-4 py-4">{signedDuration(row.medianEstimateErrorSeconds)}</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Personalization evidence</p>
      <h2 class="mt-1 text-xl font-bold">Patterns with enough samples</h2>
      <p class="mt-2 text-sm leading-6 text-tk-graphite">These are the work-type patterns can use to personalize future recommendations.</p>
      <div class="mt-5 space-y-3">
        {#if focusPatterns.isPending}
          {#each Array(3) as _}<div class="h-24 animate-pulse rounded-[15px] bg-[var(--surface-subtle)]"></div>{/each}
        {:else if focusPatterns.isError}<p role="alert">Personalization evidence could not be loaded.</p>
        {:else if eligiblePatterns.length === 0}
          <div class="rounded-[15px] bg-[var(--surface-raised)] p-5 text-sm leading-6 text-tk-graphite">Not enough repeated history yet. Taskiller will keep using plans based on your preferences until the sample threshold is reached.</div>
        {:else}
          {#each eligiblePatterns as pattern}
            <div class="rounded-[15px] bg-[var(--surface-raised)] p-4">
              <div class="flex items-center justify-between gap-4"><p class="font-bold">{pattern.workTypeSlug}</p><span class="text-xs font-bold text-tk-green">{pattern.sampleSize} samples</span></div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-tk-graphite"><div>Median block<br><span class="tk-mono font-bold text-[var(--foreground)]">{formatDuration(pattern.medianUninterruptedWorkSeconds)}</span></div><div>Median focus<br><span class="tk-mono font-bold text-[var(--foreground)]">{focus(pattern.medianFocusScore)}</span></div></div>
            </div>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="mt-7 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-5 sm:px-6">
    <div class="flex items-center justify-between gap-4 border-b border-[var(--border)] py-5">
      <div><div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite"><ClockCounterClockwiseIcon size={14} aria-hidden="true" /> Drill down</div><h2 class="mt-1 text-xl font-bold">Recent sessions</h2></div>
      <a href="/history" class="text-sm font-bold text-tk-graphite hover:text-[var(--foreground)]">Full history →</a>
    </div>
    {#if recentSessions.isPending}<div class="space-y-2 py-5">{#each Array(4) as _}<div class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-subtle)]"></div>{/each}</div>{:else if recentSessions.isError}<p role="alert" class="py-5">Recent sessions could not be loaded. <button class="min-h-11 underline" onclick={() => recentSessions.refetch()}>Retry recent sessions</button></p>{:else if recentSessions.data?.items.length}{#each recentSessions.data.items as session (session.id)}<SessionHistoryRow {session} />{/each}{:else}<div class="py-12 text-center text-sm text-tk-graphite">No sessions to show in this period.</div>{/if}
  </section>
  {/if}
</div>
