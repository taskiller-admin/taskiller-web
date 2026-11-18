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
    'min-h-28 w-full resize-y rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 py-3 text-base leading-6 text-[var(--foreground)] transition-[border-color,background-color] duration-150 placeholder:text-[var(--muted)] hover:border-[var(--border-strong)] focus:border-[var(--focus-ring)]',
    className
  )}
  {...rest}
></textarea>
