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

<section class="focus-reactor tk-session-reactor rounded-[26px] p-6 text-white sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12" aria-label="Active focus session">
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

  <div class="mt-6 min-w-0 lg:mt-0 lg:text-right">
    <div class="timer-orbit" style={`--orbit-progress:${progress}%`}>
      <span class="orbit-track" aria-hidden="true"></span>
      <span class="orbit-satellite" aria-hidden="true"></span>
      <div class="tk-mono relative z-10 text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
      {formatClock(remaining)}
      <span class="sr-only">{target === null ? ' elapsed in the current segment' : ' remaining in the current segment'}</span>
      </div>
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

<style>
  .focus-reactor { position: relative; isolation: isolate; overflow: hidden; background: #172c50; border: 1px solid #ffffff20; box-shadow: 0 22px 60px #101f3f24; }
  .focus-reactor::before { content: ''; position: absolute; z-index: -1; inset: 0; background: radial-gradient(ellipse at 0% 0%, #8299e02b, transparent 65%), radial-gradient(ellipse at 100% 100%, #ff927226, transparent 65%); animation: reactor-breathe 8s ease-in-out infinite alternate; }
  .timer-orbit { position: relative; display: grid; place-items: center; width: min(280px, 100%); aspect-ratio: 1; margin-inline: auto; border-radius: 50%; background: radial-gradient(circle, #203c63 50%, transparent 51%); }
  .orbit-track { position: absolute; inset: 10px; border-radius: 50%; border: 1px solid #ffffff20; box-shadow: inset 0 0 0 12px #ffffff03, 0 0 0 9px #ffffff03; }
  .orbit-track::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: conic-gradient(var(--accent) var(--orbit-progress), #ffffff10 0); mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0); }
  .orbit-satellite { position: absolute; inset: 9px; border-radius: 50%; animation: orbit-turn 28s linear infinite; }
  .orbit-satellite::before { content: ''; position: absolute; top: -3px; left: calc(50% - 4px); width: 8px; height: 8px; border-radius: 50%; background: #a5dfce; box-shadow: 0 0 18px #a5dfce90; }
  @keyframes orbit-turn { to { transform: rotate(360deg); } }
  @keyframes reactor-breathe { to { opacity: .45; transform: scale(1.08); } }
  @media (min-width: 1024px) { .timer-orbit { margin-left: auto; } }
  @media (prefers-reduced-motion: reduce) { .focus-reactor::before, .orbit-satellite { animation: none; } }
</style>
