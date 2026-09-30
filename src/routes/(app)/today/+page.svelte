<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ActiveSessionCard from '$lib/components/execution/ActiveSessionCard.svelte';
  import WorkItemRow from '$lib/components/work/WorkItemRow.svelte';
  import { listChores, quickCaptureChore } from '$lib/api/work';
  import { getActiveSession } from '$lib/api/execution';
  import { queryKeys } from '$lib/api/query-keys';

  const queryClient = useQueryClient();
  let quickName = $state('');

  const chores = createQuery(() => ({
    queryKey: queryKeys.work.chores,
    queryFn: listChores
  }));

  const active = createQuery(() => ({
    queryKey: queryKeys.execution.active,
    queryFn: getActiveSession,
    refetchInterval: 15_000
  }));

  const capture = createMutation(() => ({
    mutationFn: quickCaptureChore,
    onSuccess: async () => {
      quickName = '';
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
    }
  }));

  const openChores = $derived(
    (chores.data?.items ?? []).filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status))
  );

  const nextWork = $derived(
    [...openChores]
      .sort((a, b) => {
        const rank = { in_progress: 0, ready: 1, draft: 2 } as Record<string, number>;
        return (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || (b.priority ?? 0) - (a.priority ?? 0) || a.position - b.position;
      })
      .slice(0, 7)
  );

  const plannedSoon = $derived(
    openChores
      .filter((item) => item.plannedStartAt || item.deadlineAt)
      .sort((a, b) => Date.parse(a.plannedStartAt || a.deadlineAt || '9999-12-31') - Date.parse(b.plannedStartAt || b.deadlineAt || '9999-12-31'))
      .slice(0, 3)
  );

  const inboxCount = $derived(openChores.filter((item) => item.parentId === null).length);

  function submitQuickCapture(event: SubmitEvent) {
    event.preventDefault();
    const name = quickName.trim();
    if (name) capture.mutate(name);
  }
</script>

<svelte:head><title>Today — Taskiller</title></svelte:head>

<div class="tk-page">
  <header class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite">
        <span class="size-2 rounded-full bg-tk-strike shadow-[0_0_14px_rgb(255_99_63/0.45)]"></span>
        Execution runway
      </div>
      <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">Today</h1>
      <p class="mt-4 max-w-xl text-base leading-7 text-tk-graphite">Keep the queue short enough to act on. Everything else can wait.</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{openChores.length} open</span>
      <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{inboxCount} unfiled</span>
    </div>
  </header>

  {#if active.data?.session}
    <div class="mt-10">
      <ActiveSessionCard session={active.data.session} />
    </div>
  {/if}

  <form class="tk-capture-deck mt-10 flex max-w-4xl gap-2 rounded-[18px] p-2.5" onsubmit={submitQuickCapture}>
    <span class="hidden size-11 shrink-0 place-items-center rounded-[13px] bg-tk-strike/10 text-tk-strike sm:grid"><PlusIcon size={18} weight="bold" /></span>
    <Input
      class="border-transparent bg-transparent text-base focus:border-transparent focus:shadow-none"
      placeholder="Capture the next move…"
      bind:value={quickName}
      name="quick-capture"
      autocomplete="off"
      aria-label="Quick capture chore"
    />
    <Button type="submit" variant="dark" aria-label={capture.isPending ? 'Saving chore' : 'Capture chore'} disabled={capture.isPending || !quickName.trim()}>
      <PlusIcon size={17} weight="bold" />
      <span class="hidden sm:inline">{capture.isPending ? 'Saving…' : 'Capture'}</span>
    </Button>
  </form>

  <div class="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
    <section class="min-w-0">
      <div class="flex items-end justify-between gap-4 pb-4">
        <div>
          <p class="text-sm font-semibold text-tk-graphite">Do next</p>
          <h2 class="tk-display mt-1 text-2xl font-bold">Executable work</h2>
        </div>
        <a href="/inbox" class="flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-sm font-bold text-tk-graphite transition-colors hover:bg-[var(--surface-subtle)] hover:text-tk-ink">Full inbox <ArrowRightIcon size={15} /></a>
      </div>

      {#if chores.isPending}
        <div class="space-y-2 py-5">{#each Array(4) as _}<div class="h-16 animate-pulse rounded-[14px] bg-black/[0.045]"></div>{/each}</div>
      {:else if chores.isError}
        <div class="rounded-[16px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">Couldn’t load your work. Check the API connection and try again.</div>
      {:else if nextWork.length === 0}
        <div class="tk-panel-soft rounded-[20px] border-dashed py-16 text-center">
          <p class="text-xl font-bold">The runway is clear.</p>
          <p class="mt-2 text-sm text-tk-graphite">Capture one Chore above. A name is enough.</p>
        </div>
      {:else}
        <div class="tk-panel overflow-hidden rounded-[20px] px-3 sm:px-4">
          {#each nextWork as item}
            <WorkItemRow {item} />
          {/each}
        </div>
      {/if}
    </section>

    <aside class="space-y-4">
      {#if !active.data?.session}
        <div class="tk-session-reactor rounded-[22px] p-6 text-white">
          <div class="mb-10 flex size-10 items-center justify-center rounded-[12px] bg-white/8 text-tk-strike"><SparkleIcon size={20} weight="fill" /></div>
          <p class="text-sm font-semibold text-white/45">No active session</p>
          <h2 class="tk-display mt-3 text-2xl font-bold leading-tight">Choose the work before choosing the timer.</h2>
          <p class="mt-4 text-sm leading-6 text-white/55">Open a Chore or Sprint, shape its plan, then enter focus mode.</p>
        </div>
      {/if}

      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center justify-between">
          <div><p class="text-sm font-semibold text-tk-graphite">Coming up</p><h2 class="mt-1 font-bold">Calendar pressure</h2></div>
          <a href="/projects" class="text-xs font-bold text-tk-graphite hover:text-tk-ink">Projects</a>
        </div>

        {#if plannedSoon.length}
          <div class="mt-4 space-y-2">
            {#each plannedSoon as item}
              <a href={`/work/${item.id}`} class="group block rounded-[13px] bg-[var(--surface-subtle)] p-3 transition-[transform,background-color] hover:translate-x-0.5 hover:bg-[var(--surface-strong)]">
                <p class="truncate text-sm font-bold">{item.name}</p>
                <p class="mt-1 text-xs text-tk-graphite">{item.plannedStartAt ? 'Planned' : 'Deadline'} · {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(item.plannedStartAt || item.deadlineAt || ''))}</p>
              </a>
            {/each}
          </div>
        {:else}
          <p class="mt-4 text-sm leading-6 text-tk-graphite">No planned starts or deadlines in the current queue.</p>
        {/if}
      </div>
    </aside>
  </div>
</div>
