<script lang="ts">
  import { cn } from '$lib/utils';
  let { class: className, children }: { class?: string; children?: import('svelte').Snippet } = $props();
</script>
<div class={cn('tk-surface rounded-[18px]', className)}>{@render children?.()}</div>
