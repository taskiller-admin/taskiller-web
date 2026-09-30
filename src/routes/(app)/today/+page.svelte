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
        return (
          (rank[a.status] ?? 3) - (rank[b.status] ?? 3) ||
          (b.priority ?? 0) - (a.priority ?? 0) ||
          a.position - b.position
        );
      })
      .slice(0, 7)
  );
  const plannedSoon = $derived(
    openChores
      .filter((item) => item.plannedStartAt || item.deadlineAt)
      .sort((a, b) => {
        const aa = Date.parse(a.plannedStartAt || a.deadlineAt || '9999-12-31');
        const bb = Date.parse(b.plannedStartAt || b.deadlineAt || '9999-12-31');
        return aa - bb;
      })
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

<div class="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="flex flex-wrap items-end justify-between gap-6">
    <div>
      <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite">
        <SparkleIcon size={15} class="text-tk-strike" /> Execution runway
      </div>
      <h1 class="tk-display text-5xl font-extrabold sm:text-6xl">Today</h1>
      <p class="mt-3 max-w-xl text-base leading-7 text-tk-graphite">Keep the queue small. Pick something executable, then disappear into the work.</p>
    </div>
    <div class="flex items-center gap-2 text-sm text-tk-graphite">
      <span class="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5">{openChores.length} open chores</span>
      <span class="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5">{inboxCount} unfiled</span>
    </div>
  </header>

  {#if active.data?.session}
    <div class="mt-9">
      <ActiveSessionCard session={active.data.session} />
    </div>
  {/if}

  <form class="mt-9 flex max-w-3xl gap-2 rounded-[17px] border border-[var(--border)] bg-white/86 p-2 shadow-[0_12px_35px_rgb(23_23_23/0.045)] backdrop-blur" onsubmit={submitQuickCapture}>
    <Input class="border-transparent bg-transparent focus:border-transparent" placeholder="Capture a chore without breaking your flow…" bind:value={quickName} aria-label="Quick capture chore" />
    <Button
      type="submit"
      aria-label={capture.isPending ? 'Saving chore' : 'Capture chore'}
      disabled={capture.isPending || !quickName.trim()}
    >
      <PlusIcon size={17} weight="bold" />
      <span class="hidden sm:inline">{capture.isPending ? 'Saving…' : 'Capture'}</span>
    </Button>
  </form>

  <div class="mt-11 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section class="min-w-0">
      <div class="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Do next</p>
          <h2 class="mt-1 text-xl font-bold">Executable work</h2>
        </div>
        <a href="/inbox" class="flex items-center gap-1 text-sm font-bold text-tk-graphite hover:text-tk-ink">Full inbox <ArrowRightIcon size={15} /></a>
      </div>

      {#if chores.isPending}
        <div class="space-y-2 py-5">
          {#each Array(4) as _}<div class="h-16 animate-pulse rounded-[14px] bg-black/[0.045]"></div>{/each}
        </div>
      {:else if chores.isError}
        <div class="py-10 text-sm text-red-700">Couldn’t load your work. Check the API URL and CORS configuration.</div>
      {:else if nextWork.length === 0}
        <div class="rounded-[18px] border border-dashed border-[var(--border)] bg-white/45 py-14 text-center">
          <p class="text-lg font-bold">The runway is clear.</p>
          <p class="mt-2 text-sm text-tk-graphite">Capture one Chore above. A name is enough.</p>
        </div>
      {:else}
        <div class="rounded-[18px] border border-[var(--border)] bg-white/72 px-4 sm:px-5">
          {#each nextWork as item}
            <WorkItemRow {item} />
          {/each}
        </div>
      {/if}
    </section>

    <aside class="space-y-4">
      {#if !active.data?.session}
        <div class="overflow-hidden rounded-[20px] bg-tk-ink p-6 text-white">
          <div class="mb-10 flex size-10 items-center justify-center rounded-[12px] bg-white/10 text-tk-strike">
            <SparkleIcon size={20} weight="fill" />
          </div>
          <p class="text-xs font-bold uppercase tracking-[0.12em] text-white/45">No active session</p>
          <h2 class="tk-display mt-3 text-2xl font-bold leading-tight">Choose the next thing before choosing the timer.</h2>
          <p class="mt-4 text-sm leading-6 text-white/55">Open a Chore or Sprint and use Plan & Start to generate or edit its Focus Plan before entering execution.</p>
        </div>
      {/if}

      <div class="rounded-[20px] border border-[var(--border)] bg-white/72 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Calendar pressure</p>
            <h2 class="mt-1 font-bold">Coming up</h2>
          </div>
          <a href="/projects" class="text-xs font-bold text-tk-graphite hover:text-tk-ink">Projects</a>
        </div>
        {#if plannedSoon.length}
          <div class="mt-4 space-y-2">
            {#each plannedSoon as item}
              <a href={`/work/${item.id}`} class="block rounded-[13px] bg-[#efefeb] p-3 hover:bg-[#e9e9e3]">
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
