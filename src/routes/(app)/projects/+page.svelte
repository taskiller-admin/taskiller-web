<script lang="ts">
  // Taskiller navigation refinements v1
  import { createQuery } from '@tanstack/svelte-query';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import CheckSquareIcon from 'phosphor-svelte/lib/CheckSquareIcon';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import WorkComposer from '$lib/components/work/WorkComposer.svelte';
  import ProjectCard from '$lib/components/work/ProjectCard.svelte';
  import StatusBadge from '$lib/components/work/StatusBadge.svelte';
  import ExportWorkButton from '$lib/components/work/ExportWorkButton.svelte';
  import KindMark from '$lib/components/work/KindMark.svelte';
  import { listWorkItems, type WorkItem, type WorkItemKind } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';

  const kinds = [
    { kind: 'project' as const, label: 'Projects', singular: 'Project', icon: FolderSimpleIcon, description: 'Outcomes with structure. Open a Project to shape Sprints and Chores underneath it.' },
    { kind: 'sprint' as const, label: 'Sprints', singular: 'Sprint', icon: TreeStructureIcon, description: 'Groups of connected Chores. Every Sprint belongs to a Project.' },
    { kind: 'chore' as const, label: 'Chores', singular: 'Chore', icon: CheckSquareIcon, description: 'The concrete pieces of work across your workspace, including Inbox Chores.' }
  ];
  let selectedKind = $state<WorkItemKind>('project');
  let sprintParentId = $state('');
  const current = $derived(kinds.find((value) => value.kind === selectedKind) ?? kinds[0]!);

  async function allItems(kind: WorkItemKind): Promise<WorkItem[]> {
    const rows: WorkItem[] = [];
    let cursor: string | null = null;
    const seen = new Set<string>();
    do {
      const response = await listWorkItems({ kind, limit: 100, cursor });
      rows.push(...response.items);
      if (!response.page.hasMore) break;
      cursor = response.page.nextCursor;
      if (!cursor || seen.has(cursor)) throw new Error('Work pagination returned an invalid cursor.');
      seen.add(cursor);
    } while (true);
    return rows;
  }

  const work = createQuery(() => ({
    queryKey: queryKeys.work.list({ kind: selectedKind, all: true }),
    queryFn: () => allItems(selectedKind)
  }));
  const parents = createQuery(() => ({
    queryKey: queryKeys.work.list({ kind: 'project', all: true }),
    queryFn: () => allItems('project'),
    enabled: selectedKind === 'sprint'
  }));
  const visible = $derived(
    (work.data ?? [])
      .filter((item) => !['archived', 'cancelled'].includes(item.status))
      .sort((a, b) => {
        const rank = { in_progress: 0, ready: 1, draft: 2, completed: 3 } as Record<string, number>;
        return (rank[a.status] ?? 4) - (rank[b.status] ?? 4) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      })
  );
</script>

<svelte:head><title>{current.label} — Taskiller</title></svelte:head>

<div class="tk-page">
  <header class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite">
        <current.icon size={16} weight="fill" class="text-tk-strike" /> Work hierarchy
      </div>
      <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">{current.label}</h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-tk-graphite">{current.description}</p>
    </div>
    <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{visible.length} visible</span>
  </header>

  <div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Browse work by kind">
    {#each kinds as item (item.kind)}
      <button type="button" role="tab" aria-selected={selectedKind === item.kind}
        class={selectedKind === item.kind
          ? 'inline-flex items-center gap-2 rounded-[12px] bg-[var(--surface-strong)] px-5 py-3 text-sm font-black text-tk-ink ring-1 ring-tk-strike/50'
          : 'inline-flex items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-bold text-tk-graphite hover:text-tk-ink'}
        onclick={() => (selectedKind = item.kind)}><item.icon size={17} />{item.label}</button>
    {/each}
  </div>

  <div class="mt-7 max-w-4xl">
    {#if selectedKind === 'project'}
      <WorkComposer defaultKind="project" allowedKinds={['project']} compact label="New Project" />
    {:else if selectedKind === 'chore'}
      <WorkComposer defaultKind="chore" allowedKinds={['chore']} compact label="New Chore" />
      <p class="mt-2 text-xs text-tk-graphite">New Chores go to Inbox. To attach one to a Project or Sprint, open that parent and create it there.</p>
    {:else}
      <div class="tk-panel-soft rounded-[18px] p-4">
        <label class="block max-w-xl text-xs font-bold text-tk-graphite" for="sprint-parent">Create a Sprint inside a Project</label>
        <select id="sprint-parent" bind:value={sprintParentId} class="mt-2 h-11 w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">
          <option value="">Choose a parent Project</option>
          {#each (parents.data ?? []).filter((item) => !item.deletedAt && !['archived','cancelled'].includes(item.status)) as project (project.id)}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>
        {#if sprintParentId}
          {#key sprintParentId}
            <div class="mt-3"><WorkComposer parentId={sprintParentId} defaultKind="sprint" allowedKinds={['sprint']} compact label="New Sprint" /></div>
          {/key}
        {:else}
          <p class="mt-3 text-xs text-tk-graphite">A Sprint must belong to a Project. Choose one above or <a href="/projects" class="font-bold text-tk-strike">create a Project</a> first.</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="mt-10" role="tabpanel" aria-label={`${current.label} list`}>
    {#if work.isPending}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {#each Array(6) as _, index}<div class={index % 2 === 0 ? 'h-64 animate-pulse rounded-[22px] bg-black/[0.045] xl:col-span-7' : 'h-64 animate-pulse rounded-[22px] bg-black/[0.045] xl:col-span-5'}></div>{/each}
      </div>
    {:else if work.isError}
      <div class="tk-panel rounded-2xl p-6 text-sm text-red-700" role="alert">Could not load {current.label.toLowerCase()}. <button type="button" class="ml-2 font-bold underline" onclick={() => work.refetch()}>Retry</button></div>
    {:else if visible.length === 0}
      <div class="tk-panel-soft rounded-[22px] border-dashed p-12 text-center">
        <p class="text-xl font-bold">No {current.label} yet.</p>
        <p class="mt-2 text-sm text-tk-graphite">{selectedKind === 'sprint' ? 'Create a Sprint inside one of your Projects.' : selectedKind === 'project' ? 'Name an outcome above, then add Sprints or Chores.' : 'Capture your first Chore above or in Inbox.'}</p>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {#each visible as item, index (item.id)}
          <div class={index % 4 === 0 || index % 4 === 3 ? 'xl:col-span-7' : 'xl:col-span-5'}>
            {#if selectedKind === 'project'}
              <ProjectCard project={item} />
            {:else}
              <article class="tk-panel tk-lift relative h-full rounded-[22px] p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3">
                  <KindMark kind={item.kind} />
                  <div class="flex items-center gap-2"><ExportWorkButton workId={item.id} compact label={`Export ${item.kind}`} /><StatusBadge status={item.status} /></div>
                </div>
                <a href={`/work/${item.id}`} class="mt-7 block min-w-0">
                  <h2 class="tk-display break-words text-2xl font-extrabold">{item.name}</h2>
                  <p class="mt-3 line-clamp-3 text-sm leading-6 text-tk-graphite">{item.description || `Open this ${item.kind} to add details or plan its execution.`}</p>
                </a>
                <div class="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-tk-graphite">
                  <span>{item.parentId ? 'Inside another work item' : 'Inbox / root'}</span>
                  <a href={`/work/${item.id}`} class="inline-flex items-center gap-1.5 font-bold text-tk-ink">Open <ArrowUpRightIcon size={14} /></a>
                </div>
              </article>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
