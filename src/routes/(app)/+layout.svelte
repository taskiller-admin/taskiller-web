<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import AppShell from '$lib/components/layout/AppShell.svelte';
  import AuthLoading from '$lib/components/layout/AuthLoading.svelte';
  import { auth, bootstrapAuth } from '$lib/auth/session';

  let { children }: { children?: import('svelte').Snippet } = $props();

  let bootProgress = $state(8);
  let bootStage = $state('Restoring session');

  onMount(async () => {
    if (!navigator.onLine) {
      const returnTo = `${page.url.pathname}${page.url.search}`;
      await goto(`/offline?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    const ok = await bootstrapAuth((progress, stage) => {
      bootProgress = progress;
      bootStage = stage;
    });

    if (!ok) await goto('/login');
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if $auth.status === 'unknown'}
  <AuthLoading progress={bootProgress} stage={bootStage} />
{:else if $auth.status === 'authenticated'}
  <AppShell>{@render children?.()}</AppShell>
{/if}
