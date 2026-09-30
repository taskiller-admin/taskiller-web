<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type TextareaProps = Omit<HTMLTextareaAttributes, 'maxlength' | 'minlength'> & {
    maxlength?: number | `${number}`;
    minlength?: number | `${number}`;
  };

  let {
    class: className,
    value = $bindable(),
    maxlength,
    minlength,
    ...rest
  }: TextareaProps = $props();
</script>

<textarea
  bind:value
  maxlength={maxlength === undefined ? undefined : Number(maxlength)}
  minlength={minlength === undefined ? undefined : Number(minlength)}
  class={cn(
    'min-h-28 w-full resize-y rounded-[13px] border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 py-3 text-[15px] leading-6 text-tk-ink transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-tk-graphite/60 hover:border-[var(--border-strong)] focus:border-tk-strike/55 focus:shadow-[0_0_0_4px_rgb(255_99_63/0.08)]',
    className
  )}
  {...rest}
></textarea>
