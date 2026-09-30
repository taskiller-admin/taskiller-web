<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import CircleIcon from 'phosphor-svelte/lib/CircleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ActiveSessionCard from '$lib/components/execution/ActiveSessionCard.svelte';
  import { listChores, quickCaptureChore } from '$lib/api/work';
  import { getActiveSession } from '$lib/api/execution';
  import { queryKeys } from '$lib/api/query-keys';
  import { formatDuration } from '$lib/utils';

  const queryClient = useQueryClient();
  let quickName = $state('');
  let captureOpen = $state(false);

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
      quickName = ''; captureOpen = false;
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
    }
  }));

  const visibleChores = $derived(
    (chores.data?.items ?? [])
      .filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status))
      .sort((a, b) => {
        const rank = { in_progress: 0, ready: 1, draft: 2 } as Record<string, number>;
        return (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || (b.priority ?? 0) - (a.priority ?? 0);
      })
      .slice(0, 6)
  );

  async function submitQuickCapture(event: SubmitEvent) {
    event.preventDefault();
    const name = quickName.trim();
    if (name) capture.mutate(name);
  }
</script>

<svelte:head><title>Today — Taskiller</title></svelte:head>
<div class="mx-auto max-w-[1160px] px-5 py-7 sm:px-8 lg:px-14 lg:py-14">
  <header class="flex items-start justify-between gap-6">
    <div><h1 class="tk-display text-5xl font-black sm:text-6xl">Today</h1><p class="mt-2 text-base text-tk-graphite sm:text-lg">Choose the next executable piece of work.</p></div>
    <Button class="hidden min-w-48 sm:inline-flex" size="lg" onclick={() => (captureOpen = !captureOpen)}><PlusIcon size={20} weight="bold" /> Create task</Button>
  </header>

  {#if captureOpen}
    <form class="mt-8 flex max-w-2xl gap-2 rounded-[14px] border border-tk-mist bg-white p-2" onsubmit={submitQuickCapture}>
      <Input class="border-0 bg-transparent focus:ring-0" placeholder="What needs to be done?" bind:value={quickName} autofocus />
      <Button type="submit" disabled={capture.isPending || !quickName.trim()}>{capture.isPending ? 'Saving…' : 'Add to Inbox'}</Button>
    </form>
  {/if}

  <div class="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_342px]">
    <section>
      <div class="flex items-center justify-between border-b border-tk-mist pb-4"><h2 class="text-xl font-bold">Next work</h2><span class="text-sm text-tk-graphite">{visibleChores.length} shown</span></div>
      {#if chores.isPending}
        <div class="space-y-4 py-6">{#each Array(3) as _}<div class="h-20 animate-pulse rounded-[12px] bg-tk-mist/50"></div>{/each}</div>
      {:else if chores.isError}
        <p class="py-8 text-sm text-red-700">Couldn’t load your work. Check the API URL/CORS and retry.</p>
      {:else if visibleChores.length === 0}
        <div class="py-14 text-center"><p class="text-lg font-semibold">Nothing queued yet.</p><p class="mt-2 text-sm text-tk-graphite">Capture a Chore now; advanced fields can wait.</p><Button class="mt-6 sm:hidden" onclick={() => (captureOpen = true)}><PlusIcon size={18} /> Create task</Button></div>
      {:else}
        <div>
          {#each visibleChores as item}
            <a href={`/work/${item.id}`} class="grid grid-cols-[28px_1fr_auto] items-center gap-4 border-b border-tk-mist py-5 transition hover:bg-white/50 sm:px-1">
              <CircleIcon size={24} class="text-tk-graphite" />
              <div class="min-w-0"><p class="truncate font-semibold">{item.name}</p><p class="mt-1 text-sm capitalize text-tk-graphite">{item.status.replace('_', ' ')}</p></div>
              <span class="tk-mono text-sm text-tk-graphite">{formatDuration(item.estimatedEffortSeconds)}</span>
            </a>
          {/each}
        </div>
      {/if}

      <section class="mt-14"><h2 class="mb-5 text-xl font-bold">Focus plan</h2><div class="grid gap-3 sm:grid-cols-3"><div class="rounded-[12px] border border-tk-mist bg-white p-5"><b>Work</b><p class="tk-mono mt-3 text-sm text-tk-graphite">45m</p></div><div class="rounded-[12px] border border-tk-mist bg-white p-5"><b>Break</b><p class="tk-mono mt-3 text-sm text-tk-graphite">8m</p></div><div class="rounded-[12px] border border-tk-mist bg-white p-5"><b>Review</b><p class="tk-mono mt-3 text-sm text-tk-graphite">5m</p></div></div></section>
    </section>

    <aside>
      {#if active.isPending}<div class="h-[360px] animate-pulse rounded-[18px] bg-tk-ink/90"></div>
      {:else if active.data?.session}<ActiveSessionCard session={active.data.session} />
      {:else}<div class="rounded-[18px] border border-tk-mist bg-white p-8"><p class="text-sm font-semibold text-tk-graphite">No active session</p><h2 class="tk-display mt-4 text-2xl font-bold">Pick the next thing and start deliberately.</h2><p class="mt-4 text-sm leading-6 text-tk-graphite">Plan & Start arrives in Round 3. The active-session client is already wired to the backend.</p></div>{/if}
    </aside>
  </div>

  <Button class="fixed bottom-20 right-5 rounded-full shadow-lg sm:hidden" size="lg" onclick={() => (captureOpen = true)}><PlusIcon size={20} /> Task</Button>
</div>
