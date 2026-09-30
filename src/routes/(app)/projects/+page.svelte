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

<div class="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="flex flex-wrap items-end justify-between gap-6">
    <div>
      <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite">
        <FolderSimpleIcon size={15} weight="fill" class="text-tk-blue" /> Outcomes with structure
      </div>
      <h1 class="tk-display text-5xl font-extrabold sm:text-6xl">Projects</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">Projects hold Sprints and direct Chores. The workspace stays oriented around the next actionable descendant.</p>
    </div>
    <div class="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5 text-sm text-tk-graphite">{visible.length} visible</div>
  </header>

  <div class="mt-9 max-w-3xl">
    <WorkComposer defaultKind="project" allowedKinds={['project']} compact label="New project" />
  </div>

  <section class="mt-10">
    {#if projects.isPending}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each Array(6) as _}<div class="h-64 animate-pulse rounded-[22px] bg-black/[0.045]"></div>{/each}
      </div>
    {:else if projects.isError}
      <p class="py-10 text-sm text-red-700">Couldn’t load projects.</p>
    {:else if visible.length === 0}
      <div class="rounded-[22px] border border-dashed border-[var(--border)] bg-white/45 p-14 text-center">
        <p class="text-xl font-bold">No projects yet.</p>
        <p class="mt-2 text-sm text-tk-graphite">Create an outcome above, then break it into a Sprint or direct Chore.</p>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each visible as project}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}
  </section>
</div>
