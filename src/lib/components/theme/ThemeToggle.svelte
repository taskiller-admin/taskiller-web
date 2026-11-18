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
    'inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--muted)] transition-[background-color,color,border-color] duration-150 hover:border-[var(--border-strong)] hover:text-[var(--foreground)]',
    compact && 'size-11 justify-center px-0',
    className
  )}
  aria-label={`Appearance: ${label}. Switch theme`}
  title={`Appearance: ${label}`}
  onclick={cycleTheme}
>
  <span class="tk-theme-glyph" aria-hidden="true"></span>
  {#if !compact}<span>{label}</span>{/if}
</button>
