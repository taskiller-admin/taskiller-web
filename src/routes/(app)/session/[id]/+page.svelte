<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import FlagCheckeredIcon from 'phosphor-svelte/lib/FlagCheckeredIcon';
  import PauseIcon from 'phosphor-svelte/lib/PauseIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import SkipForwardIcon from 'phosphor-svelte/lib/SkipForwardIcon';
  import SpinnerGapIcon from 'phosphor-svelte/lib/SpinnerGapIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import WifiSlashIcon from 'phosphor-svelte/lib/WifiSlashIcon';
  import ActiveSessionCard from '$lib/components/execution/ActiveSessionCard.svelte';
  import SessionReviewForm from '$lib/components/execution/SessionReviewForm.svelte';
  import SessionTimeline from '$lib/components/execution/SessionTimeline.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import {
    appendSessionEvent,
    getExecutionSession,
    getSessionReview,
    listSessionEvents,
    SessionConflictError,
    upsertSessionReview,
    type SessionEventInput,
    type SessionReviewInput
  } from '$lib/api/execution';
  import { getWorkItem } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { formatDuration } from '$lib/utils';

  const id = page.params.id;
  const queryClient = useQueryClient();

  let etag = $state<string | null>(null);
  let busy = $state<string | null>(null);
  let errorMessage = $state('');
  let notice = $state('');
  let reviewNotice = $state('');
  let online = $state(true);

  const session = createQuery(() => ({
    queryKey: queryKeys.execution.detail(id),
    queryFn: () => getExecutionSession(id),
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const state = query.state.data?.session.state;
      return state === 'running' || state === 'paused' ? 15_000 : false;
    }
  }));

  $effect(() => {
    if (session.data?.etag) etag = session.data.etag;
  });

  const work = createQuery(() => ({
    queryKey: queryKeys.work.detail(session.data?.session.workItemId ?? ''),
    queryFn: () => getWorkItem(session.data!.session.workItemId),
    enabled: Boolean(session.data?.session.workItemId)
  }));

  const events = createQuery(() => ({
    queryKey: queryKeys.execution.events(id),
    queryFn: () => listSessionEvents(id),
    enabled: Boolean(session.data?.session)
  }));

  const current = $derived(
    session.data?.session.planSnapshot.segments[session.data.session.currentSegmentIndex] ?? null
  );
  const terminal = $derived(
    session.data?.session.state === 'completed' || session.data?.session.state === 'abandoned'
  );
  const planFinished = $derived(
    Boolean(session.data?.session && session.data.session.currentSegmentIndex >= session.data.session.planSnapshot.segments.length)
  );
  const currentStarted = $derived(Boolean(session.data?.session.currentSegmentStartedAt));
  const currentBreak = $derived(current?.kind === 'break' || current?.kind === 'long_break');
  const currentLinkedId = $derived(current?.linkedWorkItemId ?? null);
  const canCompleteWork = $derived(work.data?.item.kind === 'chore' || Boolean(currentLinkedId));

  const linkedWork = createQuery(() => ({
    queryKey: queryKeys.work.detail(currentLinkedId ?? ''),
    queryFn: () => getWorkItem(currentLinkedId!),
    enabled: Boolean(currentLinkedId && currentLinkedId !== session.data?.session.workItemId)
  }));

  const review = createQuery(() => ({
    queryKey: queryKeys.execution.review(id),
    queryFn: () => getSessionReview(id),
    enabled: terminal
  }));

  onMount(() => {
    online = navigator.onLine;
    const onOnline = async () => {
      online = true;
      notice = 'Back online. Session state refreshed.';
      await Promise.all([session.refetch(), events.refetch()]);
    };
    const onOffline = () => {
      online = false;
      notice = '';
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });

  function clearMessages() {
    errorMessage = '';
    notice = '';
  }

  async function sendEvent(action: string, payload: SessionEventInput) {
    if (!online) {
      errorMessage = 'You’re offline. Reconnect before changing session state.';
      return;
    }
    clearMessages();
    busy = action;
    try {
      const result = await appendSessionEvent(id, payload, etag);
      etag = result.etag;
      queryClient.setQueryData(queryKeys.execution.detail(id), {
        session: result.session,
        etag: result.etag
      });
      queryClient.setQueryData(queryKeys.execution.active, {
        session: ['completed', 'abandoned'].includes(result.session.state) ? null : result.session
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.execution.events(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.work.all })
      ]);
    } catch (error) {
      if (error instanceof SessionConflictError) {
        if (error.latest) {
          etag = error.latest.etag;
          queryClient.setQueryData(queryKeys.execution.detail(id), error.latest);
        }
        errorMessage = 'Session state changed on another client. I refreshed the latest server state; try the action again.';
      } else {
        errorMessage = problemMessage(error, 'Couldn’t update the session.');
      }
    } finally {
      busy = null;
    }
  }

  async function togglePause() {
    if (!session.data) return;
    await sendEvent(
      session.data.session.state === 'paused' ? 'resume' : 'pause',
      { type: session.data.session.state === 'paused' ? 'resumed' : 'paused' }
    );
  }

  async function startCurrent() {
    if (!session.data || !current) return;
    await sendEvent('start', {
      type: currentBreak ? 'break_started' : 'segment_started',
      segmentIndex: session.data.session.currentSegmentIndex
    });
  }

  async function completeCurrent() {
    if (!session.data || !current) return;
    await sendEvent('advance', {
      type: currentBreak ? 'break_ended' : 'segment_completed',
      segmentIndex: session.data.session.currentSegmentIndex
    });
  }

  async function skipCurrent() {
    if (!session.data || !current?.optional) return;
    await sendEvent('skip', {
      type: 'segment_skipped',
      segmentIndex: session.data.session.currentSegmentIndex
    });
  }

  async function markWorkComplete() {
    if (!session.data) return;
    const target = currentLinkedId ?? session.data.session.workItemId;
    await sendEvent('work-complete', {
      type: 'work_item_completed',
      payload: target === session.data.session.workItemId ? {} : { workItemId: target }
    });
    notice = target === session.data.session.workItemId ? 'Work item marked complete.' : 'Linked Chore marked complete.';
  }

  async function finishSession() {
    if (!confirm(planFinished ? 'Finish this session?' : 'Finish this session before the plan is complete?')) return;
    await sendEvent('finish', { type: 'session_completed' });
  }

  async function abandonSession() {
    if (!confirm('Abandon this session? The execution history will be kept.')) return;
    await sendEvent('abandon', { type: 'session_abandoned' });
  }

  async function saveReview(input: SessionReviewInput) {
    reviewNotice = '';
    busy = 'review';
    try {
      const saved = await upsertSessionReview(id, input);
      queryClient.setQueryData(queryKeys.execution.review(id), saved);
      reviewNotice = 'Review saved.';
    } catch (error) {
      errorMessage = problemMessage(error, 'Couldn’t save the review.');
    } finally {
      busy = null;
    }
  }
</script>

<svelte:head><title>Focus session — Taskiller</title></svelte:head>

<div class="min-h-screen bg-[#111214] px-5 py-6 text-white sm:px-8 lg:px-12 lg:py-9">
  <div class="mx-auto max-w-[1180px]">
    <div class="flex items-center justify-between gap-4">
      <a href="/today" class="inline-flex items-center gap-1.5 text-sm font-bold text-white/48 transition hover:text-white"><ArrowLeftIcon size={15} /> Leave focus</a>
      <div class="flex items-center gap-2">
        {#if !online}<Badge class="border-amber-300/20 bg-amber-300/10 text-amber-100"><WifiSlashIcon size={13} /> Offline</Badge>{/if}
        {#if session.data}<Badge class="border-white/10 bg-white/[0.07] text-white">{session.data.session.state}</Badge>{/if}
      </div>
    </div>

    {#if session.isPending}
      <div class="mt-8 h-[520px] animate-pulse rounded-[28px] bg-white/[0.055]"></div>
    {:else if session.isError || !session.data}
      <div class="mt-8 rounded-[22px] border border-red-500/30 bg-red-500/10 p-6 text-red-100">Couldn’t load this session.</div>
    {:else}
      <header class="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-white/35">{work.data?.item.kind ?? 'work'} · focus session</p>
          <h1 class="tk-display mt-2 max-w-4xl text-4xl font-extrabold sm:text-5xl lg:text-6xl">{work.data?.item.name ?? 'Focus session'}</h1>
          {#if current}
            <p class="mt-3 text-sm text-white/48">{current.label || current.kind.replaceAll('_', ' ')} · {current.targetSeconds ? formatDuration(current.targetSeconds) : 'Open duration'}</p>
          {:else if planFinished && !terminal}
            <p class="mt-3 text-sm text-emerald-300/80">All planned segments are complete.</p>
          {/if}
        </div>
        <div class="text-left lg:text-right">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-white/28">Server version</p>
          <p class="tk-mono mt-1 text-sm text-white/55">v{session.data.session.version}</p>
        </div>
      </header>

      {#if errorMessage}
        <div class="mt-5 flex items-start gap-2 rounded-[16px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100"><WarningCircleIcon size={18} class="mt-0.5 shrink-0" /> {errorMessage}</div>
      {:else if notice}
        <div class="mt-5 rounded-[16px] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
      {/if}

      {#if !terminal}
        <div class="mt-7"><ActiveSessionCard session={session.data.session} /></div>

        <section class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div class="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-white/32">Current action</p>
                <h2 class="tk-display mt-2 text-2xl font-bold">
                  {#if planFinished}Plan complete{:else if !currentStarted}Ready to start {currentBreak ? 'break' : 'segment'}{:else if session.data.session.state === 'paused'}Paused{:else}{currentBreak ? 'Recovery in progress' : 'Stay with the block'}{/if}
                </h2>
                {#if linkedWork.data?.item}<p class="mt-1 text-sm text-white/45">Linked Chore: {linkedWork.data.item.name}</p>{/if}
              </div>
              {#if current?.optional}<Badge class="border-white/10 bg-white/[0.06] text-white/60">Optional</Badge>{/if}
            </div>

            <div class="mt-6 flex flex-wrap gap-2.5">
              {#if planFinished}
                <Button variant="dark" size="lg" disabled={busy !== null || !online} onclick={finishSession}><FlagCheckeredIcon size={19} weight="fill" /> Finish session</Button>
              {:else if session.data.session.state === 'paused'}
                <Button variant="dark" size="lg" disabled={busy !== null || !online} onclick={togglePause}>{#if busy === 'resume'}<SpinnerGapIcon size={18} class="animate-spin" />{:else}<PlayIcon size={18} weight="fill" />{/if} Resume</Button>
              {:else if !currentStarted}
                <Button variant="dark" size="lg" disabled={busy !== null || !online} onclick={startCurrent}>{#if busy === 'start'}<SpinnerGapIcon size={18} class="animate-spin" />{:else}<PlayIcon size={18} weight="fill" />{/if} Start {currentBreak ? 'break' : 'segment'}</Button>
                {#if current?.optional}<Button variant="ghost" size="lg" disabled={busy !== null || !online} onclick={skipCurrent}><SkipForwardIcon size={18} /> Skip</Button>{/if}
              {:else}
                <Button variant="dark" size="lg" disabled={busy !== null || !online} onclick={completeCurrent}>{#if busy === 'advance'}<SpinnerGapIcon size={18} class="animate-spin" />{:else}<ArrowRightIcon size={18} weight="bold" />{/if} {currentBreak ? 'End break' : 'Complete segment'}</Button>
                <Button variant="ghost" size="lg" disabled={busy !== null || !online} onclick={togglePause}><PauseIcon size={18} weight="fill" /> Pause</Button>
                {#if current?.optional}<Button variant="ghost" size="lg" disabled={busy !== null || !online} onclick={skipCurrent}><SkipForwardIcon size={18} /> Skip</Button>{/if}
              {/if}
            </div>

            {#if current && !currentBreak && currentStarted && canCompleteWork}
              <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <div>
                  <p class="text-sm font-semibold text-white/72">Finished the actual work?</p>
                  <p class="mt-0.5 text-xs text-white/35">This changes the linked Chore/work item itself, not just the timer segment.</p>
                </div>
                <Button variant="ghost" disabled={busy !== null || !online} onclick={markWorkComplete}><CheckCircleIcon size={18} /> Mark work complete</Button>
              </div>
            {/if}
          </div>

          <aside class="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
            <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-white/30">End session</p>
            <p class="mt-2 text-sm leading-6 text-white/45">Finishing records a completed session. Abandoning keeps the history but marks the session abandoned.</p>
            <div class="mt-5 grid gap-2">
              {#if !planFinished}<Button variant="ghost" class="justify-start text-white/72" disabled={busy !== null || !online} onclick={finishSession}><FlagCheckeredIcon size={17} /> Finish early</Button>{/if}
              <Button variant="ghost" class="justify-start text-red-300 hover:bg-red-500/10" disabled={busy !== null || !online} onclick={abandonSession}>Abandon session</Button>
            </div>
          </aside>
        </section>
      {:else}
        <section class="mt-7 rounded-[28px] border border-white/10 bg-white/[0.055] p-6 sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">Session closed</p>
              <h2 class="tk-display mt-2 text-3xl font-bold">{session.data.session.state === 'completed' ? 'Finished.' : 'Stopped for now.'}</h2>
              <p class="mt-2 text-sm text-white/45">Your event history and immutable plan snapshot remain available below.</p>
            </div>
            <a href={`/work/${session.data.session.workItemId}`} class="inline-flex h-10 items-center rounded-[12px] bg-white/10 px-4 text-sm font-bold text-white/75 hover:bg-white/15">Back to work item</a>
          </div>
        </section>

        <div class="mt-5">
          <SessionReviewForm review={review.data ?? null} busy={busy === 'review'} onsave={saveReview} />
          {#if reviewNotice}<p class="mt-2 text-sm text-emerald-300">{reviewNotice}</p>{/if}
        </div>
      {/if}

      <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section class="rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">Immutable plan snapshot</p>
          <div class="mt-4 grid gap-2">
            {#each session.data.session.planSnapshot.segments as segment, index}
              <div class="flex items-center gap-3 rounded-[14px] border border-transparent bg-white/[0.045] px-4 py-3 {index === session.data.session.currentSegmentIndex && !terminal ? 'border-tk-strike/35 bg-tk-strike/[0.07]' : ''}">
                <span class="tk-mono flex size-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">{index + 1}</span>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold capitalize">{segment.label || segment.kind.replaceAll('_', ' ')}</p><p class="mt-0.5 text-xs text-white/38">{segment.durationMode} · {segment.targetSeconds ? formatDuration(segment.targetSeconds) : 'open'}{segment.optional ? ' · optional' : ''}</p></div>
                {#if index < session.data.session.currentSegmentIndex}<CheckCircleIcon size={17} weight="fill" class="text-emerald-300/70" />{:else if index === session.data.session.currentSegmentIndex && !terminal}<span class="size-2 rounded-full bg-tk-strike"></span>{/if}
              </div>
            {/each}
          </div>
        </section>

        <aside class="rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div class="flex items-center justify-between gap-3"><p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">Event history</p><span class="text-xs text-white/25">{events.data?.items.length ?? 0}</span></div>
          <div class="mt-5">
            {#if events.isPending}
              <div class="space-y-3"><div class="h-10 animate-pulse rounded-xl bg-white/[0.05]"></div><div class="h-10 animate-pulse rounded-xl bg-white/[0.05]"></div></div>
            {:else if events.data?.items.length}
              <SessionTimeline events={events.data.items} />
            {:else}
              <p class="text-sm text-white/38">No events available.</p>
            {/if}
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>
