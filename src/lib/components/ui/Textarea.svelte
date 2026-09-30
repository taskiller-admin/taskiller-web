<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    value = $bindable(),
    ...rest
  }: HTMLTextareaAttributes = $props();
</script>

<textarea
  bind:value
  class={cn(
    'min-h-28 w-full resize-y rounded-[13px] border border-[var(--border)] bg-white/90 px-3.5 py-3 text-[15px] leading-6 text-tk-ink placeholder:text-tk-graphite/65 focus:border-tk-blue/50',
    className
  )}
  {...rest}
></textarea>
