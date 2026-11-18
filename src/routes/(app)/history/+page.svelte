<script lang="ts">
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import FunnelIcon from 'phosphor-svelte/lib/FunnelIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import SessionHistoryRow from '$lib/components/history/SessionHistoryRow.svelte';
  import { listExecutionSessions, type ExecutionSession } from '$lib/api/execution';
  import { getWorkItem } from '$lib/api/work';
  import { problemMessage } from '$lib/api/problem';

  type StateFilter = 'all' | 'running' | 'paused' | 'completed' | 'abandoned';
  type RangeDays = 7 | 30 | 90 | 0;

  const workItemId = $derived(page.url.searchParams.get('workItemId') ?? '');
  let workItemName = $state('');
  const stateFilter = $derived<StateFilter>(
    ['running', 'paused', 'completed', 'abandoned'].includes(page.url.searchParams.get('state') ?? '')
      ? page.url.searchParams.get('state') as StateFilter : 'all'
  );
  const rangeDays = $derived<RangeDays>(
    ['7', '30', '90', '0'].includes(page.url.searchParams.get('range') ?? '')
      ? Number(page.url.searchParams.get('range')) as RangeDays : 30
  );
  let generation = 0;
  let sessions = $state<ExecutionSession[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state('');
  let loadedFilters = '';
  let pageBounds: { from: string | null; to: string | null } = { from: null, to: null };

  function rangeBounds() {
    if (!rangeDays) return { from: null, to: null };
    const to = new Date();
    const from = new Date(to.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  async function load(reset = true) {
    if (!reset && (loading || loadingMore)) return;
    const requestGeneration = ++generation;
    if (reset) {
      const filters = JSON.stringify([workItemId, stateFilter, rangeDays]);
      if (filters !== loadedFilters) { sessions = []; nextCursor = null; }
      loadedFilters = filters;
      pageBounds = rangeBounds();
      loading = true; loadingMore = false; hasMore = false;
    }
    else loadingMore = true;
    error = '';
    try {
      const bounds = pageBounds;
      const data = await listExecutionSessions({
        limit: 25,
        cursor: reset ? null : nextCursor,
        workItemId: workItemId || null,
        state: stateFilter === 'all' ? null : stateFilter,
        from: bounds.from,
        to: bounds.to
      });
      if (requestGeneration !== generation) return;
      sessions = reset ? data.items : [...sessions, ...data.items];
      nextCursor = data.page.nextCursor;
      hasMore = data.page.hasMore;
    } catch (cause) {
      if (requestGeneration !== generation) return;
      error = problemMessage(cause, 'Could not load execution history.');
    } finally {
      if (requestGeneration === generation) { loading = false; loadingMore = false; }
    }
  }

  async function resolveWorkName() {
    if (!workItemId) {
      workItemName = '';
      return;
    }
    const requestedId = workItemId;
    workItemName = '';
    try {
      const result = await getWorkItem(requestedId);
      if (requestedId !== workItemId) return;
      workItemName = result.item.name;
    } catch {
      if (requestedId === workItemId) workItemName = 'Selected work item';
    }
  }

  function updateFilter(key: string, value: string | null) {
    const url = new URL(page.url);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    void goto(url, { keepFocus: true, noScroll: true });
  }

  $effect(() => {
    workItemId; stateFilter; rangeDays;
    untrack(() => { void resolveWorkName(); void load(true); });
    return () => { generation++; };
  });
</script>

<svelte:head><title>History — Taskiller</title></svelte:head>

<div class="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="tk-page-intro flex flex-wrap items-end justify-between gap-6 border-b border-[var(--border)] pb-7">
    <div>
      <div class="tk-eyebrow mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite"><span class="tk-feature-icon" aria-hidden="true"><ClockCounterClockwiseIcon size={15} class="text-tk-blue" aria-hidden="true" /></span> Execution record</div>
      <h1 class="tk-display text-4xl font-extrabold">History</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">Your Execution Sessions, plans, events, and reviews.</p>
    </div>
    <Button loading={loading} variant="secondary" onclick={() => load(true)} disabled={loading}><ArrowClockwiseIcon size={16} aria-hidden="true" /> Refresh</Button>
  </header>

  <div class="mt-6 flex flex-wrap items-center gap-2">
    <div class="mr-1 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.11em] text-tk-graphite"><FunnelIcon size={14} aria-hidden="true" /> Range</div>
    {#each [[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All']] as option}
      <button class={`min-h-11 rounded-full px-3 py-1.5 text-xs font-bold transition ${rangeDays === option[0] ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'border border-[var(--border)] bg-[var(--surface)] text-tk-graphite hover:text-[var(--foreground)]'}`} aria-pressed={rangeDays === option[0]} onclick={() => updateFilter('range', String(option[0]))}>{option[1]}</button>
    {/each}
    <Select aria-label="Session state" class="ml-1 h-11 w-auto min-w-36 rounded-full py-0 text-xs font-bold" value={stateFilter} onchange={(event) => updateFilter('state', event.currentTarget.value)}>
      <option value="all">All states</option>
      <option value="completed">Completed</option>
      <option value="abandoned">Abandoned</option>
      <option value="running">Running</option>
      <option value="paused">Paused</option>
    </Select>
  </div>

  {#if workItemId}
    <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-tk-blue/10 px-3 py-2 text-xs font-bold text-[var(--blue)]">
      Work item: {workItemName || 'Loading…'}
      <button class="grid size-5 place-items-center rounded-full hover:bg-black/5" aria-label="Clear work item filter" onclick={() => updateFilter('workItemId', null)}><XIcon size={12} weight="bold" aria-hidden="true" /></button>
    </div>
  {/if}

  {#if error}<div class="mt-5 rounded-[14px] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-text)]" role="alert">{error}</div>{/if}
  {#if error && sessions.length}<p class="mt-3 text-sm text-tk-graphite">Showing previously loaded sessions for these filters. Refresh to try again.</p>{/if}

  <p class="sr-only" role="status">{loading ? 'Loading history…' : loadingMore ? 'Loading older sessions…' : error ? 'History could not be updated.' : `${sessions.length} sessions shown.`}</p>
  <section aria-busy={loading || loadingMore} class="tk-panel mt-7 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-5 sm:px-6">
    {#if loading}
      <div class="space-y-2 py-6">{#each Array(6) as _}<div class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-subtle)]"></div>{/each}</div>
    {:else if sessions.length === 0 && !error}
      <div class="tk-empty-state py-16 text-center">
        <span class="tk-feature-icon mx-auto mb-5" aria-hidden="true"><ClockCounterClockwiseIcon size={25} /></span>
        <p class="text-lg font-bold">No sessions in this slice.</p>
        <p class="mt-2 text-sm text-tk-graphite">Try a wider range or another state filter.</p>
      </div>
    {:else}
      {#each sessions as session (session.id)}
        <SessionHistoryRow {session} />
      {/each}
    {/if}
  </section>

  {#if hasMore}
    <div class="mt-5 flex justify-center"><Button loading={loadingMore} variant="secondary" disabled={loading || loadingMore} onclick={() => load(false)}>{loadingMore ? 'Loading…' : 'Load older sessions'}</Button></div>
  {/if}
</div>
