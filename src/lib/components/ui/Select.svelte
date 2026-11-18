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
    'h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 text-base text-[var(--foreground)] transition-[border-color,background-color] duration-150 hover:border-[var(--border-strong)] focus:border-[var(--focus-ring)]',
    className
  )}
  {...rest}
>
  {@render children?.()}
</select>
