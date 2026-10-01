<script lang="ts">
  import { onMount } from 'svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import { listWorkItems, type WorkItem } from '$lib/api/work';
  import { kindLabel, cn } from '$lib/utils';

  let { class: className }: { class?: string } = $props();

  let query = $state('');
  let focused = $state(false);
  let input = $state<HTMLInputElement | null>(null);

  const work = createQuery(() => ({
    queryKey: ['work-search'],
    queryFn: () => listWorkItems({ limit: 100 }),
    enabled: focused || Boolean(query.trim()),
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

  function closeSoon() {
    window.setTimeout(() => (focused = false), 120);
  }

  onMount(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  function label(item: WorkItem) {
    return `${kindLabel(item.kind)} · ${item.status.replaceAll('_', ' ')}`;
  }
</script>

<div class={cn('relative', className)} role="search">
  <div class="relative">
    <input
      bind:this={input}
      bind:value={query}
      name="global-work-search"
      autocomplete="off"
      spellcheck="false"
      class="h-10 w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-tk-ink outline-none transition-[border-color,background-color,box-shadow] placeholder:text-tk-graphite/70 hover:border-[var(--border-strong)] focus:border-tk-strike/40 focus:shadow-[0_0_0_3px_rgb(255_99_63/0.07)]"
      aria-label="Search work"
      placeholder="Search work…"
      onfocus={() => (focused = true)}
      onblur={closeSoon}
    />
  </div>

  {#if focused && query.trim()}
    <div class="tk-panel absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-[16px] p-1.5">
      {#if work.isPending}
        <p class="px-3 py-4 text-sm text-tk-graphite">Searching…</p>
      {:else if results.length || guideMatch}
        {#each results as item}
          <a href={`/work/${item.id}`} class="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-[var(--surface-subtle)]">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-bold">{item.name}</span>
              <span class="mt-0.5 block text-[11px] capitalize text-tk-graphite">{label(item)}</span>
            </span>
            <ArrowUpRightIcon class="text-tk-graphite transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={14} aria-hidden="true" />
          </a>
        {/each}
        {#if guideMatch}
          <a href="/guide" class="flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[var(--surface-subtle)]">
            <span class="grid size-8 place-items-center rounded-[9px] bg-tk-strike/10 text-tk-strike"><InfoIcon size={16} /></span>
            <span><span class="block text-sm font-bold">Taskiller guide</span><span class="text-[11px] text-tk-graphite">Examples of every major workflow</span></span>
          </a>
        {/if}
      {:else}
        <div class="px-3 py-5">
          <p class="text-sm font-bold">No matching work.</p>
          <p class="mt-1 text-xs text-tk-graphite">Search Projects, Sprints, and Chores by name.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
