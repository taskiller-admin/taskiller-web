<script lang="ts">
  import MotionToggle from '$lib/components/theme/MotionToggle.svelte';
  import { tick, type Component } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import BookOpenIcon from 'phosphor-svelte/lib/BookOpenIcon';
  import WorkSearch from './WorkSearch.svelte';
  import FloatingSessionTimer from '$lib/components/execution/FloatingSessionTimer.svelte';
  import { auth, logout } from '$lib/auth/session';
  import { getActiveSession } from '$lib/api/execution';
  import { queryKeys } from '$lib/api/query-keys';
  import { online } from '$lib/pwa/connectivity';
  import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';

  let { children }: { children?: import('svelte').Snippet } = $props();
  const focusMode = $derived(page.url.pathname.startsWith('/session/'));
  const queryClient = useQueryClient();
  const active = createQuery(() => ({ queryKey: queryKeys.execution.active, queryFn: getActiveSession, staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 15_000 }));
  const nav = [
    { href: '/today', label: 'Today', icon: HouseIcon },
    { href: '/inbox', label: 'Inbox', icon: TrayIcon },
    { href: '/projects', label: 'Projects', icon: FolderSimpleIcon },
    { href: '/history', label: 'History', icon: ClockCounterClockwiseIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartLineUpIcon }
  ];
  const currentPage = $derived(nav.find(item => page.url.pathname.startsWith(item.href))?.label ?? (page.url.pathname.startsWith('/settings') ? 'Settings' : page.url.pathname.startsWith('/guide') ? 'App guide' : 'Your work'));
  let signingOut = $state(false);
  let menu = $state<HTMLDivElement>();
  let accountTrigger = $state<HTMLButtonElement>();
  let PortableTools = $state<Component | null>(null);
  let toolsBusy = $state(false);
  let error = $state('');
  let importInput: HTMLInputElement;
  async function portable(kind: 'import' | 'export') {
    menu?.hidePopover();
    // Keep the native file picker inside the user's click, before loading tools.
    if (kind === 'import') { importInput.click(); return; }
    toolsBusy = true;
    error = '';
    try {
      PortableTools ??= (await import('$lib/components/settings/PortableWorkSettings.svelte')).default;
      toolsBusy = false;
      await tick();
      accountTrigger?.focus();
      window.dispatchEvent(new Event(`taskiller:portable-${kind}`));
    } catch { error = 'Could not open work files. Please try again.'; }
    finally { toolsBusy = false; }
  }
  async function selectImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    error = '';
    toolsBusy = true;
    try {
      PortableTools ??= (await import('$lib/components/settings/PortableWorkSettings.svelte')).default;
      toolsBusy = false;
      await tick();
      accountTrigger?.focus();
      window.dispatchEvent(new CustomEvent('taskiller:portable-import-file', { detail: file }));
    } catch { error = 'Could not open your file. Please try again.'; }
    finally { toolsBusy = false; }
  }
  async function signOut() {
    if (signingOut) return;
    signingOut = true;
    menu?.hidePopover();
    try { await logout(); }
    finally { queryClient.clear(); await goto('/login'); signingOut = false; }
  }
</script>

{#if focusMode}
  {@render children?.()}
{:else}
  <a class="tk-skip-link" href="#main-content">Skip to content</a>
  <aside class="tk-sidebar" aria-label="Workspace sidebar" inert={toolsBusy}>
    <a href="/today" class="tk-sidebar-brand" aria-label="Taskiller Today"><Logo inverse class="h-7 w-auto" /></a>
    <p class="px-4 pb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#8fa8c8]">Your workspace</p>
    <nav aria-label="Primary navigation">
      {#each nav as item}
        <a href={item.href} class={`tk-nav-item ${page.url.pathname.startsWith(item.href) ? 'is-active' : ''}`} aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}>
          <item.icon size={20} weight={page.url.pathname.startsWith(item.href) ? 'fill' : 'regular'} aria-hidden="true" /><span>{item.label}</span>
        </a>
      {/each}
    </nav>
    <div class="tk-sidebar-focus mt-8 overflow-hidden rounded-[18px] border border-[#39516e] p-5">
      <div class="tk-mini-orbit" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
      <p class="mt-3 text-sm font-bold">One thing at a time.</p>
      <p class="mt-2 text-xs leading-5 text-[#b3c6df]">A little structure.<br />Room to focus.</p>
      <a href="/projects?kind=chore" class="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-[#ffac96] hover:text-white">Find your next Chore <span aria-hidden="true" class="ml-2">↗</span></a>
    </div>
    <div class="mt-auto border-t border-[#314966] pt-5">
      <a href="/settings" class={`tk-nav-item ${page.url.pathname.startsWith('/settings') ? 'is-active' : ''}`}><GearSixIcon size={20} aria-hidden="true" />Workspace settings</a>
      <a href="/guide" class={`tk-nav-item ${page.url.pathname.startsWith('/guide') ? 'is-active' : ''}`}><BookOpenIcon size={20} aria-hidden="true" />Guide</a>
      <p class="px-4 pb-1 pt-3 text-[10px] tracking-wide text-[#8fa8c8]">MAKE SPACE. BUILD MOMENTUM.</p>
    </div>
  </aside>
  <div class="tk-app-frame" inert={toolsBusy}>
  <header class="tk-app-header">
    <div class="mx-auto flex h-17 max-w-[1280px] items-center gap-3 px-4 sm:px-7">
      <a href="/today" class="mr-auto flex min-h-11 shrink-0 items-center lg:hidden" aria-label="Taskiller Today"><Logo class="h-6 w-auto" /></a>
      <div class="mr-auto hidden items-center gap-3 text-xs lg:flex"><span class="text-[var(--muted)]">Workspace</span><span class="text-[var(--border-strong)]" aria-hidden="true">/</span><span class="font-bold">{currentPage}</span><span class="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] text-[var(--muted)]"><span class="tk-online-dot" aria-hidden="true"></span>{$online ? 'Connected' : 'Offline'}</span></div>
      <MotionToggle />
      <WorkSearch />
      <a href="/inbox?capture=1" class="tk-capture-link" aria-label="Capture work"><PlusIcon size={19} weight="bold" aria-hidden="true" /><span class="hidden sm:inline">Capture</span></a>
      <button bind:this={accountTrigger} type="button" class="tk-account-trigger grid size-11 shrink-0 place-items-center" aria-label="Account menu" popovertarget="account-menu"><Avatar seed={$auth.user?.id ?? 'taskiller'} size={34} /></button>
      <div bind:this={menu} id="account-menu" popover="auto" class="tk-account-menu">
        <div class="flex items-center gap-3 border-b border-[var(--border)] px-3 pb-3 pt-2"><Avatar seed={$auth.user?.id ?? 'taskiller'} size={42} /><p class="min-w-0 text-sm font-semibold">{$auth.user?.displayName || 'Your account'}<span class="mt-1 block truncate text-xs font-normal text-[var(--muted)]">{$auth.user?.email}</span></p></div>
        <a href="/settings" onclick={() => menu?.hidePopover()}>Settings</a>
        <a href="/settings#profile" onclick={() => menu?.hidePopover()}>Profile</a>
        <a href="/settings#appearance" onclick={() => menu?.hidePopover()}>Appearance</a>
        <a href="/guide" onclick={() => menu?.hidePopover()}>App guide</a>
        <div class="my-1 border-t border-[var(--border)]"></div>
        <button type="button" disabled={toolsBusy} onclick={() => portable('import')}>Import work</button>
        <button type="button" disabled={toolsBusy} onclick={() => portable('export')}>Export work</button>
        <div class="my-1 border-t border-[var(--border)]"></div>
        <button type="button" disabled={signingOut} aria-busy={signingOut} onclick={signOut}>{#if signingOut}<Spinner size={16} />{/if}Sign out</button>
      </div>
    </div>
  </header>
  {#if !$online}<div class="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-center text-sm" role="status">You’re offline. Your loaded work stays here; reconnect to make changes.</div>{/if}
  {#if error}<p role="alert" class="mx-auto max-w-5xl px-5 py-3 text-[var(--danger-text)]">{error}</p>{/if}
  <main id="main-content" tabindex="-1" class="tk-workspace min-w-0 pb-[calc(7rem+env(safe-area-inset-bottom))] outline-none lg:pb-0">{@render children?.()}</main>
  {#if active.data?.session}<FloatingSessionTimer session={active.data.session} />{/if}
  <nav class="tk-mobile-nav" aria-label="Mobile navigation">
    {#each nav as item}
      <a href={item.href} class:active={page.url.pathname.startsWith(item.href)} aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}>
        <item.icon size={21} weight={page.url.pathname.startsWith(item.href) ? 'fill' : 'regular'} aria-hidden="true" />{item.label}
      </a>
    {/each}
  </nav>
  </div>
{/if}
<input bind:this={importInput} type="file" hidden accept=".json,.zip,application/json,application/zip" onchange={selectImport} aria-label="Select work file to import" />
{#if toolsBusy}<div class="tk-operation-overlay" role="status"><div class="tk-operation-card"><Spinner size={28} /><p class="tk-display text-lg">Opening your work files</p></div></div>{/if}
{#if PortableTools}<section aria-label="Portable work"><PortableTools /></section>{/if}
