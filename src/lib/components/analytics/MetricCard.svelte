<script lang="ts">

  let {
    label,
    value,
    detail,
    tone = 'neutral'
  }: {
    label: string;
    value: string;
    detail?: string;
    tone?: 'neutral' | 'accent' | 'blue' | 'green';
  } = $props();

  const toneClass = {
    neutral: 'bg-[var(--muted)]',
    accent: 'bg-tk-strike',
    blue: 'bg-tk-blue',
    green: 'bg-tk-green'
  } as const;
</script>

<div class="metric-card tk-panel tk-stat rounded-[22px] p-6">
  <div class="flex items-center justify-between gap-4">
    <p class="tk-section-label">{label}</p>
    <span class={`h-1.5 w-7 rounded-full ${toneClass[tone]}`}></span>
  </div>
  <p class="tk-display mt-6 text-3xl font-extrabold leading-none sm:text-[2.2rem]">{value}</p>
  {#if detail}<p class="mt-3 text-xs leading-5 text-tk-graphite">{detail}</p>{/if}
</div>

<style>
  .metric-card { position: relative; overflow: hidden; transition: transform 250ms, box-shadow 250ms; }
  .metric-card::after { content: ''; position: absolute; bottom: -25px; right: -20px; width: 90px; height: 90px; border-radius: 50%; border: 16px solid color-mix(in srgb, var(--blue) 5%, transparent); }
  .metric-card:hover { transform: translateY(-4px); box-shadow: 0 15px 36px color-mix(in srgb, var(--blue) 10%, transparent); }
  @media (prefers-reduced-motion: reduce) { .metric-card { transition: none; } .metric-card:hover { transform: none; } }
</style>
