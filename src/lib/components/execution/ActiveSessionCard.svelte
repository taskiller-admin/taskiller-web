<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import type { components } from '$lib/api/generated/schema';
  import { formatClock, formatDuration } from '$lib/utils';

  type Session = components['schemas']['ExecutionSession'];
  let { session }: { session: Session } = $props();
  let now = $state(Date.now());

  onMount(() => {
    const interval = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(interval);
  });

  const segment = $derived(session.planSnapshot.segments[session.currentSegmentIndex] ?? null);
  const startedAt = $derived(session.currentSegmentStartedAt ? Date.parse(session.currentSegmentStartedAt) : null);
  const displayNow = $derived(
    session.state === 'paused' && session.pausedAt ? Date.parse(session.pausedAt) : now
  );
  const elapsed = $derived(
    startedAt ? Math.max(0, Math.floor((displayNow - startedAt) / 1000)) : 0
  );
  const target = $derived(segment?.targetSeconds ?? null);
  const remaining = $derived(target === null ? elapsed : Math.max(0, target - elapsed));
  const progress = $derived(target ? Math.min(100, (elapsed / target) * 100) : 0);
</script>

<section class="relative overflow-hidden rounded-[24px] bg-[#171717] p-6 text-white sm:p-7 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10" aria-label="Active focus session">
  <div class="absolute -right-16 -top-24 size-72 rounded-full bg-tk-strike/15 blur-3xl"></div>
  <div class="relative">
    <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/50">
      <LightningIcon size={15} weight="fill" class="text-tk-strike" /> Active session
    </div>
    <h2 class="tk-display mt-5 text-2xl font-bold">{segment?.label || segment?.kind?.replace('_', ' ') || 'Current segment'}</h2>
    <div class="mt-7 h-1.5 overflow-hidden rounded-full bg-white/12">
      <div class="h-full rounded-full bg-tk-strike transition-[width] duration-1000" style={`width:${progress}%`}></div>
    </div>
    <div class="mt-3 flex items-center gap-3 text-xs text-white/45">
      <span class="capitalize">{session.state}</span>
      {#if session.state === 'paused'}<span class="rounded-full bg-white/10 px-2 py-0.5 text-white/70">Timer frozen</span>{/if}
      <span>·</span>
      <span>Segment {session.currentSegmentIndex + 1} of {session.planSnapshot.segments.length}</span>
      {#if target}<span>· {formatDuration(target)}</span>{/if}
    </div>
  </div>
  <div class="relative mt-7 flex items-end justify-between gap-6 lg:mt-0 lg:block lg:text-right">
    <div class="tk-mono text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">{formatClock(remaining)}</div>
    <a href={`/work/${session.workItemId}`} class="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/55 hover:text-white">Open work <ArrowUpRightIcon size={14} /></a>
  </div>
</section>
