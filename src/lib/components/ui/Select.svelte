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
    'h-11 w-full rounded-[13px] border border-[var(--border)] bg-white/90 px-3.5 text-[15px] text-tk-ink focus:border-tk-blue/50',
    className
  )}
  {...rest}
>
  {@render children?.()}
</select>
