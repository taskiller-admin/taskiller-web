<script lang="ts">
  import type { AnalyticsTimeseriesPoint } from '$lib/api/analytics';
  import { formatDuration, formatShortDate } from '$lib/utils';

  let { points }: { points: AnalyticsTimeseriesPoint[] } = $props();

  const maxTotal = $derived(
    Math.max(1, ...points.map((point) => point.activeWorkSeconds + point.breakSeconds + point.pausedSeconds))
  );
</script>

<div aria-hidden="true" class="overflow-x-auto pb-2">
  <div class="flex items-end gap-2" style={`height:230px;min-width:${Math.max(300, points.length * 38)}px`}>
    {#each points as point, index}
      {@const activeHeight = (point.activeWorkSeconds / maxTotal) * 170}
      {@const breakHeight = (point.breakSeconds / maxTotal) * 170}
      {@const pausedHeight = (point.pausedSeconds / maxTotal) * 170}
      <div class="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${formatShortDate(point.bucketStart)} · ${formatDuration(point.activeWorkSeconds)} active work`}>
        <div class="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-[12px] bg-[var(--surface-subtle)]" style="height: 180px">
          {#if pausedHeight > 0}<div class="tk-bar-reveal w-full bg-[#b8a6dc]" style={`--i:${index};height:${pausedHeight}px`}></div>{/if}
          {#if breakHeight > 0}<div class="tk-bar-reveal w-full bg-[#81cbb8]" style={`--i:${index};height:${breakHeight}px`}></div>{/if}
          <div data-series="active-work" class="tk-bar-reveal w-full bg-[var(--blue)] transition-[filter] duration-180 group-hover:brightness-110" style={`--i:${index};height:${activeHeight}px`}></div>
        </div>
        <span class="max-w-[64px] truncate text-[10px] font-semibold text-tk-graphite">{formatShortDate(point.bucketStart)}</span>
      </div>
    {/each}
  </div>
</div>

<div class="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-tk-graphite">
  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-[var(--blue)]"></span>Active work</span>
  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-[#81cbb8]"></span>Break</span>
  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-[#b8a6dc]"></span>Paused</span>
</div>

<p class="mt-3 text-sm text-[var(--muted)]">Activity across {points.length} periods, with active work, breaks, and pauses. Open the data table for exact values.</p>
<details class="mt-3">
  <summary class="min-h-11 cursor-pointer py-3 font-semibold">View activity data</summary>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <caption class="sr-only">Activity by period; durations in seconds</caption>
      <thead><tr><th scope="col">Period start</th><th scope="col">Active work (seconds)</th><th scope="col">Break (seconds)</th><th scope="col">Paused (seconds)</th><th scope="col">Sessions completed</th><th scope="col">Chores completed</th></tr></thead>
      <tbody>{#each points as point}<tr><th scope="row">{point.bucketStart}</th><td>{point.activeWorkSeconds}</td><td>{point.breakSeconds}</td><td>{point.pausedSeconds}</td><td>{point.sessionsCompleted}</td><td>{point.choresCompleted}</td></tr>{/each}</tbody>
    </table>
  </div>
</details>
