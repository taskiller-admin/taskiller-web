<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import WorkTypeSelect from '$lib/components/work/WorkTypeSelect.svelte';
  import { createWorkItem, type WorkItem, type WorkItemKind } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { toIsoOrNull } from '$lib/utils';

  let {
    parentId = null,
    defaultKind = 'chore',
    allowedKinds = ['chore'],
    compact = false,
    label = 'Create work',
    oncreated
  }: {
    parentId?: string | null;
    defaultKind?: WorkItemKind;
    allowedKinds?: WorkItemKind[];
    compact?: boolean;
    label?: string;
    oncreated?: (item: WorkItem) => void;
  } = $props();

  const queryClient = useQueryClient();

  function initialKind(): WorkItemKind { return defaultKind; }
  function initialAdvanced(): boolean { return !compact; }

  let name = $state('');
  let kind = $state<WorkItemKind>(initialKind());
  let workTypeId = $state('');
  let description = $state('');
  let estimateMinutes = $state('');
  let priority = $state('');
  let deadline = $state('');
  let targetStartDate = $state('');
  let targetEndDate = $state('');
  let advanced = $state(initialAdvanced());
  let error = $state('');

  const create = createMutation(() => ({
    mutationFn: createWorkItem,
    onSuccess: async (item) => {
      name = '';
      workTypeId = '';
      description = '';
      estimateMinutes = '';
      priority = '';
      deadline = '';
      targetStartDate = '';
      targetEndDate = '';
      error = '';
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
      oncreated?.(item);
    },
    onError: (cause) => {
      error = problemMessage(cause, 'Could not create this work item.');
    }
  }));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const estimate = estimateMinutes ? Math.max(0, Math.round(Number(estimateMinutes) * 60)) : null;
    create.mutate({
      kind,
      name: trimmed,
      parentId,
      workTypeId: workTypeId || null,
      status: 'draft',
      description: description.trim() || null,
      estimatedEffortSeconds: Number.isFinite(estimate) ? estimate : null,
      priority: priority ? Number(priority) : null,
      deadlineAt: toIsoOrNull(deadline),
      targetStartDate: targetStartDate || null,
      targetEndDate: targetEndDate || null
    });
  }
</script>

<form class="tk-capture-deck rounded-[18px] p-2.5" onsubmit={submit}>
  <div class="flex gap-2">
    {#if allowedKinds.length > 1}
      <Select class="w-32 shrink-0 border-transparent bg-[var(--surface-subtle)]" bind:value={kind} aria-label="Work item kind">
        {#each allowedKinds as option}
          <option value={option}>{option === 'sprint' ? 'Sprint' : option === 'project' ? 'Project' : 'Chore'}</option>
        {/each}
      </Select>
    {/if}

    <Input
      class="flex-1 border-transparent bg-transparent text-base focus:border-transparent focus:shadow-none"
      bind:value={name}
      placeholder={kind === 'project' ? 'Name the Project…' : kind === 'sprint' ? 'Name the Sprint…' : 'What needs to move?…'}
      maxlength="300"
      autocomplete="off"
      required
    />

    <Button type="submit" variant="dark" disabled={create.isPending || !name.trim()}>
      <PlusIcon size={17} weight="bold" />
      <span class="hidden sm:inline">{create.isPending ? 'Saving…' : label}</span>
    </Button>
  </div>

  <div class="mt-2 rounded-[13px] bg-[var(--surface-subtle)]/70 p-2.5">
    <WorkTypeSelect
      bind:value={workTypeId}
      compact={compact}
      help={kind === 'chore'
        ? 'Choose a Work Type to enable generated Focus Plan recommendations.'
        : kind === 'sprint'
          ? 'This describes the Sprint. Sprint recommendations also use each child Chore’s Work Type and estimate.'
          : 'Projects are containers; executable child work should also have its own Work Type.'}
    />
  </div>

  <button
    type="button"
    aria-expanded={advanced}
    aria-controls="work-composer-details"
    class="mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-tk-graphite transition-colors hover:bg-[var(--surface-subtle)] hover:text-tk-ink"
    onclick={() => (advanced = !advanced)}
  >
    <CaretDownIcon size={13} class={advanced ? 'rotate-180' : ''} />
    {advanced ? 'Fewer fields' : 'Add details'}
  </button>

  {#if advanced}
    <div id="work-composer-details" class="mt-3 grid gap-3 border-t border-[var(--border)] px-1 pt-4 sm:grid-cols-2">
      <label class="sm:col-span-2">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Description</span>
        <Textarea bind:value={description} placeholder="Context, outcome, or notes…" maxlength="20000" />
      </label>
      <label>
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Estimate (minutes)</span>
        <Input type="number" min="0" step="5" bind:value={estimateMinutes} placeholder="45" inputmode="numeric" />
      </label>
      <label>
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Priority</span>
        <Select bind:value={priority}>
          <option value="">None</option>
          <option value="1">1 · Low</option>
          <option value="2">2</option>
          <option value="3">3 · Medium</option>
          <option value="4">4</option>
          <option value="5">5 · High</option>
        </Select>
      </label>
      <label class="sm:col-span-2">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Deadline</span>
        <Input type="datetime-local" bind:value={deadline} />
      </label>
      {#if kind === 'project'}
        <label>
          <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Target start</span>
          <Input type="date" bind:value={targetStartDate} />
        </label>
        <label>
          <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Target end</span>
          <Input type="date" bind:value={targetEndDate} />
        </label>
      {/if}
    </div>
  {/if}

  {#if error}<p class="mt-3 px-2 text-sm text-red-700" role="alert">{error}</p>{/if}
</form>
