<script lang="ts">
  import { cycleTheme, themeMode } from '$lib/theme/theme';
  import { cn } from '$lib/utils';

  let {
    compact = false,
    class: className
  }: {
    compact?: boolean;
    class?: string;
  } = $props();

  const label = $derived(
    $themeMode === 'system' ? 'System' : $themeMode === 'light' ? 'Light' : 'Dark'
  );
</script>

<button
  type="button"
  class={cn(
    'inline-flex h-10 items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-tk-graphite transition-[transform,background-color,color,border-color] duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] hover:text-tk-ink active:translate-y-0 active:scale-[0.98]',
    compact && 'size-10 justify-center px-0',
    className
  )}
  aria-label={`Appearance: ${label}. Switch theme`}
  title={`Appearance: ${label}`}
  onclick={cycleTheme}
>
  <span class="tk-theme-glyph" aria-hidden="true"></span>
  {#if !compact}<span>{label}</span>{/if}
</button>
