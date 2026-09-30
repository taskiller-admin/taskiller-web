<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    value = $bindable(),
    children,
    ...rest
  }: HTMLSelectAttributes & { children?: import('svelte').Snippet } = $props();
</script>

<select
  bind:value
  class={cn(
    'h-11 w-full rounded-[13px] border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 text-[15px] text-tk-ink transition-[border-color,box-shadow,background-color] duration-200 hover:border-[var(--border-strong)] focus:border-tk-strike/55 focus:shadow-[0_0_0_4px_rgb(255_99_63/0.08)]',
    className
  )}
  {...rest}
>
  {@render children?.()}
</select>
