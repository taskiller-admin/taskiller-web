<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import {
    listWorkItems,
    updateWorkItem,
    WorkConflictError,
    type WorkItem,
    type WorkItemStatus,
    type UpdateWorkItemInput
  } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { toIsoOrNull, toLocalDateTime } from '$lib/utils';

  let {
    item,
    etag,
    onupdated
  }: {
    item: WorkItem;
    etag: string | null;
    onupdated?: () => void;
  } = $props();

  const queryClient = useQueryClient();
  let name = $state(item.name);
  let description = $state(item.description ?? '');
  let status = $state<WorkItemStatus>(item.status);
  let parentId = $state(item.parentId ?? '');
  let estimateMinutes = $state(item.estimatedEffortSeconds === null ? '' : String(Math.round(item.estimatedEffortSeconds / 60)));
  let priority = $state(item.priority === null ? '' : String(item.priority));
  let plannedStart = $state(toLocalDateTime(item.plannedStartAt));
  let deadline = $state(toLocalDateTime(item.deadlineAt));
  let targetStartDate = $state(item.targetStartDate ?? '');
  let targetEndDate = $state(item.targetEndDate ?? '');
  let conflict = $state(false);
  let error = $state('');

  const projects = createQuery(() => ({
    queryKey: queryKeys.work.list({ kind: 'project' }),
    queryFn: () => listWorkItems({ kind: 'project' }),
    enabled: item.kind !== 'project'
  }));

  const sprints = createQuery(() => ({
    queryKey: queryKeys.work.list({ kind: 'sprint' }),
    queryFn: () => listWorkItems({ kind: 'sprint' }),
    enabled: item.kind === 'chore'
  }));

  function resetFromServer() {
    name = item.name;
    description = item.description ?? '';
    status = item.status;
    parentId = item.parentId ?? '';
    estimateMinutes = item.estimatedEffortSeconds === null ? '' : String(Math.round(item.estimatedEffortSeconds / 60));
    priority = item.priority === null ? '' : String(item.priority);
    plannedStart = toLocalDateTime(item.plannedStartAt);
    deadline = toLocalDateTime(item.deadlineAt);
    targetStartDate = item.targetStartDate ?? '';
    targetEndDate = item.targetEndDate ?? '';
    conflict = false;
    error = '';
  }

  const save = createMutation(() => ({
    mutationFn: (input: UpdateWorkItemInput) => updateWorkItem(item.id, input, etag),
    onSuccess: async () => {
      conflict = false;
      error = '';
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
      onupdated?.();
    },
    onError: async (cause) => {
      if (cause instanceof WorkConflictError) {
        conflict = true;
        await queryClient.invalidateQueries({ queryKey: queryKeys.work.detail(item.id) });
        return;
      }
      error = problemMessage(cause, 'Could not save changes.');
    }
  }));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const estimate = estimateMinutes ? Math.max(0, Math.round(Number(estimateMinutes) * 60)) : null;
    save.mutate({
      name: trimmed,
      description: description.trim() || null,
      status,
      ...(item.kind === 'project' ? {} : { parentId: parentId || null }),
      estimatedEffortSeconds: Number.isFinite(estimate) ? estimate : null,
      priority: priority ? Number(priority) : null,
      plannedStartAt: toIsoOrNull(plannedStart),
      deadlineAt: toIsoOrNull(deadline),
      targetStartDate: targetStartDate || null,
      targetEndDate: targetEndDate || null
    });
  }
</script>

<form class="rounded-[20px] border border-[var(--border)] bg-white/88 p-5" onsubmit={submit}>
  <div class="flex items-center justify-between gap-3">
    <div>
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Edit</p>
      <h2 class="mt-1 font-bold">Work details</h2>
    </div>
    <Button type="submit" size="sm" disabled={save.isPending}>
      <FloppyDiskIcon size={16} /> {save.isPending ? 'Saving…' : 'Save'}
    </Button>
  </div>

  {#if conflict}
    <div class="mt-4 rounded-[13px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
      <p class="font-bold">This item changed somewhere else.</p>
      <p class="mt-1 leading-5">The newest server version was fetched in the background. Your current draft is still here.</p>
      <Button type="button" variant="ghost" size="sm" class="mt-2 text-amber-950" onclick={resetFromServer}>
        <ArrowsClockwiseIcon size={15} /> Use server version
      </Button>
    </div>
  {/if}

  <div class="mt-5 space-y-4">
    <label class="block">
      <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Name</span>
      <Input bind:value={name} maxlength="300" required />
    </label>
    <label class="block">
      <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Description</span>
      <Textarea bind:value={description} maxlength="20000" />
    </label>
    <div class="grid grid-cols-2 gap-3">
      <label>
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Status</span>
        <Select bind:value={status}>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="archived">Archived</option>
        </Select>
      </label>
      <label>
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Priority</span>
        <Select bind:value={priority}>
          <option value="">None</option>
          <option value="1">1 · Low</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 · High</option>
        </Select>
      </label>
    </div>
    {#if item.kind !== 'project'}
      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Parent</span>
        <Select bind:value={parentId}>
          {#if item.kind === 'chore'}<option value="">Inbox / no parent</option>{/if}
          {#if projects.data?.items.length}
            <optgroup label="Projects">
              {#each projects.data.items as project}
                <option value={project.id}>{project.name}</option>
              {/each}
            </optgroup>
          {/if}
          {#if item.kind === 'chore' && sprints.data?.items.length}
            <optgroup label="Sprints">
              {#each sprints.data.items as sprint}
                <option value={sprint.id}>{sprint.name}</option>
              {/each}
            </optgroup>
          {/if}
        </Select>
      </label>
    {/if}
    <label class="block">
      <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Estimate (minutes)</span>
      <Input type="number" min="0" step="5" bind:value={estimateMinutes} />
    </label>
    <label class="block">
      <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Planned start</span>
      <Input type="datetime-local" bind:value={plannedStart} />
    </label>
    <label class="block">
      <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Deadline</span>
      <Input type="datetime-local" bind:value={deadline} />
    </label>
    {#if item.kind === 'project'}
      <div class="grid grid-cols-2 gap-3">
        <label>
          <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Target start</span>
          <Input type="date" bind:value={targetStartDate} />
        </label>
        <label>
          <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Target end</span>
          <Input type="date" bind:value={targetEndDate} />
        </label>
      </div>
    {/if}
  </div>

  {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
</form>
