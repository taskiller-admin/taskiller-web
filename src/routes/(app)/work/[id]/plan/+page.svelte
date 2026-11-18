<script lang="ts">
  import { protectUnsaved } from '$lib/actions/unsaved';
  import WorkTypeSelect from '$lib/components/work/WorkTypeSelect.svelte';
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
  import { updateWorkItem, getProjectNextAction, getWorkItem, getWorkItemTree, flattenWorkTree, type WorkItem } from '$lib/api/work';
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
  let busy = $state<'recommend' | 'save' | 'start' | 'load' | 'prerequisite' | null>(null);
  let errorMessage = $state('');
  let notice = $state('');
  let conflict = $state(false);
  let openSession = $state<{ id: string; workItemId: string } | null>(null);

  let selectedWorkType = $state('');
  let baseline = $state(JSON.stringify(['Focus plan', []]));
  const draft = $derived(JSON.stringify([planName, segments]));
  const dirty = $derived(draft !== baseline || selectedWorkType !== '');
  protectUnsaved(() => dirty);

  function canReplace() {
    return !busy && (!dirty || confirm('Replace your unsaved Focus Plan changes?'));
  }

  async function saveWorkType() {
    if (busy || !selectedWorkType || !detail.data?.etag) return;
    resetMessages();
    busy = 'prerequisite';
    try {
      const saved = await updateWorkItem(id, { workTypeId: selectedWorkType }, detail.data.etag);
      queryClient.setQueryData(queryKeys.work.detail(id), saved);
      selectedWorkType = '';
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
      notice = 'Work Type saved. You can now generate a plan.';
    } catch (error) {
      errorMessage = problemMessage(error, 'Couldn’t save the Work Type. Reload the work item and try again.');
    } finally {
      busy = null;
    }
  }

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
    if (!canReplace()) return;
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
    if (!item || item.kind === 'project' || !canReplace()) return;
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
    if (!canReplace()) return;
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
      baseline = JSON.stringify([planName, segments]);
      notice = 'Saved plan loaded.';
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
        planName = result.plan.name;
        baseline = JSON.stringify([planName, segments]);
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
      planName = result.plan.name;
      baseline = JSON.stringify([planName, segments]);
      notice = 'Focus Plan saved.';
      await queryClient.invalidateQueries({ queryKey: queryKeys.focus.plans(id) });
      return { id: result.plan.id, recommendationId: result.plan.recommendationId };
    } catch (error) {
      if (error instanceof FocusPlanConflictError) {
        conflict = true;
        errorMessage = 'This plan changed elsewhere. Your draft is still here. Refresh saved plans, then choose a plan to reload or keep editing this draft.';
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

<div class="tk-page mx-auto max-w-[1280px] px-5 pb-48 pt-7 sm:px-8 lg:px-12 xl:pb-10">
  <a href={`/work/${id}`} class="inline-flex items-center gap-1.5 text-sm font-bold text-tk-graphite hover:text-[var(--foreground)]"><ArrowLeftIcon size={15} aria-hidden="true" /> Work item</a>

  {#if detail.isPending}
    <div class="mt-8 h-80 animate-pulse rounded-[14px] bg-[var(--surface-subtle)]"></div>
  {:else if detail.isError || !item}
    <div role="alert" class="mt-8 rounded-[14px] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-6 text-[var(--danger-text)]">Couldn’t load this work item. <button class="underline" onclick={() => detail.refetch()}>Try again</button></div>
  {:else if item.kind === 'project'}
    <section class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="rounded-[26px] bg-tk-ink p-7 text-white sm:p-9">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-white/75">Project handoff</p>
        <h1 class="tk-display mt-3 text-3xl font-extrabold sm:text-4xl">Projects don’t run. Their next action does.</h1>
        <p class="mt-5 max-w-2xl text-base leading-7 text-white/75">Taskiller keeps Projects as containers. Choose the next Sprint or Chore to plan its work.</p>
      </div>
      <div class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Next action</p>
        {#if nextAction.isPending}
          <div class="mt-5 h-20 animate-pulse rounded-[14px] bg-[var(--surface-subtle)]"></div>
        {:else if nextAction.data?.nextAction}
          <h2 class="mt-4 text-xl font-bold">{nextAction.data.nextAction.name}</h2>
          <p class="mt-1 text-sm text-tk-graphite">{kindLabel(nextAction.data.nextAction.kind)} · {nextAction.data.nextAction.status.replaceAll('_', ' ')}</p>
          <a href={`/work/${nextAction.data.nextAction.id}/plan`} class="mt-5 inline-flex h-11 items-center gap-2 rounded-[13px] bg-tk-strike px-4 text-sm font-bold text-[#1a1512]">Plan & Start <LightningIcon size={16} weight="fill" aria-hidden="true" /></a>
        {:else}
          <p class="mt-4 text-sm leading-6 text-tk-graphite">This Project has no executable next action yet. Add or ready a Sprint/Chore first.</p>
        {/if}
      </div>
    </section>
  {:else}
    <header class="mt-6 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--border)] pb-7">
      <div>
        <div class="mb-2 flex items-center gap-2"><Badge>{kindLabel(item.kind)}</Badge><span class="text-xs text-tk-graphite">{item.status.replaceAll('_', ' ')}</span></div>
        <h1 class="tk-display text-3xl font-extrabold sm:text-4xl">Plan & Start</h1>
        <p class="mt-2 max-w-2xl text-base leading-7 text-tk-graphite">{item.name}</p>
      </div>
      {#if active.data?.session}
        <a href={`/session/${active.data.session.id}`} class="rounded-full bg-tk-ink px-4 py-2 text-sm font-bold text-white">Resume active session</a>
      {/if}
    </header>

    {#if errorMessage}
      <div role="alert" class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
        <span class="flex items-center gap-2"><WarningCircleIcon size={18} aria-hidden="true" /> {errorMessage}</span>
        {#if openSession}<a class="font-bold underline" href={`/session/${openSession.id}`}>Resume session</a>{/if}
        {#if conflict && loadedPlanId}<button class="font-bold underline" onclick={() => plans.refetch()}>Refresh saved plans</button>{/if}
      </div>
    {:else if notice}
      <div role="status" class="mt-5 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>
    {/if}

    {#if item.kind === 'chore' && !recommendationContextReady}
      <div class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning-text)]">
        <span>Generated plans need a Work Type or complete characteristic overrides for this Chore.</span>
        <div class="w-full max-w-lg">
          <fieldset disabled={busy !== null}>
            <WorkTypeSelect bind:value={selectedWorkType} label="Work Type" help="Choose the kind of work to tailor this plan." />
            <Button class="mt-3" disabled={busy !== null || !selectedWorkType || !detail.data?.etag} onclick={saveWorkType}>Save Work Type</Button>
          </fieldset>
        </div>
      </div>
    {:else if item.kind === 'sprint'}
      <div class="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-tk-graphite">
        Sprint recommendations use eligible child Chores. Give child Chores a Work Type (or complete overrides) and a positive effort estimate so they can participate in the generated plan.
      </div>
    {/if}

    <div class="mt-7 grid gap-7 xl:grid-cols-[330px_minmax(0,1fr)_300px]">
      <aside class="space-y-5">
        <section class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div class="flex items-center gap-2"><MagicWandIcon size={18} class="text-tk-strike" weight="fill" aria-hidden="true" /><h2 class="font-bold">Recommendation</h2></div>
          <p class="mt-2 text-sm leading-6 text-tk-graphite">Build a starting plan from this work, your preferences, and past sessions.</p>
          <label class="mt-5 block text-xs font-bold text-tk-graphite">Strategy
            <Select bind:value={strategy}>
              <option value="auto">Auto</option><option value="continuous">Continuous</option><option value="structured">Structured</option><option value="flexible">Flexible</option>
            </Select>
          </label>
          <label class="mt-3 block text-xs font-bold text-tk-graphite">Available minutes
            <Input type="number" min="5" max="720" placeholder="Optional" bind:value={availableMinutes} />
          </label>
          <Button class="mt-4 w-full" disabled={busy !== null || !recommendationContextReady} onclick={generateRecommendation}>
            {#if busy === 'recommend'}<SpinnerGapIcon size={17} class="animate-spin" aria-hidden="true" />{:else}<MagicWandIcon size={17} aria-hidden="true" />{/if}
            Generate plan
          </Button>
          <Button class="mt-2 w-full" variant="secondary" disabled={busy !== null} onclick={startScratch}>Start from scratch</Button>
        </section>

        <section class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div class="flex items-center justify-between"><h2 class="font-bold">Saved plans</h2><span class="text-xs text-tk-graphite">{plans.data?.items.length ?? 0}</span></div>
          <div class="mt-3 space-y-2">
            {#if plans.isPending}
              <div class="h-16 animate-pulse rounded-[13px] bg-[var(--surface-subtle)]"></div>
            {:else if plans.isError}<p role="alert" class="text-sm">Couldn’t load saved plans. <button class="underline" onclick={() => plans.refetch()}>Try again</button></p>
            {:else if plans.data?.items.length}
              {#each plans.data.items as saved}
                <button disabled={busy !== null} onclick={() => loadPlan(saved)} class="w-full rounded-[13px] border border-transparent bg-[var(--surface-raised)] px-3.5 py-3 text-left hover:border-[var(--border-strong)] hover:bg-[var(--surface)]">
                  <p class="truncate text-sm font-bold">{saved.name}</p>
                  <p class="mt-1 text-xs text-tk-graphite">{saved.segments.length} segments</p>
                </button>
              {/each}
            {:else}
              <p class="text-sm leading-6 text-tk-graphite">No saved Focus Plans for this item yet.</p>
            {/if}
          </div>
        </section>
      </aside>

      <div class="min-w-0 xl:order-none {segments.length ? 'order-first' : ''}">
        <section class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-[220px] flex-1">
              <label for="focus-plan-name" class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Plan name</label>
              <Input disabled={busy !== null} id="focus-plan-name" class="mt-1.5" bind:value={planName} placeholder="Focus plan" />
            </div>
            <div class="rounded-[14px] bg-[var(--surface-subtle)] px-4 py-3 text-right">
              <p class="text-[10px] font-bold uppercase tracking-[0.1em] text-tk-graphite">Target time</p>
              <p class="tk-mono mt-1 text-lg font-bold">{formatDuration(totalTargetSeconds)}</p>
            </div>
          </div>

        {#if segments.length}
          <section aria-label="Focus Plan actions" class="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 rounded-[16px] border border-white/15 bg-[#111214] p-3 text-white shadow-lg xl:static xl:mt-5 xl:p-4">
          <p class="mb-2 text-xs text-white/75">Save & start opens your session. Save only keeps this plan for later.</p>
          <div class="grid grid-cols-2 gap-2">
          <Button class="w-full" variant="dark" disabled={busy !== null || !segments.length} onclick={saveAndStart}>
            {#if busy === 'start' || busy === 'save'}<SpinnerGapIcon size={17} class="animate-spin" aria-hidden="true" />{:else}<LightningIcon size={17} weight="fill" aria-hidden="true" />{/if}
            Save & start
          </Button>
          <Button class="w-full border-white/15 text-white hover:bg-white/10" variant="ghost" disabled={busy !== null || !segments.length} onclick={savePlan}>
            <FloppyDiskIcon size={17} aria-hidden="true" /> Save only
          </Button>
          </div>
          </section>
          {/if}

          {#if segments.length}
            <div class="mt-5 space-y-3">
              {#each segments as segment, index}
                <SegmentEditor
                  {segment}
                  disabled={busy !== null}
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
            <div class="mt-5 rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)]/55 px-6 py-12 text-center">
              <p class="text-lg font-bold">No plan on the table yet.</p>
              <p class="mt-2 text-sm text-tk-graphite">Generate a recommendation or start from scratch.</p>
            </div>
          {/if}

          <Button class="mt-4" variant="secondary" disabled={busy !== null} onclick={addSegment}><PlusIcon size={16} aria-hidden="true" /> Add segment</Button>
        </section>

        {#if recommendation}
          <div class="mt-5"><RecommendationReasons reasons={recommendation.reasons} provenance={recommendation.provenance} /></div>
        {/if}
      </div>

      <aside class="space-y-4">
        <section class="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 text-sm">
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
