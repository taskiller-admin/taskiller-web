<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { auth, logout } from '$lib/auth/session';
  import { cn } from '$lib/utils';
  import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';

  let { children }: { children?: import('svelte').Snippet } = $props();

  const focusMode = $derived(page.url.pathname.startsWith('/session/'));

  const nav = [
    { href: '/today', label: 'Today', icon: HouseIcon },
    { href: '/inbox', label: 'Inbox', icon: TrayIcon },
    { href: '/projects', label: 'Projects', icon: FolderSimpleIcon },
    { href: '/history', label: 'History', icon: ClockCounterClockwiseIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartLineUpIcon }
  ];

  const initials = $derived(
    ($auth.user?.displayName || $auth.user?.email || 'T')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  );

  async function signOut() {
    await logout();
    await goto('/login');
  }
</script>

{#if focusMode}
  {@render children?.()}
{:else}
<div class="min-h-screen lg:grid lg:grid-cols-[246px_minmax(0,1fr)]">
  <aside class="sticky top-0 hidden h-screen border-r border-[var(--border)] bg-white/72 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
    <div class="flex h-12 items-center px-2">
      <Logo class="h-6 w-auto" />
    </div>

    <a href="/inbox?capture=1" class="mt-6 flex h-11 items-center justify-center gap-2 rounded-[13px] bg-tk-ink px-4 text-sm font-bold text-white transition hover:bg-black">
      <PlusIcon size={17} weight="bold" /> Capture work
    </a>

    <nav class="mt-7 space-y-1" aria-label="Primary navigation">
      {#each nav as item}
        <a
          href={item.href}
          class={cn(
            'group relative flex h-11 items-center gap-3 rounded-[13px] px-3.5 text-sm font-semibold text-tk-graphite transition hover:bg-black/[0.04] hover:text-tk-ink',
            page.url.pathname.startsWith(item.href) && 'bg-black/[0.055] text-tk-ink'
          )}
        >
          {#if page.url.pathname.startsWith(item.href)}
            <span class="absolute left-0 h-5 w-[3px] rounded-full bg-tk-strike"></span>
          {/if}
          <item.icon size={19} weight={page.url.pathname.startsWith(item.href) ? 'fill' : 'regular'} />
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="mt-auto">
      <a href="/settings" class="flex h-10 items-center gap-3 rounded-[12px] px-3.5 text-sm font-semibold text-tk-graphite hover:bg-black/[0.04] hover:text-tk-ink">
        <GearSixIcon size={18} /> Settings
      </a>
      <div class="mt-3 flex items-center gap-3 rounded-[15px] border border-[var(--border)] bg-white p-2.5">
        <div class="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#ecece7] text-xs font-black">{initials}</div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold">{$auth.user?.displayName || 'Taskiller user'}</p>
          <p class="truncate text-[11px] text-tk-graphite">{$auth.user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" class="size-8" aria-label="Sign out" onclick={signOut}>
          <SignOutIcon size={16} />
        </Button>
      </div>
    </div>
  </aside>

  <div class="min-w-0">
    <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[rgb(245_245_242/0.82)] px-5 backdrop-blur-xl lg:hidden">
      <Logo class="h-6 w-auto" />
      <a href="/inbox?capture=1" class="grid size-10 place-items-center rounded-[12px] bg-tk-ink text-white" aria-label="Capture work">
        <PlusIcon size={18} weight="bold" />
      </a>
    </header>

    <main class="min-w-0 pb-24 lg:pb-0">{@render children?.()}</main>
  </div>

  <nav class="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[18px] border border-black/[0.08] bg-white/92 p-1.5 shadow-[0_16px_50px_rgb(23_23_23/0.15)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
    {#each nav as item}
      <a
        href={item.href}
        class={cn(
          'flex flex-col items-center gap-1 rounded-[13px] py-2 text-[10px] font-bold text-tk-graphite transition',
          page.url.pathname.startsWith(item.href) && 'bg-[#eeeeea] text-tk-ink'
        )}
      >
        <item.icon size={20} weight={page.url.pathname.startsWith(item.href) ? 'fill' : 'regular'} />
        {item.label}
      </a>
    {/each}
  </nav>
</div>

{/if}
