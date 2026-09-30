<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    variant = 'primary',
    size = 'md',
    type = 'button',
    children,
    ...rest
  }: HTMLButtonAttributes & {
    variant?: 'primary' | 'secondary' | 'soft' | 'dark' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    children?: import('svelte').Snippet;
  } = $props();

  const variants = {
    primary: 'border-transparent bg-[var(--action)] text-[var(--action-foreground)] shadow-[0_9px_24px_hsl(var(--shadow-color)/0.12)] hover:shadow-[0_12px_30px_hsl(var(--shadow-color)/0.17)]',
    secondary: 'border-[var(--border)] bg-[var(--surface-raised)] text-tk-ink hover:border-[var(--border-strong)] hover:bg-[var(--surface)]',
    soft: 'border-transparent bg-[var(--surface-subtle)] text-tk-ink hover:bg-[var(--surface-strong)]',
    dark: 'border-transparent bg-tk-strike text-[#24110b] shadow-[0_10px_30px_rgb(255_99_63/0.22)] hover:brightness-105',
    ghost: 'border-transparent bg-transparent text-inherit hover:bg-[var(--surface-subtle)]',
    danger: 'border-transparent bg-red-600 text-white hover:bg-red-500'
  } as const;

  const sizes = {
    sm: 'h-9 rounded-[11px] px-3 text-sm',
    md: 'h-11 rounded-[13px] px-4 text-sm',
    lg: 'h-13 rounded-[14px] px-5 text-[15px]',
    icon: 'size-10 rounded-[12px] p-0'
  } as const;
</script>

<button
  {type}
  class={cn(
    'inline-flex shrink-0 items-center justify-center gap-2 border font-semibold transition-[transform,background-color,border-color,box-shadow,color,filter] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px active:translate-y-0 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
    variants[variant],
    sizes[size],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
