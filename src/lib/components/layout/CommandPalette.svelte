<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, scale } from 'svelte/transition';
  import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let query = $state('');
  let search: HTMLInputElement;

  const commands = [
    { label: 'Today', detail: 'Execution runway', href: '/today', icon: HouseIcon },
    { label: 'Capture work', detail: 'Add a Chore quickly', href: '/inbox?capture=1', icon: PlusIcon },
    { label: 'Inbox', detail: 'Unsorted Chores', href: '/inbox', icon: TrayIcon },
    { label: 'Projects', detail: 'Projects, Sprints & Chores', href: '/projects', icon: FolderSimpleIcon },
    { label: 'History', detail: 'Past execution sessions', href: '/history', icon: ClockCounterClockwiseIcon },
    { label: 'Analytics', detail: 'Observed execution patterns', href: '/analytics', icon: ChartLineUpIcon },
    { label: 'Settings', detail: 'Account, appearance & data', href: '/settings', icon: GearSixIcon }
  ];

  const filtered = $derived(
    commands.filter((command) =>
      `${command.label} ${command.detail}`.toLowerCase().includes(query.trim().toLowerCase())
    )
  );

  async function choose(href: string) {
    open = false;
    query = '';
    await goto(href);
  }

  $effect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    void tick().then(() => search?.focus());
    return () => {
      document.body.style.overflow = '';
    };
  });

  onMount(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        open = !open;
      }
      if (event.key === 'Escape' && open) open = false;
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
</script>

{#if open}
  <div class="fixed inset-0 z-[90] grid place-items-start px-4 pt-[12vh] sm:pt-[16vh]" transition:fade={{ duration: 120 }}>
    <button
      type="button"
      class="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[6px]"
      aria-label="Close command palette"
      onclick={() => (open = false)}
    ></button>

    <section
      role="dialog"
      aria-modal="true"
      aria-label="Taskiller command palette"
      class="tk-rail relative z-10 w-full max-w-xl overflow-hidden rounded-[22px]"
      transition:scale={{ duration: 180, start: 0.97 }}
    >
      <div class="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <span class="tk-theme-glyph text-tk-strike" aria-hidden="true"></span>
        <input
          bind:this={search}
          bind:value={query}
          name="command-search"
          autocomplete="off"
          spellcheck="false"
          class="h-10 min-w-0 flex-1 bg-transparent text-base font-semibold text-tk-ink outline-none placeholder:text-tk-graphite"
          aria-label="Search commands"
          placeholder="Jump somewhere or start something…"
        />
        <kbd class="hidden rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-[10px] font-bold text-tk-graphite sm:block">Esc</kbd>
      </div>

      <div class="max-h-[56vh] overflow-y-auto p-2 overscroll-contain">
        {#if filtered.length}
          {#each filtered as command}
            <button
              type="button"
              class="group flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition-[background-color,transform] duration-150 hover:bg-[var(--surface-subtle)] active:scale-[0.99]"
              onclick={() => choose(command.href)}
            >
              <span class="grid size-9 place-items-center rounded-[11px] bg-[var(--surface-subtle)] text-tk-graphite transition-colors group-hover:text-tk-strike">
                <command.icon size={18} />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-bold">{command.label}</span>
                <span class="mt-0.5 block truncate text-xs text-tk-graphite">{command.detail}</span>
              </span>
            </button>
          {/each}
        {:else}
          <div class="px-4 py-10 text-center">
            <p class="font-bold">No matching command.</p>
            <p class="mt-1 text-sm text-tk-graphite">Try a page name or “capture”.</p>
          </div>
        {/if}
      </div>

      <div class="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-[11px] text-tk-graphite">
        <span>Taskiller command rail</span>
        <span>⌘/Ctrl&nbsp;K</span>
      </div>
    </section>
  </div>
{/if}
