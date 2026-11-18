<script lang="ts">
  import { tick, type Component } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Logo from '$lib/components/brand/Logo.svelte';
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
  const initials = $derived(($auth.user?.displayName || $auth.user?.email || 'T').split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join(''));
  let menu = $state<HTMLDivElement>();
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
      await tick();
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
      await tick();
      window.dispatchEvent(new CustomEvent('taskiller:portable-import-file', { detail: file }));
    } catch { error = 'Could not open your file. Please try again.'; }
    finally { toolsBusy = false; }
  }
  async function signOut() {
    try { await logout(); }
    finally { queryClient.clear(); await goto('/login'); }
  }
</script>

{#if focusMode}
  {@render children?.()}
{:else}
  <a class="tk-skip-link" href="#main-content">Skip to content</a>
  <header class="tk-app-header">
    <div class="mx-auto flex h-17 max-w-[1280px] items-center gap-3 px-4 sm:px-7">
      <a href="/today" class="mr-auto flex min-h-11 shrink-0 items-center lg:mr-6" aria-label="Taskiller Today"><Logo class="h-6 w-auto" /></a>
      <nav class="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary navigation">
        {#each nav as item}
          <a href={item.href} class={`tk-nav-item ${page.url.pathname.startsWith(item.href) ? 'is-active' : ''}`} aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}>
            <item.icon size={18} aria-hidden="true" /><span>{item.label}</span>
          </a>
        {/each}
      </nav>
      <WorkSearch />
      <a href="/inbox?capture=1" class="tk-capture-link" aria-label="Capture work"><PlusIcon size={19} weight="bold" aria-hidden="true" /><span class="hidden sm:inline">Capture</span></a>
      <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-bold hover:border-[var(--border-strong)]" aria-label="Account menu" popovertarget="account-menu">{initials}</button>
      <div bind:this={menu} id="account-menu" popover="auto" class="tk-account-menu">
        <p class="border-b border-[var(--border)] px-3 pb-3 pt-2 text-sm font-semibold">{$auth.user?.displayName || 'Your account'}<span class="mt-1 block truncate text-xs font-normal text-[var(--muted)]">{$auth.user?.email}</span></p>
        <a href="/settings" onclick={() => menu?.hidePopover()}>Settings</a>
        <a href="/settings#profile" onclick={() => menu?.hidePopover()}>Profile</a>
        <a href="/settings#appearance" onclick={() => menu?.hidePopover()}>Appearance</a>
        <a href="/guide" onclick={() => menu?.hidePopover()}>App guide</a>
        <div class="my-1 border-t border-[var(--border)]"></div>
        <button type="button" disabled={toolsBusy} onclick={() => portable('import')}>Import work</button>
        <button type="button" disabled={toolsBusy} onclick={() => portable('export')}>Export work</button>
        <div class="my-1 border-t border-[var(--border)]"></div>
        <button type="button" onclick={signOut}>Sign out</button>
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
{/if}
<input bind:this={importInput} type="file" hidden accept=".json,.zip,application/json,application/zip" onchange={selectImport} aria-label="Select work file to import" />
{#if PortableTools}<section aria-label="Portable work"><PortableTools /></section>{/if}
