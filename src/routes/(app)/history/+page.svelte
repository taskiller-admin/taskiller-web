<script lang="ts">
  import { onMount } from 'svelte';
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

  const initialWorkItemId = page.url.searchParams.get('workItemId') ?? '';
  let workItemId = $state(initialWorkItemId);
  let workItemName = $state('');
  let stateFilter = $state<StateFilter>('all');
  let rangeDays = $state<RangeDays>(30);
  let sessions = $state<ExecutionSession[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state('');

  function rangeBounds() {
    if (!rangeDays) return { from: null, to: null };
    const to = new Date();
    const from = new Date(to.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  async function load(reset = true) {
    if (reset) loading = true;
    else loadingMore = true;
    error = '';
    try {
      const bounds = rangeBounds();
      const data = await listExecutionSessions({
        limit: 25,
        cursor: reset ? null : nextCursor,
        workItemId: workItemId || null,
        state: stateFilter === 'all' ? null : stateFilter,
        from: bounds.from,
        to: bounds.to
      });
      sessions = reset ? data.items : [...sessions, ...data.items];
      nextCursor = data.page.nextCursor;
      hasMore = data.page.hasMore;
    } catch (cause) {
      error = problemMessage(cause, 'Could not load execution history.');
    } finally {
      loading = false;
      loadingMore = false;
    }
  }

  async function resolveWorkName() {
    if (!workItemId) {
      workItemName = '';
      return;
    }
    try {
      workItemName = (await getWorkItem(workItemId)).item.name;
    } catch {
      workItemName = 'Selected work item';
    }
  }

  function changeRange(value: RangeDays) {
    rangeDays = value;
    void load(true);
  }

  function changeState(event: Event) {
    stateFilter = (event.currentTarget as HTMLSelectElement).value as StateFilter;
    void load(true);
  }

  function clearWorkFilter() {
    workItemId = '';
    workItemName = '';
    history.replaceState(null, '', '/history');
    void load(true);
  }

  onMount(async () => {
    await resolveWorkName();
    await load(true);
  });
</script>

<svelte:head><title>History — Taskiller</title></svelte:head>

<div class="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--border)] pb-7">
    <div>
      <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite"><ClockCounterClockwiseIcon size={15} class="text-tk-blue" /> Execution record</div>
      <h1 class="tk-display text-5xl font-extrabold sm:text-6xl">History</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">The audit trail of actual sessions. Open any record to inspect its immutable plan snapshot, events, and review.</p>
    </div>
    <Button variant="secondary" onclick={() => load(true)} disabled={loading}><ArrowClockwiseIcon size={16} /> Refresh</Button>
  </header>

  <div class="mt-6 flex flex-wrap items-center gap-2">
    <div class="mr-1 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.11em] text-tk-graphite"><FunnelIcon size={14} /> Range</div>
    {#each [[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All']] as option}
      <button class={`rounded-full px-3 py-1.5 text-xs font-bold transition ${rangeDays === option[0] ? 'bg-tk-ink text-white' : 'border border-[var(--border)] bg-white/70 text-tk-graphite hover:text-tk-ink'}`} onclick={() => changeRange(option[0] as RangeDays)}>{option[1]}</button>
    {/each}
    <Select class="ml-1 h-9 w-auto min-w-36 rounded-full py-0 text-xs font-bold" value={stateFilter} onchange={changeState}>
      <option value="all">All states</option>
      <option value="completed">Completed</option>
      <option value="abandoned">Abandoned</option>
      <option value="running">Running</option>
      <option value="paused">Paused</option>
    </Select>
  </div>

  {#if workItemId}
    <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-tk-blue/10 px-3 py-2 text-xs font-bold text-[#3654c9]">
      Work item: {workItemName || 'Loading…'}
      <button class="grid size-5 place-items-center rounded-full hover:bg-black/5" aria-label="Clear work item filter" onclick={clearWorkFilter}><XIcon size={12} weight="bold" /></button>
    </div>
  {/if}

  {#if error}<div class="mt-5 rounded-[14px] border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>{/if}

  <section class="mt-7 rounded-[22px] border border-[var(--border)] bg-white/76 px-5 sm:px-6">
    {#if loading}
      <div class="space-y-2 py-6">{#each Array(6) as _}<div class="h-20 animate-pulse rounded-[14px] bg-black/[0.04]"></div>{/each}</div>
    {:else if sessions.length === 0}
      <div class="py-16 text-center">
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
    <div class="mt-5 flex justify-center"><Button variant="secondary" disabled={loadingMore} onclick={() => load(false)}>{loadingMore ? 'Loading…' : 'Load older sessions'}</Button></div>
  {/if}
</div>
