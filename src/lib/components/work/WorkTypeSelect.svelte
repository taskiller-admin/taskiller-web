<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import Select from '$lib/components/ui/Select.svelte';
  import WorkTypeManager from '$lib/components/work/WorkTypeManager.svelte';
  import { listWorkTypes } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';

  let {
    value = $bindable(''),
    label = 'Work type',
    help = 'Used to resolve characteristics for Focus Plan recommendations.',
    compact = false
  }: {
    value?: string;
    label?: string;
    help?: string;
    compact?: boolean;
  } = $props();

  let manageOpen = $state(false);
  const types = createQuery(() => ({
    queryKey: queryKeys.work.workTypes,
    queryFn: listWorkTypes,
    staleTime: 5 * 60_000
  }));

  const selected = $derived(types.data?.items.find((item) => item.id === value) ?? null);
  const systemTypes = $derived(types.data?.items.filter((item) => item.system) ?? []);
  const customTypes = $derived(types.data?.items.filter((item) => !item.system) ?? []);
</script>

<div class="block">
  <div class="mb-1.5 flex items-center justify-between gap-3">
    <span class="block text-xs font-bold text-tk-graphite">{label}</span>
    <button type="button" onclick={() => (manageOpen = true)}
      class="rounded-lg px-2 py-1 text-[11px] font-bold text-tk-strike hover:bg-[var(--surface-subtle)]"
      aria-label="Create or manage Work Types">+ Create / manage types</button>
  </div>
  <Select bind:value aria-label={label}>
    <option value="">No Work Type selected</option>
    {#if systemTypes.length}
      <optgroup label="Built-in">
        {#each systemTypes as option (option.id)}
          <option value={option.id}>{option.displayName}</option>
        {/each}
      </optgroup>
    {/if}
    {#if customTypes.length}
      <optgroup label="Custom">
        {#each customTypes as option (option.id)}
          <option value={option.id}>{option.displayName}</option>
        {/each}
      </optgroup>
    {/if}
  </Select>
  {#if !compact}
    <p class="mt-1.5 text-[11px] leading-5 text-tk-graphite">
      {#if types.isPending}
        Loading available Work Types…
      {:else if types.isError}
        Work Types could not be loaded. You can still save the item and try again later.
      {:else if selected}
        {selected.description || `${selected.displayName} characteristics will be used as defaults.`}
      {:else}
        {help}
      {/if}
    </p>
  {/if}
</div>

<WorkTypeManager bind:open={manageOpen} types={types.data?.items ?? []} oncreated={(item) => (value = item.id)} />
