<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import WorkComposer from '$lib/components/work/WorkComposer.svelte';
  import WorkEditor from '$lib/components/work/WorkEditor.svelte';
  import WorkItemRow from '$lib/components/work/WorkItemRow.svelte';
  import KindMark from '$lib/components/work/KindMark.svelte';
  import StatusBadge from '$lib/components/work/StatusBadge.svelte';
  import WorkItemAnalyticsCard from '$lib/components/analytics/WorkItemAnalyticsCard.svelte';
  import {
    deleteWorkItem,
    flattenWorkTree,
    getProjectNextAction,
    getWorkItem,
    getWorkItemTree,
    reorderWorkItem,
    WorkConflictError,
    type WorkItem,
    type WorkItemKind
  } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { formatDate, formatDuration, kindLabel } from '$lib/utils';

  let id = $derived(page.params.id ?? '');
  const queryClient = useQueryClient();
  let actionError = $state('');
  let movingId = $state<string | null>(null);
  let deleting = $state(false);

  const detail = createQuery(() => ({
    queryKey: queryKeys.work.detail(id),
    queryFn: () => getWorkItem(id)
  }));

  const tree = createQuery(() => ({
    queryKey: queryKeys.work.tree(id),
    queryFn: () => getWorkItemTree(id),
    enabled: Boolean(detail.data?.item && detail.data.item.kind !== 'chore')
  }));

  const nextAction = createQuery(() => ({
    queryKey: queryKeys.work.nextAction(id),
    queryFn: () => getProjectNextAction(id),
    enabled: detail.data?.item.kind === 'project'
  }));

  const item = $derived(detail.data?.item ?? null);
  const rows = $derived(tree.data ? flattenWorkTree(tree.data).slice(1) : []);
  const directChildren = $derived(tree.data?.children ?? []);
  const backHref = $derived(
    item?.parentId ? `/work/${item.parentId}` : item?.kind === 'project' ? '/projects' : '/inbox'
  );
  const childKinds = $derived<WorkItemKind[]>(
    item?.kind === 'project' ? ['sprint', 'chore'] : item?.kind === 'sprint' ? ['chore'] : []
  );

  async function refreshWork() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
  }

  async function moveChild(child: WorkItem, index: number, direction: -1 | 1) {
    const sibling = directChildren[index + direction];
    if (!sibling) return;
    movingId = child.id;
    actionError = '';
    try {
      const current = await getWorkItem(child.id);
      await reorderWorkItem(
        child.id,
        direction < 0 ? { beforeId: sibling.id } : { afterId: sibling.id },
        current.etag
      );
      await refreshWork();
    } catch (cause) {
      actionError = cause instanceof WorkConflictError
        ? 'The order changed on another client. The latest hierarchy has been loaded; try again.'
        : problemMessage(cause, 'Could not reorder this item.');
      await refreshWork();
    } finally {
      movingId = null;
    }
  }

  async function removeItem() {
    if (!item || !confirm(`Delete “${item.name}”? This uses Taskiller’s normal soft-delete rules.`)) return;
    deleting = true;
    actionError = '';
    try {
      await deleteWorkItem(item.id, detail.data?.etag);
      await refreshWork();
      await goto(backHref);
    } catch (cause) {
      actionError = cause instanceof WorkConflictError
        ? 'This item changed elsewhere. Reload the latest version before deleting.'
        : problemMessage(cause, 'Could not delete this item.');
      await detail.refetch();
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head><title>{item?.name || 'Work item'} — Taskiller</title></svelte:head>

<div class="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  {#if detail.isPending}
    <div class="space-y-5">
      <div class="h-8 w-32 animate-pulse rounded bg-black/[0.05]"></div>
      <div class="h-20 max-w-2xl animate-pulse rounded-[18px] bg-black/[0.05]"></div>
      <div class="grid gap-7 lg:grid-cols-[minmax(0,1fr)_350px]"><div class="h-96 animate-pulse rounded-[20px] bg-black/[0.05]"></div><div class="h-96 animate-pulse rounded-[20px] bg-black/[0.05]"></div></div>
    </div>
  {:else if detail.isError || !item}
    <a href="/today" class="inline-flex items-center gap-2 text-sm font-bold text-tk-graphite"><ArrowLeftIcon size={16} /> Today</a>
    <div class="mt-8 rounded-[20px] border border-red-200 bg-red-50 p-6 text-red-800">Couldn’t load this work item.</div>
  {:else}
    <a href={backHref} class="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-bold text-tk-graphite hover:text-tk-ink">
      <ArrowLeftIcon size={16} /> Back
    </a>

    <header class="mt-6 flex flex-wrap items-start justify-between gap-6 border-b border-[var(--border)] pb-8">
      <div class="flex min-w-0 items-start gap-4">
        <KindMark kind={item.kind} class="mt-1 size-11" />
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <Badge tone={item.kind === 'project' ? 'blue' : item.kind === 'sprint' ? 'neutral' : 'accent'}>{kindLabel(item.kind)}</Badge>
            <StatusBadge status={item.status} />
          </div>
          <h1 class="tk-display mt-3 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl">{item.name}</h1>
          {#if item.description}<p class="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-7 text-tk-graphite">{item.description}</p>{/if}
        </div>
      </div>
      <Button variant="ghost" class="text-red-700 hover:bg-red-50" disabled={deleting} onclick={removeItem}>
        <TrashIcon size={17} /> {deleting ? 'Deleting…' : 'Delete'}
      </Button>
    </header>

    {#if actionError}<div class="mt-5 rounded-[14px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{actionError}</div>{/if}

    <div class="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_350px]">
      <main class="min-w-0 space-y-7">
        {#if item.kind === 'project'}
          <section class="relative overflow-hidden rounded-[22px] bg-tk-ink p-6 text-white sm:p-7">
            <div class="absolute -right-16 -top-16 size-48 rounded-full bg-tk-blue/20 blur-3xl"></div>
            <div class="relative flex flex-wrap items-end justify-between gap-5">
              <div>
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-white/45"><LightningIcon size={15} class="text-tk-strike" /> Next actionable work</div>
                {#if nextAction.isPending}
                  <div class="mt-5 h-8 w-56 animate-pulse rounded bg-white/10"></div>
                {:else if nextAction.data?.nextAction}
                  <h2 class="tk-display mt-4 text-2xl font-bold sm:text-3xl">{nextAction.data.nextAction.name}</h2>
                  <p class="mt-2 text-sm text-white/50">{kindLabel(nextAction.data.nextAction.kind)} · {nextAction.data.nextAction.status.replace('_', ' ')}</p>
                {:else}
                  <h2 class="tk-display mt-4 text-2xl font-bold">Nothing executable right now.</h2>
                  <p class="mt-2 text-sm text-white/50">Add or reactivate a Sprint or Chore below.</p>
                {/if}
              </div>
              {#if nextAction.data?.nextAction}
                <div class="flex flex-wrap gap-2">
                  <a href={`/work/${nextAction.data.nextAction.id}`} class="inline-flex h-11 items-center gap-2 rounded-[13px] border border-white/15 bg-white/10 px-4 text-sm font-bold text-white">Open next <ArrowRightIcon size={16} /></a>
                  <a href={`/work/${nextAction.data.nextAction.id}/plan`} class="inline-flex h-11 items-center gap-2 rounded-[13px] bg-tk-strike px-4 text-sm font-bold text-[#1a1512]">Plan & Start <LightningIcon size={16} weight="fill" /></a>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        {#if item.kind === 'sprint'}
          <section class="rounded-[22px] bg-tk-ink p-6 text-white sm:p-7">
            <div class="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">Execution</p>
                <h2 class="tk-display mt-2 text-2xl font-bold">Build the Sprint plan around its Chores.</h2>
                <p class="mt-3 max-w-xl text-sm leading-6 text-white/55">Recommendation generation can preserve linked Chores, and you can edit the segment sequence before starting.</p>
              </div>
              <a href={`/work/${item.id}/plan`} class="inline-flex h-11 items-center gap-2 rounded-[13px] bg-tk-strike px-4 text-sm font-bold text-[#1a1512]">Plan & Start <LightningIcon size={16} weight="fill" /></a>
            </div>
          </section>
        {/if}

        {#if item.kind !== 'chore'}
          <section>
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-tk-graphite"><TreeStructureIcon size={15} /> Hierarchy</div>
                <h2 class="mt-1 text-xl font-bold">{item.kind === 'project' ? 'Sprints & chores' : 'Sprint chores'}</h2>
              </div>
              <span class="text-sm text-tk-graphite">{rows.length} descendants</span>
            </div>

            <div class="mt-4">
              <WorkComposer parentId={item.id} defaultKind={childKinds[0] ?? 'chore'} allowedKinds={childKinds} compact label="Add" />
            </div>

            {#if tree.isPending}
              <div class="mt-5 space-y-2">{#each Array(4) as _}<div class="h-16 animate-pulse rounded-[14px] bg-black/[0.045]"></div>{/each}</div>
            {:else if rows.length === 0}
              <div class="mt-5 rounded-[20px] border border-dashed border-[var(--border)] bg-white/45 p-10 text-center text-sm text-tk-graphite">No children yet. Add the next layer above.</div>
            {:else}
              <div class="mt-5 rounded-[20px] border border-[var(--border)] bg-white/72 px-4 sm:px-5">
                {#each rows as row}
                  {@const directIndex = row.depth === 1 ? directChildren.findIndex((child) => child.id === row.item.id) : -1}
                  <div class:opacity-50={movingId === row.item.id}>
                    <WorkItemRow
                      item={row.item}
                      depth={Math.max(0, row.depth - 1)}
                      canMoveUp={directIndex > 0}
                      canMoveDown={directIndex >= 0 && directIndex < directChildren.length - 1}
                      onmoveup={directIndex >= 0 ? () => moveChild(row.item, directIndex, -1) : undefined}
                      onmovedown={directIndex >= 0 ? () => moveChild(row.item, directIndex, 1) : undefined}
                    />
                  </div>
                {/each}
              </div>
            {/if}
            <p class="mt-3 text-xs leading-5 text-tk-graphite">Direct children have explicit up/down controls so reordering never depends on drag-and-drop. Nested descendants keep their own parent’s order.</p>
          </section>
        {:else}
          <section class="rounded-[22px] bg-tk-ink p-6 text-white sm:p-7">
            <div class="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">Execution</p>
                <h2 class="tk-display mt-2 text-2xl font-bold">Turn this Chore into a Focus Plan.</h2>
                <p class="mt-3 max-w-xl text-sm leading-6 text-white/55">Generate a recommendation from the task context, edit the timer structure, save it, then start.</p>
              </div>
              <a href={`/work/${item.id}/plan`} class="inline-flex h-11 items-center gap-2 rounded-[13px] bg-tk-strike px-4 text-sm font-bold text-[#1a1512]">Plan & Start <LightningIcon size={16} weight="fill" /></a>
            </div>
          </section>
        {/if}
      </main>

      <aside class="space-y-4">
        <WorkEditor item={item} etag={detail.data?.etag ?? null} onupdated={() => detail.refetch()} />
        <section class="rounded-[20px] border border-[var(--border)] bg-white/70 p-5">
          <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">At a glance</p>
          <dl class="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
            <div><dt class="text-xs text-tk-graphite">Estimate</dt><dd class="tk-mono mt-1 font-semibold">{formatDuration(item.estimatedEffortSeconds)}</dd></div>
            <div><dt class="text-xs text-tk-graphite">Priority</dt><dd class="mt-1 font-semibold">{item.priority ?? '—'}</dd></div>
            <div><dt class="text-xs text-tk-graphite">Planned</dt><dd class="mt-1 font-semibold">{formatDate(item.plannedStartAt)}</dd></div>
            <div><dt class="text-xs text-tk-graphite">Deadline</dt><dd class="mt-1 font-semibold">{formatDate(item.deadlineAt)}</dd></div>
          </dl>
        </section>
        <WorkItemAnalyticsCard workItemId={item.id} />
      </aside>
    </div>
  {/if}
</div>
