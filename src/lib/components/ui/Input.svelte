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
    'h-11 w-full rounded-[12px] border border-tk-mist bg-white px-3 text-[15px] text-tk-ink shadow-none placeholder:text-tk-graphite/70 focus:border-tk-graphite',
    className
  )}
  {...rest}
/>
