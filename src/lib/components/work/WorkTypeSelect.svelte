<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import Select from '$lib/components/ui/Select.svelte';
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

  const types = createQuery(() => ({
    queryKey: queryKeys.work.workTypes,
    queryFn: listWorkTypes,
    staleTime: 5 * 60_000
  }));

  const selected = $derived(types.data?.items.find((item) => item.id === value) ?? null);
  const systemTypes = $derived(types.data?.items.filter((item) => item.system) ?? []);
  const customTypes = $derived(types.data?.items.filter((item) => !item.system) ?? []);
</script>

<label class="block">
  <span class="mb-1.5 block text-xs font-bold text-tk-graphite">{label}</span>
  <Select bind:value aria-label={label}>
    <option value="">No Work Type selected</option>
    {#if systemTypes.length}
      <optgroup label="Built-in">
        {#each systemTypes as option}
          <option value={option.id}>{option.displayName}</option>
        {/each}
      </optgroup>
    {/if}
    {#if customTypes.length}
      <optgroup label="Custom">
        {#each customTypes as option}
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
</label>
