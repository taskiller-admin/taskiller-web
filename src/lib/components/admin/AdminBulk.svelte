<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import AdminCommand from './AdminCommand.svelte';
  import { adminMessage, adminRequest } from '$lib/api/admin/client';
  let { ids, operations, onDone }: { ids: string[]; operations: string[]; onDone: () => void } = $props();
  let operation = $state('');
  let reason = $state('');
  type Preview = { eligibleCount: number; count: number; results: { targetId: string; eligible: boolean; code?: string }[] };
  let preview = $state<Preview>();
  let previewTargets = $state<{ id: string; etag?: string }[]>([]);
  let signature = $state('');
  let outcomes = $state<{ targetId: string; outcome: string; code?: string }[]>([]);
  let busy = $state(false);
  let error = $state('');
  let current = $derived(JSON.stringify([ids, operation, reason]));

  async function inspect() {
    if (!operation || !reason.trim() || busy || !ids.length) return;
    busy = true; error = ''; preview = undefined; outcomes = [];
    const requested = current;
    try {
      const targets = await Promise.all(ids.map(async id => {
        const { etag } = await adminRequest('users/' + id);
        return { id, etag };
      }));
      const { data } = await adminRequest<Preview>('bulk/preview', {
        method: 'POST', body: { action: operation, targets, reason: { reasonCode: 'staff_console', comment: reason.trim() } }
      });
      if (!data || !Number.isInteger(data.eligibleCount) || !Array.isArray(data.results)) throw new Error('Invalid preview');
      previewTargets = targets;
      signature = requested; preview = data;
    } catch (cause) { error = adminMessage(cause); }
    finally { busy = false; }
  }

  function complete(message: string, result?: unknown) {
    const items = (result as { results?: typeof outcomes } | undefined)?.results;
    outcomes = Array.isArray(items) ? items : [];
    preview = undefined;
    error = '';
    onDone();
    if (!outcomes.length) error = message;
  }
</script>

<section class="tk-panel space-y-3 p-4" aria-label="Bulk actions">
  <p class="font-bold">{ids.length} selected <span class="text-xs text-[var(--muted)]">· up to 25 accounts</span></p>
  <div class="flex flex-wrap items-end gap-2">
    <label class="block max-w-52 text-sm">Action<Select bind:value={operation} class="mt-1">
      <option value="">Choose an action</option>
      {#each operations as item}<option value={item}>{item === 'suspend' ? 'Suspend accounts' : item === 'reactivate' ? 'Reactivate accounts' : 'Revoke sessions'}</option>{/each}
    </Select></label>
    <label class="text-sm">Reason<Input class="mt-1" bind:value={reason} maxlength={500} /></label>
    <Button variant="secondary" loading={busy} disabled={!ids.length || !operation || !reason.trim()} onclick={inspect}>Preview</Button>
  </div>
  {#if preview && signature === current}
    <p role="status">{preview.eligibleCount} eligible · {preview.count - preview.eligibleCount} ineligible</p>
    {#if preview.eligibleCount > 0}
      <AdminCommand command={{ label: 'Review bulk action', description: 'Apply ' + operation + ' to the ' + preview.eligibleCount + ' eligible accounts from this preview.', path: 'bulk/execute', body: { action: operation, targets: previewTargets.filter(target => preview?.results.some(result => result.targetId === target.id && result.eligible)) }, initialReason: reason, danger: true }} onDone={complete} onConflict={inspect} />
    {/if}
  {/if}
  {#if error}<p role="status">{error}</p>{/if}
  {#if outcomes.length}
    <ul class="space-y-1" aria-label="Bulk results">
      {#each outcomes as item}<li class="break-all text-sm">{item.targetId} · {item.outcome}{item.code ? ' · ' + item.code : ''}</li>{/each}
    </ul>
  {/if}
</section>
