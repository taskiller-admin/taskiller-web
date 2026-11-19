<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { AdminProblem, adminMessage, adminRequest } from '$lib/api/admin/client';
  import type { Command } from '$lib/api/admin/views';

  let { command, onDone, onConflict }: { command: Command; onDone: (message: string, data?: unknown) => void; onConflict: () => void } = $props();
  let dialog: HTMLDialogElement;
  let reason = $state('');
  let code = $state('');
  let needsMfa = $state(false);
  let busy = $state(false);
  let failure = $state('');
  let key = '';
  let previousBody = '';
  let stale = $state(false);

  function open() {
    reason = command.initialReason ?? ''; code = ''; needsMfa = false; failure = ''; key = ''; previousBody = ''; stale = false;
    dialog.showModal();
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy || stale) return;
    busy = true;
    failure = '';
    try {
      if (needsMfa) {
        await adminRequest('auth/step-up', { method: 'POST', body: { code } });
        code = '';
        needsMfa = false;
        return;
      }
      const body = { ...command.body, reason: { reasonCode: 'staff_console', comment: reason.trim() } };
      if (!body.reason.comment) { failure = 'Enter a reason for this action.'; return; }
      const signature = JSON.stringify(body);
      if (signature !== previousBody) { key = crypto.randomUUID(); previousBody = signature; }
      const { data } = await adminRequest<{ status?: string }>(command.path, {
        method: command.method ?? 'POST', body, key, etag: command.etag
      });
      dialog.close();
      const message = command.path.endsWith('/recovery-email') ? 'Recovery email request accepted. Delivery is unconfirmed.'
        : data?.status === 'scheduled' ? 'Request scheduled.'
        : data?.status === 'queued' ? 'Request queued.' : 'Change confirmed.';
      onDone(message, data);
    } catch (cause) {
      if (cause instanceof AdminProblem && ['admin_step_up_required', 'step_up_required'].includes(cause.code)) {
        needsMfa = true;
      } else if (cause instanceof AdminProblem && [409, 412, 428].includes(cause.status)) {
        stale = true;
        failure = adminMessage(cause);
      } else failure = adminMessage(cause);
    } finally { busy = false; }
  }
</script>

<Button variant="secondary" size="sm" disabled={command.disabled} onclick={open}>{command.label}</Button>
<dialog bind:this={dialog} aria-label={command.label} class="tk-panel m-auto max-h-[85dvh] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto p-6 text-[var(--foreground)] backdrop:bg-[#101e34]/70" oncancel={event => { if (busy) event.preventDefault(); }}>
  <h2 class="tk-display text-xl">{command.label}</h2>
  <p class="my-3 break-words text-sm text-[var(--muted)]">{command.description}</p>
  <form class="space-y-4" onsubmit={submit} aria-busy={busy}>
    {#if needsMfa}
      <label class="block text-sm font-bold">Authenticator code<Input class="mt-2" bind:value={code} inputmode="numeric" autocomplete="one-time-code" required /></label>
    {:else}
      <label class="block text-sm font-bold">Reason<Input class="mt-2" bind:value={reason} maxlength={500} disabled={busy || stale || command.initialReason !== undefined} required /></label>
    {/if}
    {#if failure}<p role="alert" class="text-[var(--danger-text)]">{failure}</p>{/if}
    <div class="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={busy} onclick={() => dialog.close()}>Cancel</Button>
      {#if stale}
        <Button onclick={() => { dialog.close(); onConflict(); }}>Reload record</Button>
      {:else}
        <Button type="submit" variant={command.danger && !needsMfa ? 'danger' : 'primary'} loading={busy}>{needsMfa ? 'Verify identity' : 'Confirm action'}</Button>
      {/if}
    </div>
  </form>
</dialog>
