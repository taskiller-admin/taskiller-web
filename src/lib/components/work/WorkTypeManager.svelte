<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import type { components } from '$lib/api/generated/schema';
  import { createWorkType, getWorkType, updateWorkType, deleteWorkType, type WorkType } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';

  type CreateInput = components['schemas']['CreateWorkTypeRequest'];
  type Intensity = 'low' | 'medium' | 'high';
  type Physicality = 'sedentary' | 'light' | 'active';
  type Learning = 'none' | 'acquisition' | 'retrieval' | 'practice';

  let {
    open = $bindable(false),
    types = [],
    oncreated
  }: {
    open?: boolean;
    types?: WorkType[];
    oncreated?: (item: WorkType) => void;
  } = $props();

  const queryClient = useQueryClient();
  const intensityOptions: Intensity[] = ['low', 'medium', 'high'];
  const physicalityOptions: Physicality[] = ['sedentary', 'light', 'active'];
  const learningOptions: Learning[] = ['none', 'acquisition', 'retrieval', 'practice'];

  const customTypes = $derived(types.filter((type) => !type.system));
  const systemTypes = $derived(types.filter((type) => type.system));
  let editingId = $state<string | null>(null);
  let etag = $state<string | null>(null);
  let name = $state('');
  let slug = $state('');
  let description = $state('');
  let cognitiveDemand = $state<Intensity>('medium');
  let interruptionSensitivity = $state<Intensity>('medium');
  let continuityNeed = $state<Intensity>('medium');
  let repetitiveness = $state<Intensity>('medium');
  let physicality = $state<Physicality>('sedentary');
  let learningMode = $state<Learning>('none');
  let error = $state('');
  let notice = $state('');
  let busy = $state(false);
  let confirmingDelete = $state(false);

  function cleanForm() {
    editingId = null;
    etag = null;
    name = '';
    slug = '';
    description = '';
    cognitiveDemand = 'medium';
    interruptionSensitivity = 'medium';
    continuityNeed = 'medium';
    repetitiveness = 'medium';
    physicality = 'sedentary';
    learningMode = 'none';
    error = '';
    notice = '';
    confirmingDelete = false;
  }

  function copyCharacteristics(type: WorkType) {
    cognitiveDemand = type.characteristics.cognitiveDemand ?? 'medium';
    interruptionSensitivity = type.characteristics.interruptionSensitivity ?? 'medium';
    continuityNeed = type.characteristics.continuityNeed ?? 'medium';
    repetitiveness = type.characteristics.repetitiveness ?? 'medium';
    physicality = type.characteristics.physicality ?? 'sedentary';
    learningMode = type.characteristics.learningMode ?? 'none';
  }

  function useTemplate(type: WorkType) {
    cleanForm();
    copyCharacteristics(type);
    notice = `Copied the characteristics of ${type.displayName}. Give your new Work Type its own name and slug.`;
  }

  async function edit(type: WorkType) {
    if (busy || type.system) return;
    busy = true;
    error = '';
    try {
      const fresh = await getWorkType(type.id);
      editingId = fresh.item.id;
      etag = fresh.etag;
      name = fresh.item.displayName;
      slug = fresh.item.slug;
      description = fresh.item.description ?? '';
      copyCharacteristics(fresh.item);
      notice = '';
      confirmingDelete = false;
    } catch (cause) {
      error = problemMessage(cause, 'Could not load this Work Type.');
    } finally {
      busy = false;
    }
  }

  function payload(): CreateInput {
    return {
      slug: slug.trim().toLowerCase(),
      displayName: name.trim(),
      description: description.trim() || null,
      characteristics: {
        cognitiveDemand,
        interruptionSensitivity,
        continuityNeed,
        repetitiveness,
        physicality,
        learningMode
      }
    };
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    error = '';
    const input = payload();
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(input.slug)) {
      error = 'Slug must be 1–64 lowercase letters, numbers, underscores or hyphens, and begin with a letter or number.';
      return;
    }
    if (!editingId && types.some((type) => type.slug.toLowerCase() === input.slug)) {
      error = 'This slug is already used. Choose another unique slug.';
      return;
    }
    busy = true;
    try {
      let result: WorkType;
      if (editingId) {
        result = (await updateWorkType(editingId, {
          displayName: input.displayName,
          description: input.description,
          characteristics: input.characteristics
        }, etag)).item;
      } else {
        result = await createWorkType(input);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
      oncreated?.(result);
      open = false;
      cleanForm();
    } catch (cause) {
      error = problemMessage(cause, 'Could not save this Work Type.');
    } finally {
      busy = false;
    }
  }

  async function remove() {
    if (!editingId || !confirmingDelete || busy) return;
    busy = true;
    error = '';
    try {
      await deleteWorkType(editingId, etag);
      await queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
      cleanForm();
      notice = 'Custom Work Type deleted. Existing work items must be reassigned before deletion if the server requires it.';
    } catch (cause) {
      error = problemMessage(cause, 'Unable to delete this Work Type. It may be in use by existing work.');
    } finally {
      busy = false;
    }
  }

  function close() { if (!busy) { open = false; confirmingDelete = false; } }
</script>

<svelte:window onkeydown={(event) => { if (open && event.key === 'Escape') close(); }} />

{#if open}
  <div class="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/75 p-3 sm:p-6" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="work-type-dialog-title"
      class="tk-panel max-h-[min(92vh,950px)] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-8">
      <header class="flex items-start justify-between gap-4">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-tk-graphite">Taskiller · Work taxonomy</p>
          <h2 id="work-type-dialog-title" class="tk-display mt-2 text-3xl font-bold">Your Work Types</h2>
          <p class="mt-2 max-w-xl text-sm leading-6 text-tk-graphite">Create a type using the same six characteristics as Taskiller's built-in types. Its defaults become available immediately when creating or editing work.</p>
        </div>
        <button type="button" aria-label="Close Work Type manager" onclick={close} disabled={busy}
          class="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] text-tk-graphite hover:text-tk-ink disabled:opacity-50"><XIcon size={18} /></button>
      </header>

      <div class="mt-7 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <aside class="space-y-5">
          <div class="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <h3 class="text-sm font-black">Your custom types</h3>
              <button type="button" disabled={busy} onclick={cleanForm} class="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-bold hover:border-[var(--border-strong)]"><PlusIcon size={14} /> New</button>
            </div>
            {#if customTypes.length === 0}
              <p class="text-xs leading-5 text-tk-graphite">Nothing custom yet. Create a Work Type or start from a built-in template.</p>
            {:else}
              <div class="max-h-56 space-y-2 overflow-y-auto">
                {#each customTypes as type (type.id)}
                  <button type="button" onclick={() => edit(type)} disabled={busy}
                    class={`w-full rounded-xl border bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--border-strong)] disabled:opacity-50 ${editingId === type.id ? "border-tk-strike" : "border-[var(--border)]"}`}>
                    <span class="block text-sm font-bold">{type.displayName}</span>
                    <span class="block text-[11px] text-tk-graphite">{type.slug}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          <div>
            <h3 class="mb-2 text-sm font-black">Start from a built-in type</h3>
            <p class="mb-3 text-xs leading-5 text-tk-graphite">Copies characteristics only. Built-in types cannot be edited or removed.</p>
            <div class="max-h-44 space-y-1.5 overflow-y-auto">
              {#each systemTypes as type (type.id)}
                <button type="button" disabled={busy} onclick={() => useTemplate(type)}
                  class="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-[var(--surface-subtle)] disabled:opacity-50">
                  {type.displayName} <span class="text-tk-graphite">↗</span>
                </button>
              {/each}
            </div>
          </div>
        </aside>

        <form onsubmit={submit} class="min-w-0 rounded-2xl border border-[var(--border)] p-4 sm:p-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-tk-graphite">{editingId ? 'Custom type' : 'New type'}</p>
              <h3 class="mt-1 text-xl font-black">{editingId ? 'Edit Work Type' : 'Define a Work Type'}</h3>
            </div>
            <span class="rounded-lg bg-[var(--surface-subtle)] px-2 py-1 text-[10px] font-bold text-tk-graphite">6 characteristics</span>
          </div>
          {#if notice}<p class="mt-3 rounded-xl bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-tk-graphite" role="status">{notice}</p>{/if}
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label class="block"><span class="mb-1 block text-xs font-bold">Display name</span>
              <input required maxlength="120" bind:value={name} disabled={busy} placeholder="e.g. Research writing"
                class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm" /></label>
            <label class="block"><span class="mb-1 block text-xs font-bold">Slug</span>
              <input required maxlength="64" pattern={'[a-z0-9][a-z0-9_-]{0,63}'} bind:value={slug} disabled={busy || Boolean(editingId)} placeholder="research-writing"
                class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm" />
              <span class="mt-1 block text-[11px] text-tk-graphite">Unique ID · fixed after creation</span>
            </label>
            <label class="block sm:col-span-2"><span class="mb-1 block text-xs font-bold">Description</span>
              <textarea maxlength="1000" rows="2" bind:value={description} disabled={busy} placeholder="When should this type be used?"
                class="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"></textarea></label>
          </div>

          <div class="mt-5 border-t border-[var(--border)] pt-4">
            <h4 class="text-sm font-black">Characteristics</h4>
            <p class="mt-1 text-xs leading-5 text-tk-graphite">Use these to describe the work, not to rate your performance. Focus recommendations use the selected defaults.</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <label class="block"><span class="mb-1 block text-xs font-bold">Cognitive demand</span><span class="mb-1.5 block text-[11px] text-tk-graphite">How much mental effort it requires</span>
                <select bind:value={cognitiveDemand} disabled={busy} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">{#each intensityOptions as opt}<option value={opt}>{opt}</option>{/each}</select></label>
              <label class="block"><span class="mb-1 block text-xs font-bold">Interruption sensitivity</span><span class="mb-1.5 block text-[11px] text-tk-graphite">Cost of getting interrupted</span>
                <select bind:value={interruptionSensitivity} disabled={busy} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">{#each intensityOptions as opt}<option value={opt}>{opt}</option>{/each}</select></label>
              <label class="block"><span class="mb-1 block text-xs font-bold">Continuity need</span><span class="mb-1.5 block text-[11px] text-tk-graphite">Need for an uninterrupted work block</span>
                <select bind:value={continuityNeed} disabled={busy} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">{#each intensityOptions as opt}<option value={opt}>{opt}</option>{/each}</select></label>
              <label class="block"><span class="mb-1 block text-xs font-bold">Repetitiveness</span><span class="mb-1.5 block text-[11px] text-tk-graphite">How routine or repetitive the work is</span>
                <select bind:value={repetitiveness} disabled={busy} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">{#each intensityOptions as opt}<option value={opt}>{opt}</option>{/each}</select></label>
              <label class="block"><span class="mb-1 block text-xs font-bold">Physicality</span><span class="mb-1.5 block text-[11px] text-tk-graphite">Body movement or physical effort</span>
                <select bind:value={physicality} disabled={busy} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">{#each physicalityOptions as opt}<option value={opt}>{opt}</option>{/each}</select></label>
              <label class="block"><span class="mb-1 block text-xs font-bold">Learning mode</span><span class="mb-1.5 block text-[11px] text-tk-graphite">Acquiring, recalling or practicing material</span>
                <select bind:value={learningMode} disabled={busy} class="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">{#each learningOptions as opt}<option value={opt}>{opt}</option>{/each}</select></label>
            </div>
          </div>
          {#if error}<p class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600" role="alert">{error}</p>{/if}
          <div class="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
            <button type="submit" disabled={busy} class="rounded-xl bg-tk-strike px-5 py-2.5 text-sm font-black text-[#24110b] disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save Work Type' : 'Create Work Type'}</button>
            {#if editingId}
              <button type="button" disabled={busy} onclick={() => (confirmingDelete = !confirmingDelete)} class="rounded-xl border border-red-500/30 px-3 py-2.5 text-xs font-bold text-red-600">{confirmingDelete ? 'Cancel delete' : 'Delete'}</button>
            {/if}
            <button type="button" onclick={close} disabled={busy} class="rounded-xl px-3 py-2.5 text-xs font-bold text-tk-graphite">Close</button>
          </div>
          {#if confirmingDelete && editingId}
            <div class="mt-3 rounded-xl border border-red-500/30 p-3 text-sm">
              <p class="font-bold">Delete this custom Work Type?</p>
              <p class="mt-1 text-xs text-tk-graphite">This cannot be undone. Work Types attached to work items may need to be reassigned first.</p>
              <button type="button" disabled={busy} onclick={remove} class="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Confirm deletion</button>
            </div>
          {/if}
        </form>
      </div>
    </section>
  </div>
{/if}
