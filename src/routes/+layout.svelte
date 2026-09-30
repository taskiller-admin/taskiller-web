<script lang="ts">
  import '../app.css';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  let { children }: { children?: import('svelte').Snippet } = $props();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true },
      mutations: { retry: 0 }
    }
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#f5f5f2" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<QueryClientProvider client={queryClient}>{@render children?.()}</QueryClientProvider>
