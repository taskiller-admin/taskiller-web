<script lang="ts">
  import { goto } from '$app/navigation';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  import { login } from '$lib/auth/session';
  import { problemMessage } from '$lib/api/problem';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = '';
    try {
      await login({ email, password, deviceName: navigator.userAgent.slice(0, 200) });
      await goto('/today');
    } catch (cause) {
      error = problemMessage(cause, 'Could not log in.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Log in — Taskiller</title></svelte:head>

<div class="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
  <aside class="relative hidden overflow-hidden bg-tk-ink p-12 text-white lg:flex lg:flex-col">
    <div class="absolute -left-20 top-24 size-72 rounded-full bg-tk-strike/12 blur-3xl"></div>
    <Logo inverse class="relative h-7 w-auto" />
    <div class="relative mt-auto max-w-lg">
      <div class="mb-5 grid size-11 place-items-center rounded-[13px] bg-white/10 text-tk-strike"><LightningIcon size={21} weight="fill" /></div>
      <p class="tk-display text-5xl font-extrabold leading-[1.02]">Your queue can wait. The next action can’t.</p>
      <p class="mt-5 max-w-md text-sm leading-6 text-white/50">Return to the same server-backed work state from any client.</p>
    </div>
  </aside>
  <main class="flex items-center justify-center px-6 py-16">
    <form class="w-full max-w-md rounded-[24px] border border-[var(--border)] bg-white/76 p-6 shadow-[0_22px_60px_rgb(23_23_23/0.06)] backdrop-blur sm:p-8" onsubmit={submit}>
      <Logo class="mb-12 h-7 w-auto lg:hidden" />
      <p class="text-xs font-bold uppercase tracking-[0.13em] text-tk-graphite">Welcome back</p>
      <h1 class="tk-display mt-2 text-4xl font-extrabold">Log in</h1>
      <p class="mt-3 text-sm leading-6 text-tk-graphite">Continue from the latest server state.</p>
      <div class="mt-8 space-y-5">
        <label class="block text-sm font-semibold">Email<Input class="mt-2" type="email" bind:value={email} autocomplete="email" required /></label>
        <label class="block text-sm font-semibold">Password<Input class="mt-2" type="password" bind:value={password} autocomplete="current-password" required /></label>
      </div>
      {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
      <Button class="mt-7 w-full" size="lg" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</Button>
      <p class="mt-6 text-center text-sm text-tk-graphite">New to Taskiller? <a class="font-bold text-tk-ink underline decoration-tk-strike decoration-2 underline-offset-4" href="/register">Create an account</a></p>
    </form>
  </main>
</div>
