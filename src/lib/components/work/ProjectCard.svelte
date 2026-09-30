<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import type { WorkItem } from '$lib/api/work';
  import { getProjectNextAction } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
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

<article class="group relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-white/86 p-5 shadow-[0_12px_38px_rgb(23_23_23/0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgb(23_23_23/0.07)]">
  <div class="absolute -right-14 -top-14 size-40 rounded-full bg-tk-blue/[0.06] blur-2xl"></div>
  <div class="relative flex items-start justify-between gap-4">
    <KindMark kind="project" />
    <StatusBadge status={project.status} />
  </div>
  <a href={`/work/${project.id}`} class="relative mt-8 block">
    <h2 class="tk-display text-2xl font-extrabold leading-tight">{project.name}</h2>
    <p class="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-tk-graphite">{project.description || 'No description yet. Open the project to shape the work.'}</p>
  </a>

  <div class="relative mt-8 border-t border-[var(--border)] pt-4">
    <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Next actionable</p>
    {#if nextAction.isPending}
      <div class="mt-2 h-5 w-2/3 animate-pulse rounded bg-black/[0.05]"></div>
    {:else if nextAction.data?.nextAction}
      <a href={`/work/${nextAction.data.nextAction.id}`} class="mt-2 flex items-center justify-between gap-3 rounded-[11px] bg-[#f3f3ef] px-3 py-2.5 text-sm font-semibold hover:bg-[#ecece7]">
        <span class="truncate">{nextAction.data.nextAction.name}</span>
        <ArrowRightIcon size={16} />
      </a>
    {:else}
      <p class="mt-2 text-sm text-tk-graphite">No executable descendant right now.</p>
    {/if}
  </div>

  <div class="relative mt-5 flex items-center justify-between text-xs text-tk-graphite">
    <span>{project.targetEndDate ? `Target ${formatShortDate(project.targetEndDate)}` : 'No target date'}</span>
    <a href={`/work/${project.id}`} class="flex items-center gap-1 font-bold text-tk-ink">Open <ArrowUpRightIcon size={14} /></a>
  </div>
</article>
