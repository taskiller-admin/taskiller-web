<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
  import UsersThreeIcon from 'phosphor-svelte/lib/UsersThreeIcon';
  import QueueIcon from 'phosphor-svelte/lib/QueueIcon';
  import LockKeyIcon from 'phosphor-svelte/lib/LockKeyIcon';
  import ListChecksIcon from 'phosphor-svelte/lib/ListChecksIcon';
  import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
  import { adminMessage, adminRequest } from '$lib/api/admin/client';
  import { navItems, validStaff } from '$lib/api/admin/contract';
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  let leaving = $state(false);
  let hidden = $state(false);
  let message = $state('');
  let idleDeadline = $state<number>();
  let checking = false;
  const icons = {
    '': ChartBarIcon, users: UsersThreeIcon, operations: QueueIcon,
    privacy: LockKeyIcon, audit: ListChecksIcon, staff: ShieldCheckIcon
  };

  function access(event: Event) {
    if ((event as CustomEvent<number>).detail === 401) {
      hidden = true;
      void goto('/admin/login', { replaceState: true, invalidateAll: true });
    } else void check();
  }

  onMount(() => {
    const listener = (event: Event) => access(event);
    window.addEventListener('taskiller:admin-access', listener);
    return () => window.removeEventListener('taskiller:admin-access', listener);
  });

  async function check() {
    if (checking || leaving) return;
    checking = true;
    try {
      const { data: staff } = await adminRequest<unknown>('me');
      if (!validStaff(staff)) throw new Error('Invalid staff response');
      if (leaving) return;
      idleDeadline = Date.parse(staff.idleExpiresAt);
      if (staff.staffId !== data.staff.staffId || staff.capabilities.slice().sort().join() !== data.staff.capabilities.slice().sort().join()) {
        hidden = true;
        await invalidateAll();
        hidden = false;
      }
      message = '';
      hidden = false;
    } catch { hidden = true; message = 'Staff access could not be verified. Reload to continue.'; }
    finally { checking = false; }
  }

  $effect(() => {
    const absolute = Date.parse(data.staff.expiresAt);
    const idle = Math.max(Date.parse(data.staff.idleExpiresAt), idleDeadline ?? 0);
    const remaining = Math.max(0, Math.min(absolute, idle) - Date.now());
    if (remaining > 2_147_483_000) return;
    const timer = setTimeout(() => {
      if (Date.now() >= absolute) access(new CustomEvent('taskiller:admin-access', { detail: 401 }));
      else {
        hidden = true;
        void check();
      }
    }, remaining + 250);
    return () => clearTimeout(timer);
  });

  async function logout() {
    if (leaving) return;
    leaving = true;
    hidden = true;
    message = '';
    try {
      await adminRequest('auth/logout', { method: 'POST' });
      await goto('/admin/login', { replaceState: true, invalidateAll: true });
    } catch (cause) { message = adminMessage(cause); }
    finally { leaving = false; }
  }
</script>

<svelte:window onfocus={check} onpageshow={event => { if (event.persisted) { hidden = true; void check(); } }} />
<a href="#admin-content" class="tk-skip-link">Skip to content</a>
<div class="min-h-dvh bg-[var(--background)] lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
  <aside class="bg-[#152b49] p-5 text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
    <a href="/admin" aria-label="Taskiller Administration"><Logo inverse class="h-6 w-auto" /></a>
    <p class="my-5 text-xs font-bold uppercase tracking-[.16em] text-[#bfd2ec]">Administration</p>
    <nav aria-label="Admin navigation" class="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" data-sveltekit-preload-data="off">
      {#each navItems.filter(item => data.staff.capabilities.includes(item.capability)) as item}
        {@const href = item.path ? '/admin/' + item.path : '/admin'}
        {@const selected = page.url.pathname === href || (item.path !== '' && page.url.pathname.startsWith(href + '/'))}
        {@const Icon = icons[item.path as keyof typeof icons]}
        <a {href} aria-current={selected ? 'page' : undefined} class="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#d6e3f5] transition-colors hover:bg-white/10 sm:px-3" class:active-link={selected}>
          <Icon size={18} class="shrink-0" aria-hidden="true" />{item.label}
        </a>
      {/each}
    </nav>
  </aside>
  <div class="min-w-0">
    <header class="flex flex-wrap items-center justify-end gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4">
      <div class="mr-auto flex min-w-0 items-center gap-2">
        <Avatar seed={data.staff.staffId} size={32} />
        <span class="break-words text-sm font-bold">{data.staff.displayName}</span>
      </div>
      <ThemeToggle compact />
      <Button size="sm" variant="secondary" loading={leaving} onclick={logout}>Sign out</Button>
    </header>
    <main id="admin-content" tabindex="-1" class="mx-auto max-w-7xl p-4 sm:p-8" data-sveltekit-preload-data="off">
      {#if message}<p role="alert" class="mb-4 text-[var(--danger-text)]">{message}</p>{/if}
      {#if !hidden}{#key data.staff.staffId}{@render children()}{/key}{/if}
    </main>
  </div>
</div>

<style>
  .active-link { background: #2a4467; color: #fff; }
</style>
