<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import WifiSlashIcon from 'phosphor-svelte/lib/WifiSlashIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import AuthFrame from '$lib/components/brand/AuthFrame.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  let online = $state(false);
  const requestedReturn = $derived(page.url.searchParams.get('returnTo') || '/today');
  const returnTo = $derived(requestedReturn.startsWith('/') && !requestedReturn.startsWith('//') && !requestedReturn.includes('\\') ? requestedReturn : '/today');
  onMount(() => {
    const sync = () => (online = navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  });
  function retry() { window.location.href = returnTo; }
</script>

<svelte:head><title>Offline — Taskiller</title><meta name="robots" content="noindex" /></svelte:head>

<AuthFrame headline="A pause in the flow. You’ll be back." eyebrow="CONNECTION CHECK">
  <div class="auth-card">
    <div class="mt-10 grid size-12 place-items-center rounded-[15px] bg-[var(--surface-subtle)] text-[var(--muted)]"><WifiSlashIcon size={24} aria-hidden="true" /></div>
    <h1 class="tk-display mt-5 text-4xl font-extrabold">You’re offline.</h1>
    <p class="mt-3 text-sm leading-6 text-[var(--muted)]">You can open Taskiller, but your work needs a connection. Reconnect to load your workspace, save changes, or start a session.</p>
    <div class="mt-7 flex flex-wrap gap-3">
      <Button disabled={!online} onclick={retry}><ArrowClockwiseIcon size={17} aria-hidden="true" /> {online ? 'Reconnect to Taskiller' : 'Waiting for connection'}</Button>
      <a class="inline-flex h-11 items-center rounded-[13px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm font-bold" href="/">Public home</a>
    </div>
  </div>
</AuthFrame>
