<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import UpdateAvailable from '$lib/components/pwa/UpdateAvailable.svelte';
  import { initConnectivity } from '$lib/pwa/connectivity';
  import { initInstallPrompt } from '$lib/pwa/install';
  import { initTheme } from '$lib/theme/theme';
  import { navigating } from '$app/state';
  import { onNavigate } from '$app/navigation';
  import { motion } from '$lib/actions/motion';
  import { authActivity } from '$lib/auth/session';
  import Spinner from '$lib/components/ui/Spinner.svelte';

  let { children }: { children?: import('svelte').Snippet } = $props();

  onNavigate((navigation) => {
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'paused') return;
    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

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
    const clearPrivateData = () => queryClient.clear();
    window.addEventListener('taskiller:auth-cleared', clearPrivateData);
    initTheme();
    initConnectivity();
    initInstallPrompt();
    return () => window.removeEventListener('taskiller:auth-cleared', clearPrivateData);
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
  <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="/fonts/sora-latin.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<div class="relative z-[1] min-h-screen" use:motion>
  {#if navigating.to}<div class="tk-navigation-progress" role="progressbar" aria-label="Opening page"></div>{/if}
  {#if $authActivity}
    <div class="tk-operation-overlay" role="status" aria-live="polite">
      <div class="tk-operation-card"><Spinner size={32} /><p class="tk-display text-xl">{$authActivity}</p><p class="text-sm text-[var(--muted)]">Just a moment.</p></div>
    </div>
  {/if}
  <QueryClientProvider client={queryClient}>
    <div inert={Boolean($authActivity)}>
    {@render children?.()}
    <UpdateAvailable />
    </div>
  </QueryClientProvider>
</div>
