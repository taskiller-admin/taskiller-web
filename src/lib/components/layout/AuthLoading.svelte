<script lang="ts">
  import { onMount } from 'svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';

  let {
    progress = 8,
    stage = 'Restoring session'
  }: {
    progress?: number;
    stage?: string;
  } = $props();

  let displayed = $state(6);

  onMount(() => {
    const timer = window.setInterval(() => {
      const ceiling = Math.min(96, Math.max(progress, displayed) + 7);
      displayed = Math.min(ceiling, displayed + Math.max(1, Math.round((ceiling - displayed) * 0.18)));
    }, 140);
    return () => window.clearInterval(timer);
  });

  $effect(() => {
    if (progress > displayed) displayed = Math.min(progress, 100);
  });
</script>

<div class="relative z-[1] grid min-h-[100dvh] place-items-center px-5 py-10">
  <div class="w-full max-w-md">
    <div class="flex items-center justify-between">
      <Logo class="h-6 w-auto" />
      <ThemeToggle compact />
    </div>

    <div class="mt-24">
      <p class="text-sm font-semibold text-tk-graphite">{stage}</p>
      <h1 class="tk-display mt-2 text-4xl font-bold">Opening Taskiller.</h1>
      <p class="mt-3 max-w-sm text-sm leading-6 text-tk-graphite">Reconnecting to the latest server-backed state.</p>

      <div
        class="mt-8 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]"
        role="progressbar"
        aria-label="Loading Taskiller"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={displayed}
      >
        <div class="h-full rounded-full bg-tk-strike transition-[width] duration-300 ease-out" style={`width:${displayed}%`}></div>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs text-tk-graphite">
        <span>{stage}</span>
        <span class="tk-mono">{displayed}%</span>
      </div>
    </div>
  </div>
</div>
