<script lang="ts">
  import type { AnalyticsTimeseriesPoint } from '$lib/api/analytics';
  import { formatDuration, formatShortDate } from '$lib/utils';

  let { points }: { points: AnalyticsTimeseriesPoint[] } = $props();

  const maxTotal = $derived(
    Math.max(1, ...points.map((point) => point.activeWorkSeconds + point.breakSeconds + point.pausedSeconds))
  );
</script>

<div class="overflow-x-auto pb-2">
  <div class="flex min-w-[620px] items-end gap-2" style="height: 230px">
    {#each points as point, index}
      {@const activeHeight = Math.max(2, (point.activeWorkSeconds / maxTotal) * 170)}
      {@const breakHeight = (point.breakSeconds / maxTotal) * 170}
      {@const pausedHeight = (point.pausedSeconds / maxTotal) * 170}
      <div class="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${formatShortDate(point.bucketStart)} · ${formatDuration(point.activeWorkSeconds)} active work`}>
        <div class="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-[9px] bg-[var(--surface-subtle)]" style="height: 180px">
          {#if pausedHeight > 0}<div class="tk-bar-reveal w-full bg-[var(--muted)]/35" style={`--i:${index};height:${pausedHeight}px`}></div>{/if}
          {#if breakHeight > 0}<div class="tk-bar-reveal w-full bg-tk-blue/45" style={`--i:${index};height:${breakHeight}px`}></div>{/if}
          <div class="tk-bar-reveal w-full bg-tk-strike transition-[filter] duration-180 group-hover:brightness-110" style={`--i:${index};height:${activeHeight}px`}></div>
        </div>
        <span class="max-w-[64px] truncate text-[10px] font-semibold text-tk-graphite">{formatShortDate(point.bucketStart)}</span>
      </div>
    {/each}
  </div>
</div>

<div class="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-tk-graphite">
  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-tk-strike"></span>Active work</span>
  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-tk-blue/55"></span>Break</span>
  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-[var(--muted)]/35"></span>Paused</span>
</div>
