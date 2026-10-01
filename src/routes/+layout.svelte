<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import UpdateAvailable from '$lib/components/pwa/UpdateAvailable.svelte';
  import AmbientBackground from '$lib/components/layout/AmbientBackground.svelte';
  import { initConnectivity } from '$lib/pwa/connectivity';
  import { initInstallPrompt } from '$lib/pwa/install';
  import { initTheme } from '$lib/theme/theme';

  let { children }: { children?: import('svelte').Snippet } = $props();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 30 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: 'online'
      },
      mutations: { retry: 0, networkMode: 'always' }
    }
  });

  onMount(() => {
    initTheme();
    initConnectivity();
    initInstallPrompt();
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#edf2f4" />
  <meta name="color-scheme" content="light dark" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Taskiller" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
</svelte:head>

<AmbientBackground />

<div class="relative z-[1] min-h-screen">
  <QueryClientProvider client={queryClient}>
    {@render children?.()}
    <UpdateAvailable />
  </QueryClientProvider>
</div>
