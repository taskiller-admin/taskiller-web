<script lang="ts">
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import type { FocusPlanSegmentInput } from '$lib/api/focus';
  import type { WorkItem } from '$lib/api/work';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { formatDuration } from '$lib/utils';

  let {
    segment,
    index,
    total,
    linkedOptions = [],
    onpatch,
    onremove,
    onmove
  }: {
    segment: FocusPlanSegmentInput;
    index: number;
    total: number;
    linkedOptions?: WorkItem[];
    onpatch: (patch: Partial<FocusPlanSegmentInput>) => void;
    onremove: () => void;
    onmove: (direction: -1 | 1) => void;
  } = $props();

  const nonWork = $derived(['break', 'long_break', 'transition'].includes(segment.kind));
  const durationSummary = $derived(
    segment.durationMode === 'open'
      ? 'Open ended'
      : segment.targetSeconds
        ? formatDuration(segment.targetSeconds)
        : 'Needs duration'
  );

  function seconds(value: string): number | null {
    const minutes = Number(value);
    return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null;
  }

  function minuteValue(value: number | null | undefined): string {
    return value ? String(Math.round(value / 60)) : '';
  }

  function changeKind(value: string) {
    const kind = value as FocusPlanSegmentInput['kind'];
    onpatch({
      kind,
      ...( ['break', 'long_break', 'transition'].includes(kind) ? { linkedWorkItemId: null } : {})
    });
  }
</script>

<div class="rounded-[18px] border border-[var(--border)] bg-white/82 p-4 shadow-[0_8px_24px_rgb(20_20_20/0.035)]">
  <div class="flex items-start gap-3">
    <div class="tk-mono mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-tk-ink text-[11px] font-bold text-white">
      {index + 1}
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-bold capitalize">{segment.kind.replaceAll('_', ' ')}</p>
          <p class="mt-0.5 text-xs text-tk-graphite">{durationSummary}</p>
        </div>
        <div class="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Move segment up" disabled={index === 0} onclick={() => onmove(-1)}><ArrowUpIcon size={16} /></Button>
          <Button size="icon" variant="ghost" aria-label="Move segment down" disabled={index === total - 1} onclick={() => onmove(1)}><ArrowDownIcon size={16} /></Button>
          <Button size="icon" variant="ghost" aria-label="Remove segment" onclick={onremove}><TrashIcon size={16} /></Button>
        </div>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-2">
        <label class="text-xs font-bold text-tk-graphite">Kind
          <Select value={segment.kind} onchange={(event) => changeKind(event.currentTarget.value)}>
            <option value="work">Work</option>
            <option value="retrieval">Retrieval</option>
            <option value="review">Review</option>
            <option value="planning">Planning</option>
            <option value="break">Break</option>
            <option value="long_break">Long break</option>
            <option value="transition">Transition</option>
          </Select>
        </label>
        <label class="text-xs font-bold text-tk-graphite">Duration mode
          <Select value={segment.durationMode} onchange={(event) => onpatch({ durationMode: event.currentTarget.value as FocusPlanSegmentInput['durationMode'] })}>
            <option value="fixed">Fixed</option>
            <option value="flexible">Flexible</option>
            <option value="open">Open</option>
          </Select>
        </label>
      </div>

      {#if segment.durationMode !== 'open'}
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <label class="text-xs font-bold text-tk-graphite">Target min
            <Input type="number" min="1" max="1440" value={minuteValue(segment.targetSeconds)} oninput={(event) => onpatch({ targetSeconds: seconds(event.currentTarget.value) })} />
          </label>
          <label class="text-xs font-bold text-tk-graphite">Minimum
            <Input type="number" min="0" max="1440" value={minuteValue(segment.minSeconds)} oninput={(event) => onpatch({ minSeconds: seconds(event.currentTarget.value) })} />
          </label>
          <label class="text-xs font-bold text-tk-graphite">Maximum
            <Input type="number" min="1" max="1440" value={minuteValue(segment.maxSeconds)} oninput={(event) => onpatch({ maxSeconds: seconds(event.currentTarget.value) })} />
          </label>
        </div>
      {/if}

      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <label class="text-xs font-bold text-tk-graphite">Label
          <Input value={segment.label ?? ''} placeholder="Optional display label" oninput={(event) => onpatch({ label: event.currentTarget.value || null })} />
        </label>
        {#if !nonWork && linkedOptions.length}
          <label class="text-xs font-bold text-tk-graphite">Linked Chore
            <Select value={segment.linkedWorkItemId ?? ''} onchange={(event) => onpatch({ linkedWorkItemId: event.currentTarget.value || null })}>
              <option value="">Use session target</option>
              {#each linkedOptions as item}<option value={item.id}>{item.name}</option>{/each}
            </Select>
          </label>
        {/if}
      </div>

      <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-tk-graphite">
        <input type="checkbox" checked={segment.optional ?? false} onchange={(event) => onpatch({ optional: event.currentTarget.checked })} />
        Optional segment
      </label>
    </div>
  </div>
</div>
