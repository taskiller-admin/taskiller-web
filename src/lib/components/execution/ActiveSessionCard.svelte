<script lang="ts">
  import { onMount } from 'svelte';
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
  const elapsed = $derived(startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0);
  const target = $derived(segment?.targetSeconds ?? null);
  const remaining = $derived(target === null ? elapsed : Math.max(0, target - elapsed));
  const progress = $derived(target ? Math.min(100, (elapsed / target) * 100) : 0);
</script>

<section class="rounded-[18px] bg-tk-ink p-7 text-white lg:p-8" aria-label="Active focus session">
  <p class="text-sm font-semibold text-white/60">Active focus</p>
  <h2 class="tk-display mt-5 text-2xl font-bold leading-tight">Current session</h2>
  <div class="tk-mono mt-8 text-5xl font-semibold tracking-tight lg:text-6xl">
    {formatClock(remaining)}
  </div>
  <div class="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
    <div class="h-full rounded-full bg-tk-strike transition-[width] duration-1000" style={`width:${progress}%`}></div>
  </div>
  <div class="mt-5 flex items-center justify-between text-sm">
    <span class="capitalize text-white/80">{segment?.kind?.replace('_', ' ') ?? session.state}</span>
    <span class="tk-mono text-white/65">{formatDuration(target)}</span>
  </div>
  <p class="mt-7 text-xs text-white/50">Server state refreshes periodically; the visible timer is reconstructed locally from server timestamps.</p>
</section>
