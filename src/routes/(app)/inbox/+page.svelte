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

<div class="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="flex flex-wrap items-end justify-between gap-5">
    <div>
      <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite">
        <TrayIcon size={15} /> Unsorted capture
      </div>
      <h1 class="tk-display text-5xl font-extrabold sm:text-6xl">Inbox</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">A holding area, not a guilt wall. Capture first; decide where it belongs when you have the context.</p>
    </div>
    <div class="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5 text-sm text-tk-graphite">{inbox.data?.items.length ?? 0} root chores</div>
  </header>

  <div class="mt-9 max-w-3xl">
    <WorkComposer compact label="Capture" />
  </div>

  <div class="mt-10 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-4">
    <FunnelSimpleIcon size={16} class="mr-1 text-tk-graphite" />
    {#each filters as option}
      <button
        type="button"
        class={cn(
          'rounded-full px-3 py-1.5 text-xs font-bold transition',
          filter === option.value ? 'bg-tk-ink text-white' : 'bg-white/65 text-tk-graphite hover:bg-white hover:text-tk-ink'
        )}
        onclick={() => (filter = option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  <section class="mt-5">
    {#if inbox.isPending}
      <div class="space-y-2">
        {#each Array(5) as _}<div class="h-16 animate-pulse rounded-[14px] bg-black/[0.045]"></div>{/each}
      </div>
    {:else if inbox.isError}
      <p class="py-10 text-sm text-red-700">Couldn’t load Inbox.</p>
    {:else if filtered.length === 0}
      <div class="rounded-[20px] border border-dashed border-[var(--border)] bg-white/45 p-12 text-center">
        <p class="text-lg font-bold">Nothing in this view.</p>
        <p class="mt-2 text-sm text-tk-graphite">Capture something above or switch filters.</p>
      </div>
    {:else}
      <div class="rounded-[20px] border border-[var(--border)] bg-white/72 px-4 sm:px-5">
        {#each filtered as item}
          <WorkItemRow {item} />
        {/each}
      </div>
    {/if}
  </section>
</div>
