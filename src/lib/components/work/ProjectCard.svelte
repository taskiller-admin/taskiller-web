<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import type { WorkItem } from '$lib/api/work';
  import { getProjectNextAction } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { spotlight } from '$lib/actions/spotlight';
  import KindMark from './KindMark.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import { formatShortDate } from '$lib/utils';

  let { project }: { project: WorkItem } = $props();

  const nextAction = createQuery(() => ({
    queryKey: queryKeys.work.nextAction(project.id),
    queryFn: () => getProjectNextAction(project.id),
    staleTime: 30_000
  }));
</script>

<article use:spotlight class="tk-panel tk-spotlight tk-lift group relative h-full overflow-hidden rounded-[22px] p-5 sm:p-6">
  <div class="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-tk-strike via-tk-strike/25 to-transparent opacity-70"></div>

  <div class="flex items-start justify-between gap-4">
    <KindMark kind="project" />
    <StatusBadge status={project.status} />
  </div>

  <a href={`/work/${project.id}`} class="mt-9 block min-w-0">
    <h2 class="tk-display text-2xl font-extrabold leading-[1.05] transition-transform duration-200 group-hover:translate-x-0.5">{project.name}</h2>
    <p class="mt-3 line-clamp-2 min-h-10 max-w-[46ch] text-sm leading-6 text-tk-graphite">
      {project.description || 'Open this Project to shape its next executable move.'}
    </p>
  </a>

  <div class="mt-8">
    <p class="text-xs font-semibold text-tk-graphite">Next actionable</p>
    {#if nextAction.isPending}
      <div class="mt-2 h-11 animate-pulse rounded-[12px] bg-black/[0.05]"></div>
    {:else if nextAction.data?.nextAction}
      <a
        href={`/work/${nextAction.data.nextAction.id}`}
        class="mt-2 flex items-center justify-between gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-3 text-sm font-semibold transition-[transform,border-color,background-color] duration-200 hover:translate-x-0.5 hover:border-tk-strike/30 hover:bg-[var(--surface-strong)]"
      >
        <span class="truncate">{nextAction.data.nextAction.name}</span>
        <ArrowRightIcon size={16} />
      </a>
    {:else}
      <p class="mt-2 text-sm text-tk-graphite">No executable descendant right now.</p>
    {/if}
  </div>

  <div class="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-tk-graphite">
    <span>{project.targetEndDate ? `Target ${formatShortDate(project.targetEndDate)}` : 'No target date'}</span>
    <a href={`/work/${project.id}`} class="flex items-center gap-1.5 font-bold text-tk-ink transition-transform duration-200 group-hover:translate-x-0.5">
      Open <ArrowUpRightIcon size={14} />
    </a>
  </div>
</article>
