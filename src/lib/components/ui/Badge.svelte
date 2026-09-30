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
    neutral: 'border-[var(--border)] bg-[var(--surface-subtle)] text-tk-graphite',
    accent: 'border-tk-strike/25 bg-tk-strike/10 text-[var(--accent-ink)]',
    blue: 'border-tk-blue/20 bg-tk-blue/10 text-[#4f67d9] dark:text-[#aebcff]',
    green: 'border-tk-green/20 bg-tk-green/10 text-[#237754] dark:text-[#6ed2a0]',
    danger: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
  } as const;
</script>

<span class={cn('inline-flex h-6 items-center rounded-[7px] border px-2.5 text-[11px] font-bold', tones[tone], className)}>
  {@render children?.()}
</span>
