<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    value = $bindable(),
    ...rest
  }: HTMLInputAttributes = $props();
</script>

<input
  bind:value
  class={cn(
    'h-11 w-full rounded-[13px] border border-[var(--border)] bg-white/90 px-3.5 text-[15px] text-tk-ink shadow-none placeholder:text-tk-graphite/65 focus:border-tk-blue/50',
    className
  )}
  {...rest}
/>
