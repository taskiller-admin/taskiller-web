<script lang="ts">
  import type { SessionEvent } from '$lib/api/execution';

  let { events }: { events: SessionEvent[] } = $props();

  const labels: Record<SessionEvent['type'], string> = {
    session_started: 'Session started',
    paused: 'Paused',
    resumed: 'Resumed',
    segment_started: 'Segment started',
    segment_completed: 'Segment completed',
    segment_skipped: 'Segment skipped',
    break_started: 'Break started',
    break_ended: 'Break ended',
    work_item_completed: 'Work item completed',
    session_completed: 'Session completed',
    session_abandoned: 'Session abandoned'
  };

  function eventTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(value));
  }
</script>

<div class="space-y-0">
  {#each events as event, index}
    <div class="grid grid-cols-[22px_minmax(0,1fr)_auto] gap-3">
      <div class="flex flex-col items-center">
        <span class="mt-1.5 size-2.5 rounded-full {index === events.length - 1 ? 'bg-tk-strike' : 'bg-white/25'}"></span>
        {#if index < events.length - 1}<span class="mt-1 h-full w-px bg-white/10"></span>{/if}
      </div>
      <div class="pb-5">
        <p class="text-sm font-semibold text-white/85">{labels[event.type]}</p>
        {#if event.segmentIndex !== null}
          <p class="mt-0.5 text-xs text-white/38">Segment {event.segmentIndex + 1}</p>
        {/if}
      </div>
      <time class="tk-mono pt-0.5 text-[11px] text-white/32" datetime={event.occurredAt}>{eventTime(event.occurredAt)}</time>
    </div>
  {/each}
</div>
