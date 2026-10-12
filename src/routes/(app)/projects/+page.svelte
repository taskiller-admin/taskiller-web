<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import WorkComposer from '$lib/components/work/WorkComposer.svelte';
  import ProjectCard from '$lib/components/work/ProjectCard.svelte';
  import { listProjects } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';

  const projects = createQuery(() => ({
    queryKey: queryKeys.work.projects,
    queryFn: listProjects
  }));

  const visible = $derived(
    (projects.data?.items ?? [])
      .filter((item) => !['archived', 'cancelled'].includes(item.status))
      .sort((a, b) => {
        const rank = { in_progress: 0, ready: 1, draft: 2, completed: 3 } as Record<string, number>;
        return (rank[a.status] ?? 4) - (rank[b.status] ?? 4) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      })
  );
</script>

<svelte:head><title>Projects — Taskiller</title></svelte:head>

<div class="tk-page">
  <header class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite">
        <FolderSimpleIcon size={16} weight="fill" class="text-tk-strike" /> Outcomes with structure
      </div>
      <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">Projects</h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-tk-graphite">Hold the outcome here. Let Sprints and Chores carry the motion underneath it.</p>
    </div>
    <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{visible.length} visible</span>
  </header>

  <div class="mt-10 max-w-4xl">
    <WorkComposer defaultKind="project" allowedKinds={['project']} compact label="New Project" />
  </div>

  <section class="mt-12">
    {#if projects.isPending}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {#each Array(6) as _, index}<div class={index % 2 === 0 ? 'h-64 animate-pulse rounded-[22px] bg-black/[0.045] xl:col-span-7' : 'h-64 animate-pulse rounded-[22px] bg-black/[0.045] xl:col-span-5'}></div>{/each}
      </div>
    {:else if projects.isError}
      <p class="py-10 text-sm text-red-700">Couldn’t load Projects.</p>
    {:else if visible.length === 0}
      <div class="tk-panel-soft rounded-[22px] border-dashed p-16 text-center">
        <p class="text-xl font-bold">No Projects yet.</p>
        <p class="mt-2 text-sm text-tk-graphite">Name the outcome above, then give it a Sprint or Chore.</p>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {#each visible as project, index}
          <div class={index % 4 === 0 || index % 4 === 3 ? 'xl:col-span-7' : 'xl:col-span-5'}>
            <ProjectCard {project} />
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
