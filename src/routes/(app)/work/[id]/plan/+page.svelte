<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import MagicWandIcon from 'phosphor-svelte/lib/MagicWandIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import SpinnerGapIcon from 'phosphor-svelte/lib/SpinnerGapIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import RecommendationReasons from '$lib/components/focus/RecommendationReasons.svelte';
  import SegmentEditor from '$lib/components/focus/SegmentEditor.svelte';
  import {
    createFocusPlan,
    createRecommendation,
    editableSegments,
    FocusPlanConflictError,
    getFocusPlan,
    listFocusPlans,
    updateFocusPlan,
    type FocusPlan,
    type FocusPlanRecommendation,
    type FocusPlanSegmentInput,
    type RecommendationStrategy
  } from '$lib/api/focus';
  import { getActiveSession, OpenSessionConflictError, startExecutionSession } from '$lib/api/execution';
  import { getProjectNextAction, getWorkItem, getWorkItemTree, flattenWorkTree, type WorkItem } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { formatDuration, kindLabel } from '$lib/utils';

  let id = $derived(page.params.id ?? '');
  const queryClient = useQueryClient();

  let strategy = $state<RecommendationStrategy>('auto');
  let availableMinutes = $state('');
  let recommendation = $state<FocusPlanRecommendation | null>(null);
  let segments = $state<FocusPlanSegmentInput[]>([]);
  let planName = $state('Focus plan');
  let loadedPlanId = $state<string | null>(null);
  let loadedPlanEtag = $state<string | null>(null);
  let loadedRecommendationId = $state<string | null>(null);
  let busy = $state<'recommend' | 'save' | 'start' | 'load' | null>(null);
  let errorMessage = $state('');
  let notice = $state('');
  let conflict = $state(false);
  let openSession = $state<{ id: string; workItemId: string } | null>(null);

  const detail = createQuery(() => ({
    queryKey: queryKeys.work.detail(id),
    queryFn: () => getWorkItem(id)
  }));
  const tree = createQuery(() => ({
    queryKey: queryKeys.work.tree(id),
    queryFn: () => getWorkItemTree(id),
    enabled: detail.data?.item.kind === 'sprint'
  }));
  const plans = createQuery(() => ({
    queryKey: queryKeys.focus.plans(id),
    queryFn: () => listFocusPlans(id),
    enabled: Boolean(detail.data?.item && detail.data.item.kind !== 'project')
  }));
  const active = createQuery(() => ({
    queryKey: queryKeys.execution.active,
    queryFn: getActiveSession
  }));
  const nextAction = createQuery(() => ({
    queryKey: queryKeys.work.nextAction(id),
    queryFn: () => getProjectNextAction(id),
    enabled: detail.data?.item.kind === 'project'
  }));

  const item = $derived(detail.data?.item ?? null);
  const recommendationContextReady = $derived(
    item?.kind !== 'chore' || Boolean(item.workTypeId || item.effectiveCharacteristics)
  );
  const linkedChores = $derived<WorkItem[]>(
    tree.data
      ? flattenWorkTree(tree.data)
          .map((row) => row.item)
          .filter((candidate) => candidate.kind === 'chore')
      : []
  );
  const totalTargetSeconds = $derived(
    segments.reduce((total, segment) => total + (segment.targetSeconds ?? 0), 0)
  );

  function resetMessages() {
    errorMessage = '';
    notice = '';
    conflict = false;
    openSession = null;
  }

  function replaceSegment(index: number, patch: Partial<FocusPlanSegmentInput>) {
    segments = segments.map((segment, position) =>
      position === index ? { ...segment, ...patch } : segment
    );
  }

  function removeSegment(index: number) {
    segments = segments.filter((_, position) => position !== index);
  }

  function moveSegment(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= segments.length) return;

    const next = [...segments];
    const currentSegment = next[index];
    const targetSegment = next[target];
    if (!currentSegment || !targetSegment) return;

    next[index] = targetSegment;
    next[target] = currentSegment;
    segments = next;
  }

  function addSegment() {
    const linked = item?.kind === 'sprint' ? linkedChores[0]?.id ?? null : id;
    segments = [
      ...segments,
      {
        kind: 'work',
        durationMode: 'fixed',
        targetSeconds: 25 * 60,
        linkedWorkItemId: linked,
        optional: false,
        label: 'Work block'
      }
    ];
  }

  function startScratch() {
    resetMessages();
    recommendation = null;
    loadedPlanId = null;
    loadedPlanEtag = null;
    loadedRecommendationId = null;
    planName = `${item?.name ?? 'Task'} focus`;
    const estimate = item?.estimatedEffortSeconds;
    segments = [
      {
        kind: 'work',
        durationMode: 'fixed',
        targetSeconds: estimate && estimate > 0 ? Math.min(estimate, 90 * 60) : 25 * 60,
        linkedWorkItemId: item?.kind === 'sprint' ? linkedChores[0]?.id ?? null : id,
        optional: false,
        label: 'Work block'
      }
    ];
  }

  async function generateRecommendation() {
    if (!item || item.kind === 'project') return;
    resetMessages();
    busy = 'recommend';
    try {
      const minutes = Number(availableMinutes);
      const result = await createRecommendation({
        workItemId: item.id,
        preferredStrategy: strategy,
        ...(Number.isFinite(minutes) && minutes >= 5 ? { availableTimeSeconds: Math.round(minutes * 60) } : {})
      });
      recommendation = result;
      loadedPlanId = null;
      loadedPlanEtag = null;
      loadedRecommendationId = result.id;
      planName = `${item.name} · ${result.plan.strategy ?? strategy}`;
      segments = result.plan.segments.map((segment) => ({ ...segment }));
      notice = 'Recommendation loaded as an editable draft.';
    } catch (error) {
      errorMessage = problemMessage(error, 'Couldn’t generate a recommendation.');
    } finally {
      busy = null;
    }
  }

  async function loadPlan(plan: FocusPlan) {
    resetMessages();
    busy = 'load';
    try {
      const loaded = await getFocusPlan(plan.id);
      recommendation = null;
      loadedPlanId = loaded.plan.id;
      loadedPlanEtag = loaded.etag;
      loadedRecommendationId = loaded.plan.recommendationId;
      planName = loaded.plan.name;
      segments = editableSegments(loaded.plan);
      notice = 'Saved plan loaded. Changes will use optimistic concurrency.';
    } catch (error) {
      errorMessage = problemMessage(error, 'Couldn’t load the Focus Plan.');
    } finally {
      busy = null;
    }
  }

  function normalizedSegments(): FocusPlanSegmentInput[] {
    return segments.map((segment) => {
      const nonWork = ['break', 'long_break', 'transition'].includes(segment.kind);
      if (segment.durationMode === 'open') {
        return {
          ...segment,
          targetSeconds: null,
          minSeconds: null,
          maxSeconds: null,
          ...(nonWork ? { linkedWorkItemId: null } : {})
        };
      }
      return { ...segment, ...(nonWork ? { linkedWorkItemId: null } : {}) };
    });
  }

  function validateDraft(): string | null {
    if (!planName.trim()) return 'Give the Focus Plan a name.';
    if (segments.length === 0) return 'Add at least one segment.';
    for (const segment of segments) {
      if (segment.durationMode !== 'open' && !segment.targetSeconds) {
        return 'Every fixed or flexible segment needs a target duration.';
      }
      if (
        segment.minSeconds != null &&
        segment.maxSeconds != null &&
        segment.minSeconds > segment.maxSeconds
      ) {
        return 'A segment minimum cannot exceed its maximum.';
      }
    }
    return null;
  }

  async function savePlan(): Promise<{ id: string; recommendationId: string | null } | null> {
    if (!item || item.kind === 'project') return null;
    resetMessages();
    const validation = validateDraft();
    if (validation) {
      errorMessage = validation;
      return null;
    }
    busy = 'save';
    try {
      if (loadedPlanId) {
        const result = await updateFocusPlan(
          loadedPlanId,
          { name: planName.trim(), segments: normalizedSegments() },
          loadedPlanEtag
        );
        loadedPlanEtag = result.etag;
        loadedRecommendationId = result.plan.recommendationId;
        segments = editableSegments(result.plan);
        notice = 'Focus Plan updated.';
        await queryClient.invalidateQueries({ queryKey: queryKeys.focus.plans(id) });
        return { id: result.plan.id, recommendationId: result.plan.recommendationId };
      }

      const result = await createFocusPlan({
        workItemId: item.id,
        recommendationId: loadedRecommendationId,
        source: loadedRecommendationId ? 'recommendation' : 'manual',
        name: planName.trim(),
        template: false,
        segments: normalizedSegments()
      });
      loadedPlanId = result.plan.id;
      loadedPlanEtag = result.etag;
      loadedRecommendationId = result.plan.recommendationId;
      segments = editableSegments(result.plan);
      notice = 'Focus Plan saved.';
      await queryClient.invalidateQueries({ queryKey: queryKeys.focus.plans(id) });
      return { id: result.plan.id, recommendationId: result.plan.recommendationId };
    } catch (error) {
      if (error instanceof FocusPlanConflictError) {
        conflict = true;
        errorMessage = 'This plan changed elsewhere. Your draft is still here; reload the saved plan before overwriting it.';
      } else {
        errorMessage = problemMessage(error, 'Couldn’t save the Focus Plan.');
      }
      return null;
    } finally {
      busy = null;
    }
  }

  async function saveAndStart() {
    if (!item || item.kind === 'project') return;
    resetMessages();
    let saved: { id: string; recommendationId: string | null } | null = null;
    if (loadedPlanId) {
      saved = await savePlan();
    } else {
      saved = await savePlan();
    }
    if (!saved) return;

    busy = 'start';
    try {
      const started = await startExecutionSession({
        workItemId: item.id,
        focusPlanId: saved.id,
        recommendationId: saved.recommendationId
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.execution.active });
      goto(`/session/${started.session.id}`);
    } catch (error) {
      if (error instanceof OpenSessionConflictError) {
        openSession = error.activeSession
          ? { id: error.activeSession.id, workItemId: error.activeSession.workItemId }
          : null;
        errorMessage = error.activeSession
          ? 'Another session is already active. Resume it instead of opening a second one.'
          : 'Another session is already active.';
        await queryClient.invalidateQueries({ queryKey: queryKeys.execution.active });
      } else {
        errorMessage = problemMessage(error, 'Couldn’t start the session.');
      }
    } finally {
      busy = null;
    }
  }
</script>

<svelte:head><title>Plan & Start — Taskiller</title></svelte:head>

<div class="mx-auto max-w-[1280px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
  <a href={`/work/${id}`} class="inline-flex items-center gap-1.5 text-sm font-bold text-tk-graphite hover:text-tk-ink"><ArrowLeftIcon size={15} /> Work item</a>

  {#if detail.isPending}
    <div class="mt-8 h-80 animate-pulse rounded-[24px] bg-black/[0.045]"></div>
  {:else if detail.isError || !item}
    <div class="mt-8 rounded-[20px] border border-red-200 bg-red-50 p-6 text-red-800">Couldn’t load this work item.</div>
  {:else if item.kind === 'project'}
    <section class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="rounded-[26px] bg-tk-ink p-7 text-white sm:p-9">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-white/45">Project handoff</p>
        <h1 class="tk-display mt-3 text-4xl font-extrabold sm:text-5xl">Projects don’t run. Their next action does.</h1>
        <p class="mt-5 max-w-2xl text-base leading-7 text-white/60">Taskiller keeps Projects as containers. Plan & Start should target the executable Sprint or Chore selected by the backend.</p>
      </div>
      <div class="rounded-[22px] border border-[var(--border)] bg-white/76 p-6">
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Server-selected next action</p>
        {#if nextAction.isPending}
          <div class="mt-5 h-20 animate-pulse rounded-[14px] bg-black/[0.05]"></div>
        {:else if nextAction.data?.nextAction}
          <h2 class="mt-4 text-xl font-bold">{nextAction.data.nextAction.name}</h2>
          <p class="mt-1 text-sm text-tk-graphite">{kindLabel(nextAction.data.nextAction.kind)} · {nextAction.data.nextAction.status.replaceAll('_', ' ')}</p>
          <a href={`/work/${nextAction.data.nextAction.id}/plan`} class="mt-5 inline-flex h-11 items-center gap-2 rounded-[13px] bg-tk-strike px-4 text-sm font-bold text-[#1a1512]">Plan & Start <LightningIcon size={16} weight="fill" /></a>
        {:else}
          <p class="mt-4 text-sm leading-6 text-tk-graphite">This Project has no executable next action yet. Add or ready a Sprint/Chore first.</p>
        {/if}
      </div>
    </section>
  {:else}
    <header class="mt-6 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--border)] pb-7">
      <div>
        <div class="mb-2 flex items-center gap-2"><Badge>{kindLabel(item.kind)}</Badge><span class="text-xs text-tk-graphite">{item.status.replaceAll('_', ' ')}</span></div>
        <h1 class="tk-display text-4xl font-extrabold sm:text-5xl">Plan & Start</h1>
        <p class="mt-2 max-w-2xl text-base leading-7 text-tk-graphite">{item.name}</p>
      </div>
      {#if active.data?.session}
        <a href={`/session/${active.data.session.id}`} class="rounded-full bg-tk-ink px-4 py-2 text-sm font-bold text-white">Resume active session</a>
      {/if}
    </header>

    {#if errorMessage}
      <div class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <span class="flex items-center gap-2"><WarningCircleIcon size={18} /> {errorMessage}</span>
        {#if openSession}<a class="font-bold underline" href={`/session/${openSession.id}`}>Resume session</a>{/if}
        {#if conflict && loadedPlanId}<button class="font-bold underline" onclick={() => plans.refetch()}>Refresh saved plans</button>{/if}
      </div>
    {:else if notice}
      <div class="mt-5 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>
    {/if}

    {#if item.kind === 'chore' && !recommendationContextReady}
      <div class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <span>Generated plans need a Work Type or complete characteristic overrides for this Chore.</span>
        <a class="font-bold underline underline-offset-4" href={`/work/${id}#work-details`}>Set Work Type</a>
      </div>
    {:else if item.kind === 'sprint'}
      <div class="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-tk-graphite">
        Sprint recommendations use eligible child Chores. Give child Chores a Work Type (or complete overrides) and a positive effort estimate so they can participate in the generated plan.
      </div>
    {/if}

    <div class="mt-7 grid gap-7 xl:grid-cols-[330px_minmax(0,1fr)_300px]">
      <aside class="space-y-5">
        <section class="rounded-[20px] border border-[var(--border)] bg-white/76 p-5">
          <div class="flex items-center gap-2"><MagicWandIcon size={18} class="text-tk-strike" weight="fill" /><h2 class="font-bold">Recommendation</h2></div>
          <p class="mt-2 text-sm leading-6 text-tk-graphite">Ask the backend to shape a plan from task characteristics, preferences, and eligible personal history.</p>
          <label class="mt-5 block text-xs font-bold text-tk-graphite">Strategy
            <Select bind:value={strategy}>
              <option value="auto">Auto</option><option value="continuous">Continuous</option><option value="structured">Structured</option><option value="flexible">Flexible</option>
            </Select>
          </label>
          <label class="mt-3 block text-xs font-bold text-tk-graphite">Available minutes
            <Input type="number" min="5" max="720" placeholder="Optional" bind:value={availableMinutes} />
          </label>
          <Button class="mt-4 w-full" disabled={busy !== null || !recommendationContextReady} onclick={generateRecommendation}>
            {#if busy === 'recommend'}<SpinnerGapIcon size={17} class="animate-spin" />{:else}<MagicWandIcon size={17} />{/if}
            Generate plan
          </Button>
          <Button class="mt-2 w-full" variant="secondary" disabled={busy !== null} onclick={startScratch}>Start from scratch</Button>
        </section>

        <section class="rounded-[20px] border border-[var(--border)] bg-white/76 p-5">
          <div class="flex items-center justify-between"><h2 class="font-bold">Saved plans</h2><span class="text-xs text-tk-graphite">{plans.data?.items.length ?? 0}</span></div>
          <div class="mt-3 space-y-2">
            {#if plans.isPending}
              <div class="h-16 animate-pulse rounded-[13px] bg-black/[0.05]"></div>
            {:else if plans.data?.items.length}
              {#each plans.data.items as saved}
                <button onclick={() => loadPlan(saved)} class="w-full rounded-[13px] border border-transparent bg-[#f1f1ed] px-3.5 py-3 text-left hover:border-[var(--border-strong)] hover:bg-white">
                  <p class="truncate text-sm font-bold">{saved.name}</p>
                  <p class="mt-1 text-xs text-tk-graphite">{saved.segments.length} segments · v{saved.version}</p>
                </button>
              {/each}
            {:else}
              <p class="text-sm leading-6 text-tk-graphite">No saved Focus Plans for this item yet.</p>
            {/if}
          </div>
        </section>
      </aside>

      <main class="min-w-0">
        <section class="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-[220px] flex-1">
              <label for="focus-plan-name" class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Plan name</label>
              <Input id="focus-plan-name" class="mt-1.5" bind:value={planName} placeholder="Focus plan" />
            </div>
            <div class="rounded-[14px] bg-[var(--surface-subtle)] px-4 py-3 text-right">
              <p class="text-[10px] font-bold uppercase tracking-[0.1em] text-tk-graphite">Target time</p>
              <p class="tk-mono mt-1 text-lg font-bold">{formatDuration(totalTargetSeconds)}</p>
            </div>
          </div>

          {#if segments.length}
            <div class="mt-5 space-y-3">
              {#each segments as segment, index}
                <SegmentEditor
                  {segment}
                  {index}
                  total={segments.length}
                  linkedOptions={linkedChores}
                  onpatch={(patch) => replaceSegment(index, patch)}
                  onremove={() => removeSegment(index)}
                  onmove={(direction) => moveSegment(index, direction)}
                />
              {/each}
            </div>
          {:else}
            <div class="mt-5 rounded-[18px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)]/55 px-6 py-12 text-center">
              <p class="text-lg font-bold">No plan on the table yet.</p>
              <p class="mt-2 text-sm text-tk-graphite">Generate a recommendation or start from scratch.</p>
            </div>
          {/if}

          <Button class="mt-4" variant="secondary" onclick={addSegment}><PlusIcon size={16} /> Add segment</Button>
        </section>

        {#if recommendation}
          <div class="mt-5"><RecommendationReasons reasons={recommendation.reasons} provenance={recommendation.provenance} /></div>
        {/if}
      </main>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-tk-ink p-6 text-white">
          <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">Ready when you are</p>
          <h2 class="tk-display mt-3 text-2xl font-bold">Save the plan, then enter execution.</h2>
          <p class="mt-3 text-sm leading-6 text-white/55">Starting creates an immutable session snapshot. Editing this Focus Plan later won’t rewrite history.</p>
          <Button class="mt-6 w-full" variant="dark" disabled={busy !== null || !segments.length} onclick={saveAndStart}>
            {#if busy === 'start' || busy === 'save'}<SpinnerGapIcon size={17} class="animate-spin" />{:else}<LightningIcon size={17} weight="fill" />{/if}
            Save & start
          </Button>
          <Button class="mt-2 w-full border-white/15 text-white hover:bg-white/10" variant="ghost" disabled={busy !== null || !segments.length} onclick={savePlan}>
            <FloppyDiskIcon size={17} /> Save only
          </Button>
        </section>

        <section class="rounded-[20px] border border-[var(--border)] bg-white/76 p-5 text-sm">
          <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Context</p>
          <dl class="mt-4 space-y-3">
            <div class="flex justify-between gap-3"><dt class="text-tk-graphite">Task estimate</dt><dd class="tk-mono font-bold">{formatDuration(item.estimatedEffortSeconds)}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-tk-graphite">Draft segments</dt><dd class="font-bold">{segments.length}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-tk-graphite">Source</dt><dd class="font-bold">{loadedRecommendationId ? 'Recommendation' : 'Manual'}</dd></div>
          </dl>
        </section>
      </aside>
    </div>
  {/if}
</div>
