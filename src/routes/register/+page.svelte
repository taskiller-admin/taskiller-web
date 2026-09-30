<script lang="ts">
  import { goto } from '$app/navigation';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  import { register } from '$lib/auth/session';
  import { problemMessage } from '$lib/api/problem';

  let displayName = $state('');
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = '';
    try {
      await register({
        email,
        password,
        displayName: displayName || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: navigator.language || 'en'
      });
      await goto('/today');
    } catch (cause) {
      error = problemMessage(cause, 'Could not create your account.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Create account — Taskiller</title></svelte:head>

<div class="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
  <aside class="relative hidden overflow-hidden bg-[#ecece7] p-12 lg:flex lg:flex-col">
    <Logo class="relative h-7 w-auto" />
    <div class="relative mt-auto max-w-lg">
      <div class="mb-5 grid size-11 place-items-center rounded-[13px] bg-white text-tk-green"><CheckCircleIcon size={21} weight="fill" /></div>
      <p class="tk-display text-5xl font-extrabold leading-[1.02]">Capture quickly. Shape it later. Finish deliberately.</p>
      <p class="mt-5 max-w-md text-sm leading-6 text-tk-graphite">No onboarding personality test. Taskiller can start with safe defaults and learn from real work.</p>
    </div>
  </aside>
  <main class="flex items-center justify-center px-6 py-16">
    <form class="w-full max-w-md rounded-[24px] border border-[var(--border)] bg-white/76 p-6 shadow-[0_22px_60px_rgb(23_23_23/0.06)] backdrop-blur sm:p-8" onsubmit={submit}>
      <Logo class="mb-12 h-7 w-auto lg:hidden" />
      <p class="text-xs font-bold uppercase tracking-[0.13em] text-tk-graphite">Start simple</p>
      <h1 class="tk-display mt-2 text-4xl font-extrabold">Create account</h1>
      <p class="mt-3 text-sm leading-6 text-tk-graphite">Your browser timezone becomes the initial default. You can change it later.</p>
      <div class="mt-8 space-y-5">
        <label class="block text-sm font-semibold">Name <span class="font-normal text-tk-graphite">(optional)</span><Input class="mt-2" bind:value={displayName} autocomplete="name" /></label>
        <label class="block text-sm font-semibold">Email<Input class="mt-2" type="email" bind:value={email} autocomplete="email" required /></label>
        <label class="block text-sm font-semibold">Password<Input class="mt-2" type="password" bind:value={password} autocomplete="new-password" minlength="10" required /></label>
      </div>
      {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
      <Button class="mt-7 w-full" size="lg" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
      <p class="mt-6 text-center text-sm text-tk-graphite">Already have an account? <a class="font-bold text-tk-ink underline decoration-tk-strike decoration-2 underline-offset-4" href="/login">Log in</a></p>
    </form>
  </main>
</div>
