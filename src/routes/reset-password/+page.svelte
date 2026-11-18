<script lang="ts">
  import { protectUnsaved } from '$lib/actions/unsaved';
  import { page } from '$app/state';
  import KeyIcon from 'phosphor-svelte/lib/KeyIcon';
  import AuthFrame from '$lib/components/brand/AuthFrame.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { confirmPasswordReset } from '$lib/api/account';
  import { problemMessage } from '$lib/api/problem';

  protectUnsaved(() => !done && Boolean(password || confirmPassword));
  let token = $state(page.url.searchParams.get('token') ?? '');
  let showPassword = $state(false);
  let password = $state('');
  let confirmPassword = $state('');
  let busy = $state(false);
  let done = $state(false);
  let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }
    busy = true;
    error = '';
    try {
      await confirmPasswordReset(token.trim(), password);
      done = true;
    } catch (cause) {
      error = problemMessage(cause, 'The reset link is invalid or expired.');
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Choose a new password — Taskiller</title></svelte:head>
<AuthFrame headline="Back to a clearer headspace.">
    <div class="auth-card">
      <div class="grid size-11 place-items-center rounded-[14px] bg-tk-strike/15 text-[var(--foreground)]"><KeyIcon size={21} aria-hidden="true" /></div>
      <h1 class="tk-display mt-5 text-3xl font-extrabold">Choose a new password</h1>
      {#if done}
        <p role="status" class="mt-3 text-sm leading-6 text-[var(--muted)]">Your password has been changed and existing device sessions were revoked for security.</p>
        <a class="mt-6 inline-flex text-sm font-bold text-tk-blue" href="/login">Sign in with the new password →</a>
      {:else}
        <form class="mt-6 space-y-4" onsubmit={submit}>
          {#if !page.url.searchParams.get('token')}
            <label class="block"><span class="mb-1.5 block text-xs font-bold text-[var(--muted)]">Reset token</span><Input bind:value={token} minlength="20" maxlength="512" required /></label>
          {/if}
          <label class="block"><span class="mb-1.5 block text-xs font-bold text-[var(--muted)]">New password</span><Input type={showPassword ? 'text' : 'password'} bind:value={password} minlength="10" maxlength="256" required autocomplete="new-password" /></label>
          <label class="block"><span class="mb-1.5 block text-xs font-bold text-[var(--muted)]">Confirm new password</span><Input type={showPassword ? 'text' : 'password'} bind:value={confirmPassword} minlength="10" maxlength="256" required autocomplete="new-password" /></label>
          <p class="text-sm text-[var(--muted)]">Use 10–256 characters.</p>
          <button type="button" class="min-h-11 text-sm font-semibold underline" aria-pressed={showPassword} onclick={() => (showPassword = !showPassword)}>{showPassword ? 'Hide passwords' : 'Show passwords'}</button>
          <Button class="w-full" type="submit" loading={busy} disabled={busy || !token.trim()}>{busy ? 'Changing…' : 'Change password'}</Button>
        </form>
        {#if error}<p class="mt-4 text-sm text-[var(--danger-text)]" role="alert">{error}</p>{/if}
      {/if}
    </div>
</AuthFrame>
