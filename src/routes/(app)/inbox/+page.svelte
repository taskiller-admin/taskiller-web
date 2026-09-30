<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import WorkComposer from '$lib/components/work/WorkComposer.svelte';
  import WorkItemRow from '$lib/components/work/WorkItemRow.svelte';
  import { listInboxChores } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { cn } from '$lib/utils';

  type Filter = 'open' | 'draft' | 'ready' | 'in_progress' | 'completed';
  let filter = $state<Filter>('open');

  const inbox = createQuery(() => ({
    queryKey: queryKeys.work.inbox,
    queryFn: listInboxChores
  }));

  const filtered = $derived(
    (inbox.data?.items ?? [])
      .filter((item) => {
        if (filter === 'open') return !['completed', 'cancelled', 'archived'].includes(item.status);
        return item.status === filter;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  );

  const filters: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'draft', label: 'Draft' },
    { value: 'ready', label: 'Ready' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' }
  ];
</script>

<svelte:head><title>Inbox — Taskiller</title></svelte:head>

<div class="tk-page max-w-[1180px]">
  <header class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite"><TrayIcon size={16} /> Unsorted capture</div>
      <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">Inbox</h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-tk-graphite">A holding area, not a guilt wall. Capture now; decide where it belongs when context returns.</p>
    </div>
    <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{inbox.data?.items.length ?? 0} root Chores</span>
  </header>

  <div class="mt-10 max-w-4xl">
    <WorkComposer compact label="Capture" />
  </div>

  <div class="mt-10 flex flex-wrap items-center gap-2">
    <span class="mr-1 flex items-center gap-1.5 text-xs font-bold text-tk-graphite"><FunnelSimpleIcon size={15} />Filter</span>
    {#each filters as option}
      <button
        type="button"
        aria-pressed={filter === option.value}
        class={cn(
          'rounded-[10px] border px-3 py-2 text-xs font-bold transition-[transform,background-color,border-color,color] duration-180 active:scale-[0.98]',
          filter === option.value
            ? 'border-tk-strike/25 bg-tk-strike/10 text-tk-ink'
            : 'border-[var(--border)] bg-[var(--surface)] text-tk-graphite hover:border-[var(--border-strong)] hover:text-tk-ink'
        )}
        onclick={() => (filter = option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  <section class="mt-5">
    {#if inbox.isPending}
      <div class="space-y-2">{#each Array(5) as _}<div class="h-16 animate-pulse rounded-[14px] bg-black/[0.045]"></div>{/each}</div>
    {:else if inbox.isError}
      <p class="py-10 text-sm text-red-700">Couldn’t load Inbox.</p>
    {:else if filtered.length === 0}
      <div class="tk-panel-soft rounded-[20px] border-dashed p-14 text-center">
        <p class="text-lg font-bold">Nothing in this view.</p>
        <p class="mt-2 text-sm text-tk-graphite">Capture something above or switch the filter.</p>
      </div>
    {:else}
      <div class="tk-panel overflow-hidden rounded-[20px] px-3 sm:px-4">
        {#each filtered as item}
          <WorkItemRow {item} />
        {/each}
      </div>
    {/if}
  </section>
</div>
