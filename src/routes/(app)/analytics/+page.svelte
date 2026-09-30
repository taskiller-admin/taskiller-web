<script lang="ts">
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
</script>

<svelte:head><title>Analytics — Taskiller</title></svelte:head>
<div class="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite"><ChartLineUpIcon size={15} /> Descriptive, not decorative</div>
  <h1 class="tk-display text-5xl font-extrabold sm:text-6xl">Analytics</h1>
  <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">This route stays deliberately quiet until the execution flow is complete. Round 5 will turn backend analytics into questions and useful observations, not dashboard wallpaper.</p>
  <div class="mt-10 grid gap-4 sm:grid-cols-3">
    <div class="rounded-[20px] border border-[var(--border)] bg-white/65 p-5"><p class="text-xs font-bold text-tk-graphite">Estimate calibration</p><p class="mt-5 text-sm leading-6 text-tk-graphite">Median estimate error by work type and period.</p></div>
    <div class="rounded-[20px] border border-[var(--border)] bg-white/65 p-5"><p class="text-xs font-bold text-tk-graphite">Uninterrupted work</p><p class="mt-5 text-sm leading-6 text-tk-graphite">Observed block lengths without claiming causation.</p></div>
    <div class="rounded-[20px] border border-[var(--border)] bg-white/65 p-5"><p class="text-xs font-bold text-tk-graphite">Plan adherence</p><p class="mt-5 text-sm leading-6 text-tk-graphite">What was planned versus what was actually completed.</p></div>
  </div>
</div>
