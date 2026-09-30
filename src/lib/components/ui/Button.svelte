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
    primary: 'border-transparent bg-tk-ink text-white hover:bg-black',
    secondary: 'border-[var(--border)] bg-white text-tk-ink hover:bg-[#f7f7f4]',
    soft: 'border-transparent bg-[#ecece7] text-tk-ink hover:bg-[#e4e4de]',
    dark: 'border-transparent bg-tk-strike text-[#1a1512] hover:brightness-[0.98]',
    ghost: 'border-transparent bg-transparent text-inherit hover:bg-black/[0.055]',
    danger: 'border-transparent bg-red-600 text-white hover:bg-red-700'
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
    'inline-flex shrink-0 items-center justify-center gap-2 border font-semibold transition duration-150 disabled:pointer-events-none disabled:opacity-45',
    variants[variant],
    sizes[size],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
