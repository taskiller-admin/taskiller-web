<script lang="ts">
  import { fade } from 'svelte/transition';

  function panelDuration() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
  }

  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery } from '@tanstack/svelte-query';
  import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import WorkComposer from '$lib/components/work/WorkComposer.svelte';
  import WorkItemRow from '$lib/components/work/WorkItemRow.svelte';
  import { listInboxChores } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { cn } from '$lib/utils';

  type Filter = 'open' | 'draft' | 'ready' | 'in_progress' | 'completed';
  const filter = $derived<Filter>(['open', 'draft', 'ready', 'in_progress', 'completed'].includes(page.url.searchParams.get('filter') ?? '') ? page.url.searchParams.get('filter') as Filter : 'open');
  function selectFilter(value: Filter) {
    const url = new URL(page.url);
    url.searchParams.set('filter', value);
    void goto(url, { keepFocus: true, noScroll: true });
  }

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
  <header class="tk-page-intro grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <div class="tk-eyebrow mb-2 flex items-center gap-2 text-sm font-semibold text-tk-graphite"><span class="tk-feature-icon" aria-hidden="true"><TrayIcon size={16} aria-hidden="true" /></span> Unsorted capture</div>
      <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">Inbox</h1>
      <p class="mt-2 max-w-2xl text-base leading-7 text-tk-graphite">Capture Chores here, then organize or plan them when you are ready.</p>
    </div>
    <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{inbox.data?.items.length ?? 0} root Chores</span>
  </header>

  <div class="mt-6 max-w-4xl">
    <WorkComposer compact label="Capture" />
  </div>

  <div class="mt-6 flex flex-wrap items-center gap-2">
    <span class="mr-1 flex items-center gap-1.5 text-xs font-bold text-tk-graphite"><FunnelSimpleIcon size={15} aria-hidden="true" />Filter</span>
    {#each filters as option}
      <button
        type="button"
        aria-pressed={filter === option.value}
        class={cn(
          'min-h-11 rounded-[10px] border px-3 py-2 text-xs font-bold transition-[transform,background-color,border-color,color] duration-180 active:scale-[0.98]',
          filter === option.value
            ? 'border-tk-strike/25 bg-tk-strike/10 text-[var(--foreground)]'
            : 'border-[var(--border)] bg-[var(--surface)] text-tk-graphite hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
        )}
        onclick={() => selectFilter(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  <section class="mt-5">
    {#if inbox.isPending}
      <div class="space-y-2">{#each Array(5) as _}<div class="h-16 animate-pulse rounded-[14px] bg-[var(--surface-subtle)]"></div>{/each}</div>
    {:else if inbox.isError}
      <p class="py-10 text-sm text-[var(--danger-text)]" role="alert">Couldn’t load Inbox. <button type="button" class="underline" onclick={() => inbox.refetch()}>Retry</button></p>
    {:else if filtered.length === 0}
      <div transition:fade={{ duration: panelDuration() }} class="tk-panel tk-empty-state rounded-[24px] p-14 text-center">
        <span class="tk-feature-icon mx-auto mb-5" aria-hidden="true"><TrayIcon size={25} /></span>
        <p class="text-lg font-bold">Nothing in this view.</p>
        <p class="mt-2 text-sm text-tk-graphite">Capture something above or switch the filter.</p>
      </div>
    {:else}
      <div class="tk-panel overflow-hidden rounded-[14px] px-3 sm:px-4">
        {#each filtered as item (item.id)}
          <div transition:fade={{ duration: panelDuration() }}><WorkItemRow {item} showExport /></div>
        {/each}
      </div>
    {/if}
  </section>
</div>
