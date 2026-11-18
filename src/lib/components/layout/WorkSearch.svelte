<script lang="ts">
  import { tick } from 'svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import { listAllWorkItems, type WorkItem } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { kindLabel, cn } from '$lib/utils';

  let { class: className }: { class?: string } = $props();
  let open = $state(false);
  let query = $state('');
  let root = $state<HTMLDivElement | null>(null);
  let input = $state<HTMLInputElement | null>(null);
  let trigger = $state<HTMLButtonElement | null>(null);
  let visibleCount = $state(10);

  const work = createQuery(() => ({
    queryKey: queryKeys.work.search,
    queryFn: () => listAllWorkItems(),
    enabled: open && Boolean(query.trim()),
    staleTime: 30_000
  }));
  const results = $derived(
    (work.data?.items ?? [])
      .filter((item) => {
        const needle = query.trim().toLowerCase();
        return needle && `${item.name} ${item.description ?? ''} ${item.kind}`.toLowerCase().includes(needle);
      })
  );
  const visibleResults = $derived(results.slice(0, visibleCount));
  $effect(() => { query; visibleCount = 10; });
  const guideMatch = $derived(
    Boolean(query.trim()) &&
    ['guide', 'help', 'tutorial', 'how'].some((word) => word.includes(query.trim().toLowerCase()) || query.trim().toLowerCase().includes(word))
  );

  async function show() {
    if (open) { input?.focus(); return; }
    open = true;
    await tick();
    input?.focus();
  }
  function hide() { open = false; query = ''; trigger?.focus(); }
  function onKeydown(event: KeyboardEvent) {
    // Only the visible desktop/mobile instance handles the shortcut.
    if (!root?.getClientRects().length) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (open) input?.focus(); else void show();
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      hide();
    }
  }
  function onOutsideClick(event: MouseEvent) {
    if (open && event.target instanceof Node && root && !root.contains(event.target)) hide();
  }
  function label(item: WorkItem) {
    return `${kindLabel(item.kind)} · ${item.status.replaceAll('_', ' ')}`;
  }
</script>

<svelte:window onkeydown={onKeydown} onclick={onOutsideClick} />

<div bind:this={root} class={cn('relative shrink-0', className)} role="search">
  <button bind:this={trigger} type="button" aria-label="Search work" title="Search work (Ctrl+K)"
    aria-expanded={open}
    class={cn('grid size-11 place-items-center rounded-[10px] text-tk-graphite transition-colors hover:bg-[var(--surface-subtle)]', open && 'bg-[var(--surface-subtle)]')}
    onclick={() => open ? hide() : void show()}>
    <MagnifyingGlassIcon size={18} aria-hidden="true" />
  </button>

  {#if open}
    <div role="region"
      class="tk-panel fixed inset-x-3 top-[calc(4.75rem+env(safe-area-inset-top))] z-[90] max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain rounded-[14px] p-3 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(31rem,calc(100vw-2rem))]"
      aria-label="Search Taskiller work">
      <div class="flex items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3">
        <MagnifyingGlassIcon size={17} class="shrink-0 text-tk-graphite" aria-hidden="true" />
        <input bind:this={input} bind:value={query} type="search" name="global-work-search"
          autocomplete="off" spellcheck="false" aria-label="Search Projects, Sprints and Chores"
          placeholder="Search work…" class="h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)]" />
        <button type="button" aria-label="Close search" class="grid size-11 place-items-center rounded-lg text-tk-graphite hover:text-[var(--foreground)]" onclick={hide}><XIcon size={16} aria-hidden="true" /></button>
      </div>
      {#if !query.trim()}
        <p class="px-2 py-4 text-xs text-tk-graphite">Search Projects, Sprints and Chores. Press Esc to close · Ctrl/⌘+K to reopen.</p>
      {:else if work.isPending}
        <p class="px-2 py-4 text-sm text-tk-graphite" role="status">Searching your work…</p>
      {:else if work.isError}
        <div class="px-2 py-4 text-sm" role="alert">Couldn’t search your work. <button type="button" class="min-h-11 px-2 font-semibold underline" onclick={() => work.refetch()}>Retry search</button></div>
      {:else if results.length || guideMatch}
        <div class="mt-2 max-h-[50dvh] overflow-y-auto">
          <p class="px-3 py-2 text-xs text-tk-graphite" role="status">{results.length} matching {results.length === 1 ? 'item' : 'items'}</p>
          {#each visibleResults as item (item.id)}
            <a href={`/work/${item.id}`} onclick={hide} class="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[var(--surface-subtle)]">
              <span class="min-w-0 flex-1"><span class="block truncate text-sm font-bold">{item.name}</span><span class="mt-0.5 block text-[11px] capitalize text-tk-graphite">{label(item)}</span></span>
              <ArrowUpRightIcon size={14} class="text-tk-graphite" aria-hidden="true" />
            </a>
          {/each}
          {#if results.length > visibleCount}<button type="button" class="min-h-11 w-full rounded-lg px-3 text-sm font-semibold hover:bg-[var(--surface-subtle)]" onclick={() => visibleCount += 20}>Show more results ({results.length - visibleCount} remaining)</button>{/if}
          {#if guideMatch}
            <a href="/guide" onclick={hide} class="flex items-center gap-3 rounded-[12px] px-3 py-3 hover:bg-[var(--surface-subtle)]">
              <InfoIcon size={18} class="text-tk-strike" aria-hidden="true" /> <span class="text-sm font-bold">Taskiller guide</span>
            </a>
          {/if}
        </div>
      {:else}
        <p class="px-2 py-4 text-sm text-tk-graphite">No matching work. Try another name or keyword.</p>
      {/if}
    </div>
  {/if}
</div>
