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
    'h-11 w-full rounded-[13px] border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 text-[15px] text-tk-ink shadow-[0_1px_0_rgb(255_255_255/0.22)_inset] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-tk-graphite/60 hover:border-[var(--border-strong)] focus:border-tk-strike/55 focus:shadow-[0_0_0_4px_rgb(255_99_63/0.08)]',
    className
  )}
  {...rest}
/>
