<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import EnvelopeOpenIcon from 'phosphor-svelte/lib/EnvelopeOpenIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { confirmEmailVerification } from '$lib/api/account';
  import { problemMessage } from '$lib/api/problem';

  let token = $state(page.url.searchParams.get('token') ?? '');
  let busy = $state(false);
  let verified = $state(false);
  let error = $state('');

  async function confirm() {
    if (!token.trim() || busy || verified) return;
    busy = true;
    error = '';
    try {
      await confirmEmailVerification(token.trim());
      verified = true;
    } catch (cause) {
      error = problemMessage(cause, 'This verification link is invalid or expired.');
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    if (token) void confirm();
  });
</script>

<svelte:head><title>Verify email — Taskiller</title></svelte:head>
<div class="grid min-h-screen place-items-center px-5 py-12">
  <div class="w-full max-w-md">
    <a href="/" aria-label="Taskiller home"><Logo class="h-7 w-auto" /></a>
    <div class="mt-10 rounded-[24px] border border-[var(--border)] bg-white/82 p-6 sm:p-7">
      {#if verified}
        <div class="grid size-11 place-items-center rounded-[14px] bg-tk-green/10 text-[#237754]"><CheckCircleIcon size={22} weight="fill" /></div>
        <h1 class="tk-display mt-5 text-3xl font-extrabold">Email verified</h1>
        <p class="mt-3 text-sm leading-6 text-tk-graphite">Your address is confirmed. You can return to Taskiller.</p>
        <a class="mt-6 inline-flex text-sm font-bold text-tk-blue" href="/today">Open Taskiller →</a>
      {:else}
        <div class="grid size-11 place-items-center rounded-[14px] bg-tk-blue/10 text-[#3654c9]"><EnvelopeOpenIcon size={21} /></div>
        <h1 class="tk-display mt-5 text-3xl font-extrabold">Verify your email</h1>
        {#if !page.url.searchParams.get('token')}
          <p class="mt-3 text-sm leading-6 text-tk-graphite">Paste the verification token from your email.</p>
          <Input class="mt-5" bind:value={token} minlength="20" maxlength="512" />
        {:else}
          <p class="mt-3 text-sm leading-6 text-tk-graphite">{busy ? 'Confirming your verification link…' : 'Ready to verify this address.'}</p>
        {/if}
        <Button class="mt-5 w-full" disabled={busy || !token.trim()} onclick={confirm}>{busy ? 'Verifying…' : 'Verify email'}</Button>
        {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
      {/if}
    </div>
  </div>
</div>
