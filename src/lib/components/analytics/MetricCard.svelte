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
    neutral: 'bg-[#ecece7]',
    accent: 'bg-tk-strike',
    blue: 'bg-tk-blue',
    green: 'bg-tk-green'
  } as const;
</script>

<div class="rounded-[18px] border border-[var(--border)] bg-white/76 p-5">
  <div class="flex items-start justify-between gap-4">
    <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">{label}</p>
    <span class={`size-2.5 rounded-full ${toneClass[tone]}`}></span>
  </div>
  <p class="tk-display mt-5 text-3xl font-extrabold leading-none sm:text-[2.15rem]">{value}</p>
  {#if detail}<p class="mt-3 text-xs leading-5 text-tk-graphite">{detail}</p>{/if}
</div>
