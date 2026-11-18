<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  let { progress: _progress = 0, stage = 'Restoring your session' }: { progress?: number; stage?: string } = $props();
  let delayed = $state(false);
  onMount(() => { const timeout = window.setTimeout(() => delayed = true, 10_000); return () => clearTimeout(timeout); });
</script>
<main class="grid min-h-dvh place-items-center px-5">
  <div class="w-full max-w-sm">
    <a href="/" aria-label="Taskiller home"><Logo class="h-7 w-auto" /></a>
    <h1 class="tk-display mt-10 text-3xl font-bold">Opening your workspace</h1>
    <p class="mt-3 text-sm text-tk-graphite" role="status">{stage}</p>
    <div class="tk-loader mt-6" role="progressbar" aria-label="Restoring your session"></div>
    {#if delayed}<p class="mt-6 text-sm leading-6 text-tk-graphite">This is taking longer than usual. Check your connection, then <button type="button" class="min-h-11 font-semibold underline" onclick={() => window.location.reload()}>try again</button>.</p>{/if}
  </div>
</main>
