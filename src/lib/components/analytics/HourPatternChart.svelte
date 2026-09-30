<script lang="ts">
  import type { TimeOfDayPatternItem } from '$lib/api/analytics';
  import { formatDuration } from '$lib/utils';

  let { items }: { items: TimeOfDayPatternItem[] } = $props();
  const maxWork = $derived(Math.max(1, ...items.map((item) => item.activeWorkSeconds)));
</script>

<div class="overflow-x-auto">
  <div class="flex min-w-[680px] items-end gap-1.5" style="height: 180px">
    {#each items as item}
      {@const height = Math.max(item.activeWorkSeconds > 0 ? 3 : 0, (item.activeWorkSeconds / maxWork) * 130)}
      <div class="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${item.hourStart.toString().padStart(2, '0')}:00 · ${formatDuration(item.activeWorkSeconds)} active work · ${item.sessionCount} sessions`}>
        <div class="relative flex h-[136px] w-full items-end justify-center rounded-[9px] bg-[var(--surface-subtle)]/75">
          <div class="tk-bar-reveal w-full max-w-5 rounded-t-[6px] bg-tk-ink/80 transition-[background-color,filter] group-hover:bg-tk-strike dark:bg-white/65" style={`--i:${item.hourStart};height:${height}px`}></div>
          {#if item.medianFocusScore}
            <span class="absolute -top-1 size-1.5 rounded-full bg-tk-blue shadow-[0_0_12px_rgb(95_125_255/0.55)]" style={`opacity:${0.25 + (item.medianFocusScore / 5) * 0.75}`}></span>
          {/if}
        </div>
        {#if item.hourStart % 3 === 0}<span class="text-[9px] font-semibold text-tk-graphite">{item.hourStart.toString().padStart(2, '0')}</span>{:else}<span class="h-[11px]"></span>{/if}
      </div>
    {/each}
  </div>
</div>

<p class="mt-3 text-xs leading-5 text-tk-graphite">
  Bar height is observed active work. Blue dots indicate a recorded median focus score; they describe history rather than proving a “best” hour.
</p>
