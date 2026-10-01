<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery } from '@tanstack/svelte-query';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
  import WorkSearch from '$lib/components/layout/WorkSearch.svelte';
  import FloatingSessionTimer from '$lib/components/execution/FloatingSessionTimer.svelte';
  import { auth, logout } from '$lib/auth/session';
  import { getActiveSession } from '$lib/api/execution';
  import { queryKeys } from '$lib/api/query-keys';
  import { online } from '$lib/pwa/connectivity';
  import { cn } from '$lib/utils';
  import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';

  let { children }: { children?: import('svelte').Snippet } = $props();

  const focusMode = $derived(page.url.pathname.startsWith('/session/'));

  const activeSession = createQuery(() => ({
    queryKey: queryKeys.execution.active,
    queryFn: getActiveSession,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10_000
  }));

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
  <a class="tk-skip-link" href="#main-content">Skip to content</a>

  <div class="min-h-screen">
    <div class="pointer-events-none fixed inset-x-0 top-0 z-50 hidden px-5 xl:block">
      <header class="tk-rail pointer-events-auto mx-auto mt-4 flex h-[64px] max-w-[1320px] items-center gap-2.5 rounded-[18px] px-3">
        <a href="/today" class="flex h-10 shrink-0 items-center px-2" aria-label="Taskiller Today"><Logo class="h-5.5 w-auto" /></a>

        <nav class="ml-1 flex min-w-0 items-center gap-0.5" aria-label="Primary navigation">
          {#each nav as item}
            {@const active = page.url.pathname.startsWith(item.href)}
            <a href={item.href} aria-current={active ? 'page' : undefined} class={cn('tk-nav-item', active && 'is-active')} data-sveltekit-preload-code="hover">
              <item.icon size={17} weight={active ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </a>
          {/each}
        </nav>

        <div class="min-w-0 flex-1"></div>
        <WorkSearch class="w-[220px] 2xl:w-[280px]" />

        <a href="/inbox?capture=1" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] bg-tk-strike px-3 text-xs font-black text-[#24110b] transition-[transform,filter] duration-200 hover:-translate-y-px hover:brightness-105 active:translate-y-0 active:scale-[0.98]">
          <PlusIcon size={16} weight="bold" /> Capture
        </a>

        <a href="/guide" class="grid size-10 shrink-0 place-items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] text-tk-graphite transition-colors hover:text-tk-ink" aria-label="App guide"><InfoIcon size={17} /></a>
        <ThemeToggle compact />
        <a href="/settings" class="grid size-10 shrink-0 place-items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] text-tk-graphite transition-colors hover:text-tk-ink" aria-label="Settings"><GearSixIcon size={17} /></a>
        <a href="/settings#profile" class="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--surface-strong)] text-xs font-black" aria-label="Profile">{initials}</a>
        <Button variant="ghost" size="icon" class="size-10" aria-label="Sign out" onclick={signOut}><SignOutIcon size={16} /></Button>
      </header>
    </div>

    <header class="tk-rail sticky top-0 z-40 rounded-none border-x-0 border-t-0 px-4 py-3 xl:hidden">
      <div class="flex items-center justify-between">
        <a href="/today" aria-label="Taskiller Today"><Logo class="h-5.5 w-auto" /></a>
        <div class="flex items-center gap-2">
          <a href="/guide" class="grid size-10 place-items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] text-tk-graphite" aria-label="App guide"><InfoIcon size={17} /></a>
          <ThemeToggle compact />
          <a href="/inbox?capture=1" class="grid size-10 place-items-center rounded-[11px] bg-tk-strike text-[#24110b]" aria-label="Capture work"><PlusIcon size={18} weight="bold" /></a>
        </div>
      </div>
      <WorkSearch class="mt-2.5 w-full" />
    </header>

    {#if !$online}
      <div class="sticky top-[7.2rem] z-30 border-b border-amber-200 bg-amber-50 px-5 py-2 text-center text-xs font-bold text-amber-900 xl:top-[84px]" role="status" aria-live="polite">
        Offline — loaded data stays visible, but server actions are paused until you reconnect.
      </div>
    {/if}

    <main id="main-content" tabindex="-1" class="min-w-0 pb-24 outline-none xl:pt-[84px] xl:pb-0">{@render children?.()}</main>

    {#if activeSession.data?.session}
      <FloatingSessionTimer session={activeSession.data.session} />
    {/if}

    <nav class="tk-rail fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-[18px] p-1.5 xl:hidden" aria-label="Mobile navigation">
      {#each nav as item}
        {@const active = page.url.pathname.startsWith(item.href)}
        <a href={item.href} aria-current={active ? 'page' : undefined} class={cn('relative flex flex-col items-center gap-1 rounded-[13px] py-2 text-[10px] font-bold text-tk-graphite transition-[background-color,color,transform] duration-180 active:scale-[0.97]', active && 'bg-[var(--surface-strong)] text-tk-ink')}>
          <item.icon size={19} weight={active ? 'fill' : 'regular'} />
          {item.label}
          {#if active}<span class="absolute bottom-1 h-0.5 w-4 rounded-full bg-tk-strike"></span>{/if}
        </a>
      {/each}
    </nav>
  </div>
{/if}
