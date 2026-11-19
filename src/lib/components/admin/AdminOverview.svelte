<script lang="ts">
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import UsersThreeIcon from 'phosphor-svelte/lib/UsersThreeIcon';
  import PulseIcon from 'phosphor-svelte/lib/PulseIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import { adminMessage } from '$lib/api/admin/client';
  import { capabilities as c, type Overview } from '$lib/api/admin/contract';
  import { loadActivityBuckets, periodLabel, trendMetrics, type ActivityBucket, type TrendMetric } from '$lib/api/admin/overview';
  import { formatField } from '$lib/api/admin/views';

  let { totals, start, end, grants }: { totals: Overview; start: string; end: string; grants: string[] } = $props();
  let buckets = $state<ActivityBucket[]>([]);
  let metric = $state<TrendMetric>('completedExecutionSessions');
  let fetching = $state(true);
  let failure = $state('');
  let retry = $state(0);
  const number = new Intl.NumberFormat('en');
  const countLabel = (value: unknown) => typeof value === 'number' ? number.format(value) : '—';
  const indicators = [
    { key: 'registrations', label: 'Registrations', icon: UsersThreeIcon, tone: 'coral' },
    { key: 'accountsWithExecutionActivity', label: 'Active accounts', icon: PulseIcon, tone: 'mint' },
    { key: 'completedExecutionSessions', label: 'Completed sessions', icon: CheckCircleIcon, tone: 'lilac' }
  ] as const;
  const actions = [
    { label: 'Find a user', href: '/admin/users', permission: c.users },
    { label: 'Review denied actions', href: '/admin/audit?outcome=denied', permission: c.audit },
    { label: 'Open privacy requests', href: '/admin/privacy', permission: c.privacy }
  ];
  let visibleActions = $derived(actions.filter(action => grants.includes(action.permission)));
  let series = $derived(buckets.map(bucket => bucket.counts[metric]));
  let ceiling = $derived(Math.max(1, ...series.map(value => value ?? 0)));
  let seriesLabel = $derived(trendMetrics.find(item => item.key === metric)?.label ?? 'Activity');
  let jobTotal = $derived((totals.queuedJobs ?? 0) + (totals.failedJobs ?? 0));
  let hasQueue = $derived(grants.includes(c.jobs));
  let days = $derived(Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000));

  $effect(() => {
    retry;
    const controller = new AbortController();
    const first = start;
    const last = end;
    fetching = true;
    failure = '';
    buckets = [];
    void loadActivityBuckets(first, last, controller.signal).then(data => {
      if (!controller.signal.aborted) buckets = data;
    }).catch(cause => {
      if (!controller.signal.aborted) failure = adminMessage(cause);
    }).finally(() => {
      if (!controller.signal.aborted) fetching = false;
    });
    return () => controller.abort();
  });
</script>

<dl class="indicators" aria-label="Activity totals for selected period">
  {#each indicators as item}
    <div class="indicator">
      <dt><span class={'metric-icon ' + item.tone}><item.icon size={19} aria-hidden="true" /></span>{item.label}</dt>
      <dd>{countLabel(totals[item.key])}</dd>
    </div>
  {/each}
</dl>

<div class="dashboard-grid">
  <section class="activity-panel" aria-labelledby="admin-trend-heading" aria-busy={fetching}>
    <div class="chart-header">
      <div>
        <h2 id="admin-trend-heading" class="tk-display text-xl">Activity over time</h2>
        <p class="mt-1 text-sm text-[#b9cbe5]">{periodLabel(start)} – {periodLabel(end)} UTC</p>
      </div>
      <div class="metric-tabs" aria-label="Chart metric">
        {#each trendMetrics as item}
          <button type="button" aria-pressed={metric === item.key} onclick={() => { metric = item.key; }}>{item.label}</button>
        {/each}
      </div>
    </div>

    {#if fetching}
      <p class="chart-state" role="status"><Spinner size={18} /> Loading activity chart…</p>
    {:else if failure}
      <div class="chart-state"><p role="alert">{failure}</p><Button size="sm" variant="dark" onclick={() => { retry++; }}>Retry chart</Button></div>
    {:else if !series.some(value => typeof value === 'number')}
      <p class="chart-state">No measurements available for this metric.</p>
    {:else}
      <figure aria-label={seriesLabel + ' by time period'}>
        <div class="plot">
          {#each buckets as bucket (bucket.start)}
            {@const value = bucket.counts[metric]}
            <div class="plot-col">
              <div class="bars">
                <span class="tabular-nums">{countLabel(value)}</span>
                <div class="bar-track"><div class="bar" class:zero={value === 0} style:transform={'scaleY(' + (value === 0 ? .015 : (value ?? 0) / ceiling) + ')'}></div></div>
              </div>
              <span class="bucket-label">{periodLabel(bucket.start)}</span>
            </div>
          {/each}
        </div>
        <figcaption class="mt-4 text-xs text-[#b9cbe5]">Each bar is a separate UTC window. Active accounts can appear in more than one window.</figcaption>
      </figure>
      <details class="mt-4 rounded-lg border border-white/20 px-3">
        <summary class="flex min-h-11 cursor-pointer items-center text-sm font-bold">View chart data</summary>
        <div class="overflow-x-auto pb-3">
          <table class="w-full text-left text-sm" aria-label={seriesLabel + ' data'}>
            <thead><tr><th scope="col" class="py-1">From (UTC)</th><th scope="col">To (UTC, exclusive)</th><th scope="col">Count</th></tr></thead>
            <tbody>
              {#each buckets as bucket (bucket.start)}
                <tr class="border-t border-white/15"><td class="py-1">{formatField('startAt', bucket.start)}</td><td>{formatField('endAt', bucket.end)}</td><td>{countLabel(bucket.counts[metric])}</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    {/if}
  </section>

  {#if hasQueue || visibleActions.length}
    <aside class="side-panel">
      {#if hasQueue}
        <section aria-labelledby="admin-queue-heading">
          <h2 id="admin-queue-heading" class="tk-display text-lg">Job queue</h2>
          <p class="mt-1 text-xs text-[var(--muted)]">Visible jobs created in this period</p>
          <dl class="queue-stats">
            <div><dt>Queued</dt><dd>{countLabel(totals.queuedJobs)}</dd></div>
            <div><dt>Failed</dt><dd>{countLabel(totals.failedJobs)}</dd></div>
          </dl>
          {#if jobTotal > 0 && typeof totals.failedJobs === 'number' && typeof totals.queuedJobs === 'number'}
            <div class="queue-track" aria-hidden="true"><div style:width={totals.failedJobs / jobTotal * 100 + '%'}></div></div>
          {/if}
          <p class="my-4 text-xs leading-5 text-[var(--muted)]">Last completed job signal<br /><strong class="text-[var(--foreground)]">{formatField('signalAt', totals.latestWorkerSignalAt)}</strong></p>
          <div class="quick-links">
            <a href={'/admin/operations?state=dead&days=' + days}>Review failed jobs <ArrowUpRightIcon size={16} aria-hidden="true" /></a>
            <a href={'/admin/operations?state=queued&days=' + days}>View queued jobs <ArrowUpRightIcon size={16} aria-hidden="true" /></a>
          </div>
        </section>
      {/if}
      {#if visibleActions.length}
        <section class:separated={hasQueue} aria-labelledby="admin-shortcuts-heading">
          <h2 id="admin-shortcuts-heading" class="tk-display text-lg">Shortcuts</h2>
          <div class="quick-links mt-2">
            {#each visibleActions as action}<a href={action.href}>{action.label}<ArrowUpRightIcon size={16} aria-hidden="true" /></a>{/each}
          </div>
        </section>
      {/if}
    </aside>
  {/if}
</div>
<p class="mt-4 text-xs text-[var(--muted)]">Observed {formatField('observedAt', totals.observedAt)}</p>

<style>
  .indicators { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid var(--border); border-radius:16px; background:var(--surface); margin-bottom:1rem; overflow:hidden; }
  .indicator { padding:clamp(.75rem,2vw,1.35rem); }
  .indicator + .indicator { border-left:1px solid var(--border); }
  dt { color:var(--muted); font-size:.78rem; font-weight:700; }
  .indicator dt { display:flex; align-items:center; flex-wrap:wrap; gap:.55rem; }
  dd { font-variant-numeric:tabular-nums; font-weight:750; }
  .indicator dd { font-size:clamp(1.5rem,4vw,2.4rem); margin-top:.65rem; }
  .metric-icon { display:grid; place-items:center; width:2rem; height:2rem; border-radius:8px; color:#152b49; }
  .coral { background:#ffc1b0; } .mint { background:#afe4d4; } .lilac { background:#d1c8f4; }
  .dashboard-grid { display:grid; gap:1rem; align-items:start; }
  .activity-panel { color:#f2f7ff; background:#152b49; border-radius:16px; padding:clamp(.875rem,2vw,1.5rem); min-width:0; }
  .chart-header { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:start; gap:1rem; margin-bottom:1.4rem; }
  .metric-tabs { display:flex; flex-wrap:wrap; gap:4px; }
  .metric-tabs button { border:1px solid #7189ad; border-radius:8px; min-height:44px; padding:.35rem .65rem; color:#e0eafd; font-size:.75rem; font-weight:700; }
  .metric-tabs button[aria-pressed='true'] { background:#dce8ff; color:#152b49; border-color:#dce8ff; }
  .chart-state { min-height:15rem; display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:.6rem; }
  .plot { display:grid; grid-auto-columns:minmax(0,1fr); grid-auto-flow:column; gap:clamp(.2rem,1.5vw,.8rem); }
  .plot-col { min-width:0; text-align:center; }
  .bars { height:clamp(8rem,21vw,15rem); display:flex; flex-direction:column; gap:.45rem; padding:0 .2rem .2rem; border-bottom:1px solid #67809f; font-size:.7rem; font-weight:700; }
  .bar-track { position:relative; flex:1; background:#203a5d; border-radius:5px 5px 0 0; overflow:hidden; }
  .bar { position:absolute; inset:0; background:#ffac96; border-radius:5px 5px 0 0; transform-origin:bottom; transition:transform .25s ease; }
  .bar.zero { background:#b9cbe5; }
  .bucket-label { display:block; color:#c7d8ee; margin-top:.5rem; font-size:.65rem; }
  .side-panel { padding:1.2rem; border:1px solid var(--border); border-radius:16px; background:var(--surface); }
  .queue-stats { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; margin-block:1rem .6rem; }
  .queue-stats dd { font-size:1.6rem; }
  .queue-track { height:7px; background:#81c5b0; border-radius:6px; overflow:hidden; }
  .queue-track div { height:100%; background:#f27662; }
  .quick-links a { display:flex; align-items:center; justify-content:space-between; gap:.5rem; min-height:44px; border-top:1px solid var(--border); font-size:.85rem; font-weight:700; }
  .quick-links a:hover { color:var(--accent-ink); }
  .separated { margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border); }
  @media (min-width:1200px) { .dashboard-grid:has(.side-panel) { grid-template-columns:minmax(0, 2.5fr) minmax(15rem,1fr); } }
  @media (max-width:420px) { .indicator dt { display:grid; gap:.4rem; } }
</style>
