<script lang="ts">
  import { tick } from 'svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import { listWorkItems, type WorkItem } from '$lib/api/work';
  import { kindLabel, cn } from '$lib/utils';

  let { class: className }: { class?: string } = $props();
  let open = $state(false);
  let query = $state('');
  let root = $state<HTMLDivElement | null>(null);
  let input = $state<HTMLInputElement | null>(null);

  const work = createQuery(() => ({
    queryKey: ['work-search'],
    queryFn: () => listWorkItems({ limit: 100 }),
    enabled: open && Boolean(query.trim()),
    staleTime: 30_000
  }));
  const results = $derived(
    (work.data?.items ?? [])
      .filter((item) => {
        const needle = query.trim().toLowerCase();
        return needle && `${item.name} ${item.description ?? ''} ${item.kind}`.toLowerCase().includes(needle);
      })
      .slice(0, 7)
  );
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
  function hide() { open = false; query = ''; }
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
  <button type="button" aria-label="Search work" title="Search work (Ctrl+K)"
    aria-expanded={open}
    class={cn('grid size-10 place-items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] text-tk-graphite transition-colors hover:border-[var(--border-strong)] hover:text-tk-ink', open && 'border-tk-strike/60 text-tk-ink')}
    onclick={() => open ? hide() : void show()}>
    <MagnifyingGlassIcon size={18} />
  </button>

  {#if open}
    <div role="region"
      class="tk-panel absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-[min(31rem,calc(100vw-1.5rem))] rounded-[18px] border border-[var(--border)] p-3 shadow-2xl"
      aria-label="Search Taskiller work">
      <div class="flex items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3">
        <MagnifyingGlassIcon size={17} class="shrink-0 text-tk-graphite" />
        <input bind:this={input} bind:value={query} type="search" name="global-work-search"
          autocomplete="off" spellcheck="false" aria-label="Search Projects, Sprints and Chores"
          placeholder="Search work…" class="h-11 min-w-0 flex-1 bg-transparent text-sm text-tk-ink outline-none placeholder:text-tk-graphite/70" />
        <button type="button" aria-label="Close search" class="grid size-8 place-items-center rounded-lg text-tk-graphite hover:text-tk-ink" onclick={hide}><XIcon size={16} /></button>
      </div>
      {#if !query.trim()}
        <p class="px-2 py-4 text-xs text-tk-graphite">Search Projects, Sprints and Chores. Press Esc to close · Ctrl/⌘+K to reopen.</p>
      {:else if work.isPending}
        <p class="px-2 py-4 text-sm text-tk-graphite">Searching…</p>
      {:else if results.length || guideMatch}
        <div class="mt-2 max-h-[50dvh] overflow-y-auto">
          {#each results as item (item.id)}
            <a href={`/work/${item.id}`} onclick={hide} class="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[var(--surface-subtle)]">
              <span class="min-w-0 flex-1"><span class="block truncate text-sm font-bold">{item.name}</span><span class="mt-0.5 block text-[11px] capitalize text-tk-graphite">{label(item)}</span></span>
              <ArrowUpRightIcon size={14} class="text-tk-graphite" />
            </a>
          {/each}
          {#if guideMatch}
            <a href="/guide" onclick={hide} class="flex items-center gap-3 rounded-[12px] px-3 py-3 hover:bg-[var(--surface-subtle)]">
              <InfoIcon size={18} class="text-tk-strike" /> <span class="text-sm font-bold">Taskiller guide</span>
            </a>
          {/if}
        </div>
      {:else}
        <p class="px-2 py-4 text-sm text-tk-graphite">No matching work. Try another name or keyword.</p>
      {/if}
    </div>
  {/if}
</div>
