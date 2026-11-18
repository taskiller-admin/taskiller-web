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
    primary: 'border-transparent bg-[var(--action)] text-[var(--action-foreground)] hover:brightness-110',
    secondary: 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]',
    soft: 'border-transparent bg-[var(--surface-subtle)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]',
    dark: 'border-transparent bg-tk-strike text-[#24110b] hover:brightness-105',
    ghost: 'border-transparent bg-transparent text-inherit hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]',
    danger: 'border-transparent bg-red-600 text-white hover:bg-red-500'
  } as const;

  const sizes = {
    sm: 'min-h-11 rounded-[10px] px-3 text-sm',
    md: 'h-11 rounded-[13px] px-4 text-sm',
    lg: 'h-13 rounded-[14px] px-5 text-[15px]',
    icon: 'size-11 rounded-[10px] p-0'
  } as const;
</script>

<button
  {type}
  class={cn(
    'inline-flex shrink-0 items-center justify-center gap-2 border font-semibold transition-[background-color,border-color,color,filter] duration-150 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
