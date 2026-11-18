<script lang="ts">
  import type { Snippet } from 'svelte';
  import { sessionClock } from '$lib/session-clock.svelte';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import type { components } from '$lib/api/generated/schema';
  import { formatClock, formatDuration } from '$lib/utils';

  type Session = components['schemas']['ExecutionSession'];
  let { session, controls, showSessionLink = true }: { session: Session; controls?: Snippet; showSessionLink?: boolean } = $props();
  const clock = sessionClock(() => session);
  const segment = $derived(clock.segment);
  const target = $derived(clock.target);
  const remaining = $derived(clock.seconds);
  const progress = $derived(clock.progress);
</script>

<section class="tk-session-reactor rounded-[26px] p-6 text-white sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12" aria-label="Active focus session">
  <div>
    <div class="flex items-center gap-2 text-sm font-semibold text-white/75">
      <span class="grid size-7 place-items-center rounded-[9px] bg-white/8 text-tk-strike">
        <LightningIcon size={14} weight="fill" aria-hidden="true" />
      </span>
      Active session
    </div>

    <h2 class="tk-display mt-3 max-w-xl text-xl font-bold">{segment?.label || segment?.kind?.replaceAll('_', ' ') || 'Plan complete'}</h2>

    <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div class="tk-progress-beam h-full rounded-full bg-tk-strike transition-[width] duration-1000" style={`width:${progress}%`}></div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75">
      <span class="capitalize">{session.state}</span>
      {#if session.state === 'paused'}<span class="rounded-md bg-white/8 px-2 py-0.5 text-white/70">Timer frozen</span>{/if}
      <span>{segment ? `Segment ${session.currentSegmentIndex + 1} / ${session.planSnapshot.segments.length}` : 'All segments complete'}</span>
      {#if target}<span>{formatDuration(target)} target</span>{/if}
    </div>
  </div>

  <div class="mt-4 min-w-0 lg:mt-0 lg:text-right">
    <div class="tk-mono text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
      {formatClock(remaining)}
      <span class="sr-only">{target === null ? ' elapsed in the current segment' : ' remaining in the current segment'}</span>
    </div>

    {#if controls}<div class="mt-4">{@render controls()}</div>{/if}
    {#if showSessionLink}<div class="mt-5 flex flex-wrap items-center gap-2 lg:justify-end">
      <a href={`/work/${session.workItemId}`} class="inline-flex min-h-11 items-center rounded-[10px] px-3 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/7 hover:text-white">Open work</a>
      <a href={`/session/${session.id}`} class="inline-flex min-h-11 items-center gap-1.5 rounded-[11px] bg-white/10 px-3 py-2 text-xs font-bold text-white/85 transition-[transform,background-color] hover:-translate-y-px hover:bg-white/15">
        Open session <ArrowUpRightIcon size={14} aria-hidden="true" />
      </a>
    </div>{/if}
  </div>
</section>
