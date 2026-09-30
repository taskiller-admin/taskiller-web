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
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children?: import('svelte').Snippet;
  } = $props();

  const variants = {
    primary: 'bg-tk-strike text-tk-ink hover:brightness-[0.97] border-transparent',
    secondary: 'bg-white text-tk-ink hover:bg-tk-paper border-tk-mist',
    ghost: 'bg-transparent text-inherit hover:bg-black/5 border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent'
  } as const;
  const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-sm', lg: 'h-14 px-6 text-base' } as const;
</script>

<button
  {type}
  class={cn(
    'inline-flex items-center justify-center gap-2 rounded-[12px] border font-semibold transition duration-150 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
