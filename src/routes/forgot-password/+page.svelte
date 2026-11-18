<script lang="ts">
  import { protectUnsaved } from '$lib/actions/unsaved';
  import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { requestPasswordReset } from '$lib/api/account';
  import { problemMessage } from '$lib/api/problem';

  protectUnsaved(() => !sent && Boolean(email));
  let email = $state('');
  let busy = $state(false);
  let sent = $state(false);
  let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    error = '';
    try {
      await requestPasswordReset(email.trim());
      sent = true;
    } catch (cause) {
      error = problemMessage(cause, 'Could not request a password reset.');
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Reset password — Taskiller</title></svelte:head>
<div class="grid min-h-screen place-items-center px-5 py-12">
  <div class="w-full max-w-md">
    <a href="/" aria-label="Taskiller home"><Logo class="h-7 w-auto" /></a>
    <div class="mt-10 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
      <div class="grid size-11 place-items-center rounded-[14px] bg-tk-blue/10 text-[var(--foreground)]"><EnvelopeSimpleIcon size={21} aria-hidden="true" /></div>
      <h1 class="tk-display mt-5 text-3xl font-extrabold">Reset your password</h1>
      {#if sent}
        <p role="status" class="mt-3 text-sm leading-6 text-[var(--muted)]">If an active account exists for <strong>{email}</strong>, Taskiller has sent password-reset instructions. Check your inbox and spam folder.</p>
        <a class="mt-6 inline-flex text-sm font-bold text-tk-blue" href="/login">Back to sign in →</a>
      {:else}
        <p class="mt-3 text-sm leading-6 text-[var(--muted)]">Enter the email attached to your account. Taskiller won’t reveal whether an address is registered.</p>
        <form class="mt-6 space-y-4" onsubmit={submit}>
          <label class="block"><span class="mb-1.5 block text-xs font-bold text-[var(--muted)]">Email</span><Input type="email" bind:value={email} required autocomplete="email" /></label>
          <Button class="w-full" type="submit" disabled={busy}>{busy ? 'Requesting…' : 'Send reset instructions'}</Button>
        </form>
        {#if error}<p class="mt-4 text-sm text-[var(--danger-text)]" role="alert">{error}</p>{/if}
      {/if}
    </div>
  </div>
</div>
