<script lang="ts">
  import { fade } from 'svelte/transition';

  function panelDuration() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
  }

  // Taskiller navigation refinements v1
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import CheckSquareIcon from 'phosphor-svelte/lib/CheckSquareIcon';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import WorkComposer from '$lib/components/work/WorkComposer.svelte';
  import ProjectCard from '$lib/components/work/ProjectCard.svelte';
  import StatusBadge from '$lib/components/work/StatusBadge.svelte';
  import ExportWorkButton from '$lib/components/work/ExportWorkButton.svelte';
  import KindMark from '$lib/components/work/KindMark.svelte';
  import { listWorkItems, listAllWorkItems, type WorkItemKind } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';

  const kinds = [
    { kind: 'project' as const, label: 'Projects', singular: 'Project', icon: FolderSimpleIcon, description: 'Outcomes with structure. Open a Project to shape Sprints and Chores underneath it.' },
    { kind: 'sprint' as const, label: 'Sprints', singular: 'Sprint', icon: TreeStructureIcon, description: 'Groups of connected Chores. Every Sprint belongs to a Project.' },
    { kind: 'chore' as const, label: 'Chores', singular: 'Chore', icon: CheckSquareIcon, description: 'The concrete pieces of work across your workspace, including Inbox Chores.' }
  ];
  const selectedKind = $derived<WorkItemKind>(kinds.some((item) => item.kind === page.url.searchParams.get('kind')) ? page.url.searchParams.get('kind') as WorkItemKind : 'project');
  function selectKind(kind: WorkItemKind) {
    const url = new URL(page.url);
    url.searchParams.set('kind', kind);
    void goto(url, { keepFocus: true, noScroll: true });
  }
  function tabKey(event: KeyboardEvent, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? kinds.length - 1 : event.key === 'ArrowRight' ? (index + 1) % kinds.length : event.key === 'ArrowLeft' ? (index + kinds.length - 1) % kinds.length : null;
    if (next === null) return;
    event.preventDefault();
    selectKind(kinds[next]!.kind);
    document.getElementById(`kind-tab-${kinds[next]!.kind}`)?.focus();
  }
  let sprintParentId = $state('');
  let sprintDraftDirty = $state(false);
  function changeSprintParent(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const nextParentId = select.value;
    if (nextParentId === sprintParentId) return;
    if (sprintDraftDirty && !confirm('Discard your unsaved Sprint changes and change the parent Project?')) {
      select.value = sprintParentId;
      return;
    }
    sprintDraftDirty = false;
    sprintParentId = nextParentId;
  }
  const current = $derived(kinds.find((value) => value.kind === selectedKind) ?? kinds[0]!);

  const work = createInfiniteQuery(() => ({
    queryKey: queryKeys.work.list({ kind: selectedKind, paged: true }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => listWorkItems({ kind: selectedKind, limit: 24, cursor: pageParam }),
    getNextPageParam: (lastPage, pages) => lastPage.page.hasMore && lastPage.page.nextCursor && !pages.slice(0, -1).some((entry) => entry.page.nextCursor === lastPage.page.nextCursor) ? lastPage.page.nextCursor : undefined
  }));
  const parents = createQuery(() => ({
    queryKey: queryKeys.work.list({ kind: 'project', all: true }),
    queryFn: () => listAllWorkItems({ kind: 'project' }),
    enabled: selectedKind === 'sprint'
  }));
  const visible = $derived(
    (work.data?.pages.flatMap((result) => result.items) ?? [])
      .filter((item) => !['archived', 'cancelled'].includes(item.status))
      .sort((a, b) => {
        const rank = { in_progress: 0, ready: 1, draft: 2, completed: 3 } as Record<string, number>;
        return (rank[a.status] ?? 4) - (rank[b.status] ?? 4) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      })
  );
</script>

<svelte:head><title>{current.label} — Taskiller</title></svelte:head>

<div class="tk-page">
  <header class="tk-page-intro grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      <div class="tk-eyebrow mb-2 flex items-center gap-2 text-sm font-semibold text-tk-graphite"><span class="tk-feature-icon" aria-hidden="true"><current.icon size={16} weight="fill" class="text-tk-strike" aria-hidden="true" /></span> Work hierarchy
      </div>
      <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">{current.label}</h1>
      <p class="mt-2 max-w-2xl text-base leading-7 text-tk-graphite">{current.description}</p>
    </div>
    <span class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-tk-graphite">{visible.length} visible</span>
  </header>

  <div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Browse work by kind">
    {#each kinds as item, index (item.kind)}
      <button type="button" role="tab" id={`kind-tab-${item.kind}`} aria-controls="kind-panel" tabindex={selectedKind === item.kind ? 0 : -1} onkeydown={(event) => tabKey(event, index)} aria-selected={selectedKind === item.kind}
        class={selectedKind === item.kind
          ? 'inline-flex items-center gap-2 rounded-[12px] bg-[var(--surface-strong)] px-5 py-3 text-sm font-black text-[var(--foreground)] ring-1 ring-tk-strike/50'
          : 'inline-flex items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-bold text-tk-graphite hover:text-[var(--foreground)]'}
        onclick={() => selectKind(item.kind)}><item.icon size={17} aria-hidden="true" />{item.label}</button>
    {/each}
  </div>

  <div class="mt-7 max-w-4xl">
    {#if selectedKind === 'project'}
      <WorkComposer defaultKind="project" allowedKinds={['project']} compact label="New Project" />
    {:else if selectedKind === 'chore'}
      <WorkComposer defaultKind="chore" allowedKinds={['chore']} compact label="New Chore" />
      <p class="mt-2 text-xs text-tk-graphite">New Chores go to Inbox. To attach one to a Project or Sprint, open that parent and create it there.</p>
    {:else}
      <div class="tk-panel-soft rounded-[14px] p-4">
        <label class="block max-w-xl text-xs font-bold text-tk-graphite" for="sprint-parent">Create a Sprint inside a Project</label>
        <select id="sprint-parent" value={sprintParentId} onchange={changeSprintParent} disabled={parents.isPending || parents.isError} class="mt-2 h-11 w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">
          <option value="">Choose a parent Project</option>
          {#each (parents.data?.items ?? []).filter((item) => !item.deletedAt && !['archived','cancelled'].includes(item.status)) as project (project.id)}
            <option value={project.id}>{project.name}</option>
          {/each}
        </select>
        {#if parents.isPending}<p role="status" class="mt-2 text-sm">Loading Projects…</p>{:else if parents.isError}<p role="alert" class="mt-2 text-sm">Could not load Projects. <button type="button" class="underline" onclick={() => parents.refetch()}>Retry</button></p>{/if}
        {#if sprintParentId}
          {#key sprintParentId}
            <div class="mt-3"><WorkComposer parentId={sprintParentId} ondirtychange={(dirty) => (sprintDraftDirty = dirty)} defaultKind="sprint" allowedKinds={['sprint']} compact label="New Sprint" /></div>
          {/key}
        {:else}
          <p class="mt-3 text-xs text-tk-graphite">A Sprint must belong to a Project. Choose one above or <a href="/projects?kind=project" class="font-bold text-[var(--accent-ink)]">create a Project</a> first.</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="mt-6" id="kind-panel" role="tabpanel" aria-labelledby={`kind-tab-${selectedKind}`} tabindex="0">
    {#if work.isPending}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {#each Array(6) as _, index}<div class={index % 2 === 0 ? 'h-64 animate-pulse rounded-[14px] bg-[var(--surface-subtle)] xl:col-span-7' : 'h-64 animate-pulse rounded-[14px] bg-[var(--surface-subtle)] xl:col-span-5'}></div>{/each}
      </div>
    {:else if work.isError && !work.data}
      <div class="tk-panel rounded-2xl p-6 text-sm text-[var(--danger-text)]" role="alert">Could not load {current.label.toLowerCase()}. <button type="button" class="ml-2 font-bold underline" onclick={() => work.refetch()}>Retry</button></div>
    {:else if visible.length === 0}
      <div transition:fade={{ duration: panelDuration() }} class="tk-panel tk-empty-state rounded-[24px] p-12 text-center">
        <span class="tk-feature-icon mx-auto mb-5" aria-hidden="true"><current.icon size={25} /></span>
        <p class="text-xl font-bold">No {current.label} yet.</p>
        <p class="mt-2 text-sm text-tk-graphite">{selectedKind === 'sprint' ? 'Create a Sprint inside one of your Projects.' : selectedKind === 'project' ? 'Name an outcome above, then add Sprints or Chores.' : 'Capture your first Chore above or in Inbox.'}</p>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {#each visible as item, index (item.id)}
          <div in:fade={{ duration: panelDuration(), delay: panelDuration() ? index % 6 * 45 : 0 }} class={index % 4 === 0 || index % 4 === 3 ? 'xl:col-span-7' : 'xl:col-span-5'}>
            {#if selectedKind === 'project'}
              <ProjectCard project={item} />
            {:else}
              <article class="tk-panel tk-lift relative h-full rounded-[14px] p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3">
                  <KindMark kind={item.kind} />
                  <div class="flex items-center gap-2"><ExportWorkButton workId={item.id} compact label={`Export ${item.kind}`} /><StatusBadge status={item.status} /></div>
                </div>
                <a href={`/work/${item.id}`} class="mt-7 block min-w-0">
                  <h2 class="tk-display [overflow-wrap:anywhere] text-2xl font-extrabold">{item.name}</h2>
                  <p class="mt-3 line-clamp-3 text-sm leading-6 text-tk-graphite">{item.description || `Open this ${item.kind} to add details or plan its execution.`}</p>
                </a>
                <div class="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-tk-graphite">
                  <span>{item.parentId ? 'Inside another work item' : 'Inbox / root'}</span>
                  <a href={`/work/${item.id}`} class="inline-flex items-center gap-1.5 font-bold text-[var(--foreground)]">Open <ArrowUpRightIcon size={14} aria-hidden="true" /></a>
                </div>
              </article>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    {#if work.hasNextPage}
      <div class="mt-6 flex items-center gap-3">
        <button type="button" class="min-h-11 rounded-xl border border-[var(--border)] px-4 font-semibold" disabled={work.isFetchingNextPage} onclick={() => work.fetchNextPage()}>{work.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>
        <span class="text-sm text-[var(--muted)]">More {current.label.toLowerCase()} available</span>
      </div>
    {/if}
    {#if work.isFetchNextPageError}<p class="mt-3 text-sm" role="alert">Could not load more. Try Load more again.</p>{/if}
  </div>
</div>
