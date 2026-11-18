<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type InputProps = Omit<HTMLInputAttributes, 'maxlength' | 'minlength'> & {
    maxlength?: number | `${number}`;
    minlength?: number | `${number}`;
  };

  let {
    class: className,
    value = $bindable(),
    maxlength,
    minlength,
    ...rest
  }: InputProps = $props();
</script>

<input
  bind:value
  maxlength={maxlength === undefined ? undefined : Number(maxlength)}
  minlength={minlength === undefined ? undefined : Number(minlength)}
  class={cn(
    'h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 text-base text-[var(--foreground)] transition-[border-color,background-color] duration-150 placeholder:text-[var(--muted)] hover:border-[var(--border-strong)] focus:border-[var(--focus-ring)]',
    className
  )}
  {...rest}
/>
