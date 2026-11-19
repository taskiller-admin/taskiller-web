<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import AdminCommand from './AdminCommand.svelte';
  import type { Row } from '$lib/api/admin/contract';

  let { row, etag, onDone, refresh }: { row: Row; etag?: string; onDone: (message: string) => void; refresh: () => void } = $props();
  let value = $state('');
  const operation = $derived(row.kind === 'work_type' ? 'update-type' : row.kind === 'focus_plan' ? 'update-plan' : row.kind === 'execution_session' ? 'session-event' : 'update-item');
  const events = $derived(row.state === 'running' ? ['paused', 'session_abandoned'] : row.state === 'paused' ? ['resumed', 'session_abandoned'] : []);
  const session = $derived(operation === 'session-event');
</script>

{#if row.ownerId && etag && (!session || events.length)}
  <section class="mt-5 space-y-3 border-t border-[var(--border)] pt-5" aria-label="Correct work">
    <h2 class="tk-display text-lg">Correct work</h2>
    {#if session}
      <label class="block max-w-sm text-sm font-semibold">Execution Session event<Select class="mt-1" bind:value={value}>
        <option value="">Choose an event</option>
        {#each events as event}<option value={event}>{event}</option>{/each}
      </Select></label>
    {:else}
      <label class="block max-w-sm text-sm font-semibold">New name<Input class="mt-1" bind:value={value} maxlength={operation === 'update-type' ? 120 : operation === 'update-plan' ? 200 : 300} /></label>
    {/if}
    <AdminCommand command={{ label: session ? 'Append session event' : 'Rename work',
      description: (session ? 'Append ' : 'Rename to ') + value.trim() + ' for record ' + row.id + '.',
      path: 'work/' + row.id + '/correct', etag,
      body: { operation, correction: session ? { type: value } : { [operation === 'update-type' ? 'displayName' : 'name']: value.trim() } },
      disabled: !value.trim() || (session && !events.includes(value)), danger: session }}
      {onDone} onConflict={refresh} />
  </section>
{/if}
