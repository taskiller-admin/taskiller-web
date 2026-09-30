<script lang="ts">
  import { page } from '$app/state';
  import KeyIcon from 'phosphor-svelte/lib/KeyIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { confirmPasswordReset } from '$lib/api/account';
  import { problemMessage } from '$lib/api/problem';

  let token = $state(page.url.searchParams.get('token') ?? '');
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
<div class="grid min-h-screen place-items-center px-5 py-12">
  <div class="w-full max-w-md">
    <a href="/" aria-label="Taskiller home"><Logo class="h-7 w-auto" /></a>
    <div class="mt-10 rounded-[24px] border border-[var(--border)] bg-white/82 p-6 sm:p-7">
      <div class="grid size-11 place-items-center rounded-[14px] bg-tk-strike/15 text-[#a63820]"><KeyIcon size={21} /></div>
      <h1 class="tk-display mt-5 text-3xl font-extrabold">Choose a new password</h1>
      {#if done}
        <p class="mt-3 text-sm leading-6 text-tk-graphite">Your password has been changed and existing device sessions were revoked for security.</p>
        <a class="mt-6 inline-flex text-sm font-bold text-tk-blue" href="/login">Sign in with the new password →</a>
      {:else}
        <form class="mt-6 space-y-4" onsubmit={submit}>
          {#if !page.url.searchParams.get('token')}
            <label class="block"><span class="mb-1.5 block text-xs font-bold text-tk-graphite">Reset token</span><Input bind:value={token} minlength="20" maxlength="512" required /></label>
          {/if}
          <label class="block"><span class="mb-1.5 block text-xs font-bold text-tk-graphite">New password</span><Input type="password" bind:value={password} minlength="10" maxlength="256" required autocomplete="new-password" /></label>
          <label class="block"><span class="mb-1.5 block text-xs font-bold text-tk-graphite">Confirm new password</span><Input type="password" bind:value={confirmPassword} minlength="10" maxlength="256" required autocomplete="new-password" /></label>
          <Button class="w-full" type="submit" disabled={busy || !token.trim()}>{busy ? 'Changing…' : 'Change password'}</Button>
        </form>
        {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
      {/if}
    </div>
  </div>
</div>
