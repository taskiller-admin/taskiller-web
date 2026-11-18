<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import type { WorkItem } from '$lib/api/work';
  import { getProjectNextAction } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';

  import KindMark from './KindMark.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import ExportWorkButton from './ExportWorkButton.svelte';
  import { formatShortDate } from '$lib/utils';

  let { project }: { project: WorkItem } = $props();

  let inView = $state(false);
  function observe(node: HTMLElement) {
    if (typeof IntersectionObserver === 'undefined') { inView = true; return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { inView = true; observer.disconnect(); }
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
  const nextAction = createQuery(() => ({
    queryKey: queryKeys.work.nextAction(project.id),
    queryFn: () => getProjectNextAction(project.id),
    enabled: inView,
    staleTime: 30_000
  }));
</script>

<article use:observe class="project-card tk-panel group relative h-full overflow-hidden rounded-[24px] p-6 sm:p-7">


  <div class="flex items-start justify-between gap-4">
    <div class="flex items-center gap-3"><KindMark kind="project" /><span class="tk-section-label">Project</span></div>
    <div class="flex items-center gap-2">
      <ExportWorkButton workId={project.id} label="Export project" compact />
      <StatusBadge status={project.status} />
    </div>
  </div>

  <a href={`/work/${project.id}`} class="mt-9 block min-w-0">
    <h2 class="tk-display [overflow-wrap:anywhere] text-2xl font-extrabold leading-[1.05] transition-transform duration-200 group-hover:translate-x-0.5">{project.name}</h2>
    <p class="mt-3 line-clamp-2 min-h-10 max-w-[46ch] text-sm leading-6 text-tk-graphite">
      {project.description || 'Open this Project to shape its next executable move.'}
    </p>
  </a>

  <div class="next-action mt-8 rounded-2xl p-4">
    <p class="tk-section-label">Next actionable</p>
    {#if nextAction.isPending}
      <div class="mt-2 h-11 animate-pulse rounded-[12px] bg-[var(--surface-subtle)]"></div>
    {:else if nextAction.isError}
      <p class="mt-2 text-sm" role="alert">Could not load next work. <button type="button" class="underline" onclick={() => nextAction.refetch()}>Retry</button></p>
    {:else if nextAction.data?.nextAction}
      <a
        href={`/work/${nextAction.data.nextAction.id}`}
        class="mt-2 flex items-center justify-between gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-3 text-sm font-semibold transition-[transform,border-color,background-color] duration-200 hover:translate-x-0.5 hover:border-tk-strike/30 hover:bg-[var(--surface-strong)]"
      >
        <span class="min-w-0 [overflow-wrap:anywhere]">{nextAction.data.nextAction.name}</span>
        <ArrowRightIcon size={16} aria-hidden="true" />
      </a>
    {:else}
      <p class="mt-2 text-sm text-tk-graphite">No executable descendant right now.</p>
    {/if}
  </div>

  <div class="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-tk-graphite">
    <span>{project.targetEndDate ? `Target ${formatShortDate(project.targetEndDate)}` : 'No target date'}</span>
    <a href={`/work/${project.id}`} class="flex items-center gap-1.5 font-bold text-[var(--foreground)] transition-transform duration-200 group-hover:translate-x-0.5">
      Open <ArrowUpRightIcon size={14} aria-hidden="true" />
    </a>
  </div>
</article>

<style>
  .project-card { border-top: 4px solid var(--blue); transition: transform 280ms, box-shadow 280ms, border-color 280ms; }
  .project-card::after { content: ''; position: absolute; right: -35px; top: 32px; width: 130px; height: 130px; border: 22px solid color-mix(in srgb, var(--blue) 5%, transparent); border-radius: 50%; pointer-events: none; }
  .project-card:hover { transform: translateY(-5px); border-top-color: var(--accent); box-shadow: 0 22px 50px color-mix(in srgb, var(--blue) 12%, transparent); }
  .next-action { background: color-mix(in srgb, var(--blue) 5%, var(--surface)); }
  @media (prefers-reduced-motion: reduce) { .project-card { transition: none; } .project-card:hover { transform: none; } }
</style>
