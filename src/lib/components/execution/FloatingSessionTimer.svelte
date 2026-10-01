<script lang="ts">
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import PauseIcon from 'phosphor-svelte/lib/PauseIcon';
  import type { ExecutionSession } from '$lib/api/execution';
  import { formatClock, formatDuration } from '$lib/utils';

  let { session }: { session: ExecutionSession } = $props();
  let now = $state(Date.now());

  $effect(() => {
    if (session.state !== 'running') return;
    now = Date.now();
    const interval = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(interval);
  });

  const segment = $derived(session.planSnapshot.segments[session.currentSegmentIndex] ?? null);
  const startedAt = $derived(
    session.currentSegmentStartedAt ? Date.parse(session.currentSegmentStartedAt) : null
  );
  const clockNow = $derived(
    session.state === 'paused' && session.pausedAt ? Date.parse(session.pausedAt) : now
  );
  const elapsed = $derived(
    startedAt === null ? 0 : Math.max(0, Math.floor((clockNow - startedAt) / 1000))
  );
  const target = $derived(segment?.targetSeconds ?? null);
  const displaySeconds = $derived(
    target === null ? elapsed : Math.max(0, target - elapsed)
  );
  const progress = $derived(
    target ? Math.min(100, Math.max(0, (elapsed / target) * 100)) : 0
  );
  const label = $derived(
    segment?.label || segment?.kind?.replaceAll('_', ' ') || 'Current segment'
  );
</script>

<a
  href={`/session/${session.id}`}
  class="fixed bottom-[calc(6.4rem+env(safe-area-inset-bottom))] right-3 z-[45] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-white/10 bg-[#0b0f14]/96 p-4 text-white shadow-[0_22px_70px_rgb(0_0_0/0.28)] backdrop-blur-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgb(0_0_0/0.34)] active:translate-y-0 xl:bottom-5 xl:right-5"
  aria-label={`Return to active focus session. ${label}.`}
>
  <div class="flex items-start gap-3">
    <span class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/8 text-tk-strike">
      {#if session.state === 'paused'}
        <PauseIcon size={16} weight="fill" aria-hidden="true" />
      {:else}
        <LightningIcon size={16} weight="fill" aria-hidden="true" />
      {/if}
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-xs font-bold text-white/85">{label}</p>
          <p class="mt-0.5 text-[10px] capitalize text-white/42">
            {session.state} · segment {session.currentSegmentIndex + 1}/{session.planSnapshot.segments.length}
          </p>
        </div>
        <div class="tk-mono shrink-0 text-xl font-bold tracking-[-0.05em]">
          {formatClock(displaySeconds)}
          <span class="sr-only">{target === null ? ' elapsed' : ' remaining'}</span>
        </div>
      </div>

      {#if target}
        <div class="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            class="h-full rounded-full bg-tk-strike transition-[width] duration-1000"
            style={`width:${progress}%`}
          ></div>
        </div>
        <p class="mt-2 text-[10px] text-white/35">{formatDuration(target)} target · tap to return</p>
      {:else}
        <p class="mt-2 text-[10px] text-white/35">Open-ended segment · tap to return</p>
      {/if}
    </div>
  </div>
</a>
