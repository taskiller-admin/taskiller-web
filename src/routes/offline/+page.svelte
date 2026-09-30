<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import WifiSlashIcon from 'phosphor-svelte/lib/WifiSlashIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  let online = $state(false);
  const returnTo = $derived(page.url.searchParams.get('returnTo') || '/today');
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

<main class="grid min-h-screen place-items-center px-5 py-10">
  <div class="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-white/85 p-7 shadow-[0_25px_70px_rgb(23_23_23/0.08)] backdrop-blur sm:p-9">
    <Logo class="h-7 w-auto" />
    <div class="mt-10 grid size-12 place-items-center rounded-[15px] bg-black/[0.05] text-tk-graphite"><WifiSlashIcon size={24} /></div>
    <h1 class="tk-display mt-5 text-4xl font-extrabold">You’re offline.</h1>
    <p class="mt-3 text-sm leading-6 text-tk-graphite">The Taskiller shell is available, but authenticated work data is never stored by the service worker. Reconnect before syncing, editing, or starting new server actions.</p>
    <div class="mt-7 flex flex-wrap gap-3">
      <Button disabled={!online} onclick={retry}><ArrowClockwiseIcon size={17} /> {online ? 'Reconnect to Taskiller' : 'Waiting for connection'}</Button>
      <a class="inline-flex h-11 items-center rounded-[13px] border border-[var(--border)] bg-white px-4 text-sm font-bold" href="/">Public home</a>
    </div>
  </div>
</main>
