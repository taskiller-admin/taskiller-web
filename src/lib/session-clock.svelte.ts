import type { ExecutionSession } from '$lib/api/execution';

/** Render server-adjusted segment timestamps; resume already shifts the start time. */
export function sessionClock(getSession: () => ExecutionSession) {
  let now = $state(Date.now());
  $effect(() => {
    const session = getSession();
    if (session.state !== 'running') return;
    now = Date.now();
    const interval = window.setInterval(() => (now = Date.now()), 1000);
    return () => window.clearInterval(interval);
  });
  const segment = $derived(getSession().planSnapshot.segments[getSession().currentSegmentIndex] ?? null);
  const elapsed = $derived.by(() => {
    const session = getSession();
    if (!session.currentSegmentStartedAt) return 0;
    const end = session.state === 'paused' && session.pausedAt
      ? Date.parse(session.pausedAt)
      : session.endedAt ? Date.parse(session.endedAt) : now;
    return Math.max(0, Math.floor((end - Date.parse(session.currentSegmentStartedAt)) / 1000));
  });
  const target = $derived(segment?.targetSeconds ?? null);
  return {
    get segment() { return segment; },
    get target() { return target; },
    get seconds() { return target === null ? elapsed : Math.max(0, target - elapsed); },
    get progress() { return target ? Math.min(100, (elapsed / target) * 100) : 0; }
  };
}
