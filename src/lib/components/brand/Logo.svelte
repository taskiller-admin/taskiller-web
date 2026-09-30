<script lang="ts">
  import { cn } from '$lib/utils';
  let { inverse = false, class: className = '' }: { inverse?: boolean; class?: string } = $props();
</script>

<span class={cn('inline-flex items-center', className)} translate="no">
  {#if inverse}
    <img src="/brand/taskiller-logo-reverse.svg" alt="Taskiller" class="h-full w-auto" />
  {:else}
    <img src="/brand/taskiller-logo-primary.svg" alt="Taskiller" class="h-full w-auto dark:hidden" />
    <img src="/brand/taskiller-logo-reverse.svg" alt="Taskiller" class="hidden h-full w-auto dark:block" />
  {/if}
</span>
