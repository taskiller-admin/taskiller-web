<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import AppShell from '$lib/components/layout/AppShell.svelte';
  import { auth, bootstrapAuth } from '$lib/auth/session';
  let { children }: { children?: import('svelte').Snippet } = $props();

  onMount(async () => {
    if (!navigator.onLine) {
      const returnTo = `${page.url.pathname}${page.url.search}`;
      await goto(`/offline?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    const ok = await bootstrapAuth();
    if (!ok) await goto('/login');
  });
</script>

{#if $auth.status === 'unknown'}
  <div class="flex min-h-screen items-center justify-center bg-tk-paper"><div class="h-2 w-28 overflow-hidden rounded-full bg-tk-mist"><div class="h-full w-1/2 animate-pulse rounded-full bg-tk-strike"></div></div></div>
{:else if $auth.status === 'authenticated'}
  <AppShell>{@render children?.()}</AppShell>
{/if}
