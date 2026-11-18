<script lang="ts">
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import StackIcon from 'phosphor-svelte/lib/StackIcon';
  import FileTextIcon from 'phosphor-svelte/lib/FileTextIcon';
  import type { WorkItemKind } from '$lib/api/work';
  import { cn } from '$lib/utils';

  let { kind, class: className }: { kind: WorkItemKind; class?: string } = $props();
</script>

<span
  class={cn(
    'grid size-9 shrink-0 place-items-center rounded-[12px] border',
    kind === 'project' && 'border-tk-blue/15 bg-tk-blue/10 text-tk-blue',
    kind === 'sprint' && 'border-violet-500/15 bg-violet-500/10 text-violet-600',
    kind === 'chore' && 'border-black/[0.06] bg-[var(--surface-subtle)] text-tk-graphite',
    className
  )}
  aria-hidden="true"
>
  {#if kind === 'project'}
    <TreeStructureIcon size={18} weight="fill" aria-hidden="true" />
  {:else if kind === 'sprint'}
    <StackIcon size={18} weight="fill" aria-hidden="true" />
  {:else}
    <FileTextIcon size={18} aria-hidden="true" />
  {/if}
</span>
