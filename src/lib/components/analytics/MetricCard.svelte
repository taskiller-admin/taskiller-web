<script lang="ts">
  import { spotlight } from '$lib/actions/spotlight';

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

<div use:spotlight class="tk-panel tk-spotlight tk-lift rounded-[18px] p-5">
  <div class="flex items-center justify-between gap-4">
    <p class="text-xs font-semibold text-tk-graphite">{label}</p>
    <span class={`h-1.5 w-7 rounded-full ${toneClass[tone]}`}></span>
  </div>
  <p class="tk-display mt-6 text-3xl font-extrabold leading-none sm:text-[2.2rem]">{value}</p>
  {#if detail}<p class="mt-3 text-xs leading-5 text-tk-graphite">{detail}</p>{/if}
</div>
