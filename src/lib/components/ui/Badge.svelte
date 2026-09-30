<script lang="ts">
  import { cn } from '$lib/utils';
  let {
    class: className,
    tone = 'neutral',
    children
  }: {
    class?: string;
    tone?: 'neutral' | 'accent' | 'blue' | 'green' | 'danger';
    children?: import('svelte').Snippet;
  } = $props();

  const tones = {
    neutral: 'bg-black/[0.055] text-tk-graphite',
    accent: 'bg-tk-strike/15 text-[#a63820]',
    blue: 'bg-tk-blue/10 text-[#3553c8]',
    green: 'bg-tk-green/10 text-[#237754]',
    danger: 'bg-red-500/10 text-red-700'
  } as const;
</script>
<span class={cn('inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase tracking-[0.08em]', tones[tone], className)}>
  {@render children?.()}
</span>
