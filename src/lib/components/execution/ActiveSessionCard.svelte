<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import type { components } from '$lib/api/generated/schema';
  import { spotlight } from '$lib/actions/spotlight';
  import { formatClock, formatDuration } from '$lib/utils';

  type Session = components['schemas']['ExecutionSession'];
  let { session }: { session: Session } = $props();
  let now = $state(Date.now());

  onMount(() => {
    if (session.state !== 'running') return;
    const interval = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(interval);
  });

  const segment = $derived(session.planSnapshot.segments[session.currentSegmentIndex] ?? null);
  const startedAt = $derived(session.currentSegmentStartedAt ? Date.parse(session.currentSegmentStartedAt) : null);
  const displayNow = $derived(session.state === 'paused' && session.pausedAt ? Date.parse(session.pausedAt) : now);
  const elapsed = $derived(startedAt ? Math.max(0, Math.floor((displayNow - startedAt) / 1000)) : 0);
  const target = $derived(segment?.targetSeconds ?? null);
  const remaining = $derived(target === null ? elapsed : Math.max(0, target - elapsed));
  const progress = $derived(target ? Math.min(100, (elapsed / target) * 100) : 0);
</script>

<section use:spotlight class="tk-session-reactor tk-spotlight rounded-[26px] p-6 text-white sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12" aria-label="Active focus session">
  <div>
    <div class="flex items-center gap-2 text-sm font-semibold text-white/55">
      <span class="grid size-7 place-items-center rounded-[9px] bg-white/8 text-tk-strike">
        <LightningIcon size={14} weight="fill" aria-hidden="true" />
      </span>
      Active session
    </div>

    <h2 class="tk-display mt-5 max-w-xl text-3xl font-bold">{segment?.label || segment?.kind?.replace('_', ' ') || 'Current segment'}</h2>

    <div class="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div class="tk-progress-beam h-full rounded-full bg-tk-strike transition-[width] duration-1000" style={`width:${progress}%`}></div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/42">
      <span class="capitalize">{session.state}</span>
      {#if session.state === 'paused'}<span class="rounded-md bg-white/8 px-2 py-0.5 text-white/70">Timer frozen</span>{/if}
      <span>Segment {session.currentSegmentIndex + 1} / {session.planSnapshot.segments.length}</span>
      {#if target}<span>{formatDuration(target)} target</span>{/if}
    </div>
  </div>

  <div class="mt-8 min-w-[240px] lg:mt-0 lg:text-right">
    <div class="tk-mono text-6xl font-semibold tracking-[-0.07em] sm:text-7xl">
      {formatClock(remaining)}
      <span class="sr-only"> remaining in the current segment</span>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2 lg:justify-end">
      <a href={`/work/${session.workItemId}`} class="rounded-[10px] px-3 py-2 text-xs font-bold text-white/50 transition-colors hover:bg-white/7 hover:text-white">Open work</a>
      <a href={`/session/${session.id}`} class="inline-flex items-center gap-1.5 rounded-[11px] bg-white/10 px-3 py-2 text-xs font-bold text-white/85 transition-[transform,background-color] hover:-translate-y-px hover:bg-white/15">
        Open session <ArrowUpRightIcon size={14} />
      </a>
    </div>
  </div>
</section>
