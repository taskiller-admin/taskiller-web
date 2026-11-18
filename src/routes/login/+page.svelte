<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import AuthFrame from '$lib/components/brand/AuthFrame.svelte';
  import { login } from '$lib/auth/session';
  import { problemMessage } from '$lib/api/problem';

  let email = $state('');
  let showPassword = $state(false);
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

<AuthFrame headline="Your next good session starts here.">
    <form class="w-full max-w-md rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_22px_60px_rgb(23_23_23/0.06)] backdrop-blur sm:p-8" onsubmit={submit}>
      <p class="text-xs font-bold uppercase tracking-[0.13em] text-[var(--muted)]">Welcome back</p>
      <h1 class="tk-display mt-2 text-4xl font-extrabold">Log in</h1>
      <p class="mt-3 text-sm leading-6 text-[var(--muted)]">Pick up where you left off.</p>
      <div class="mt-8 space-y-5">
        <label class="block text-sm font-semibold">Email<Input class="mt-2" type="email" bind:value={email} autocomplete="email" required /></label>
        <label class="block text-sm font-semibold">Password<Input class="mt-2" type={showPassword ? 'text' : 'password'} bind:value={password} aria-label="Password" autocomplete="current-password" required /></label>
        <button type="button" class="min-h-11 text-sm font-semibold underline" aria-pressed={showPassword} onclick={() => (showPassword = !showPassword)}>{showPassword ? 'Hide password' : 'Show password'}</button>
        <div class="text-right"><a class="text-xs font-bold text-tk-blue hover:underline" href="/forgot-password">Forgot password?</a></div>
      </div>
      {#if error}<p class="mt-4 text-sm text-[var(--danger-text)]" role="alert">{error}</p>{/if}
      <Button class="mt-7 w-full" size="lg" type="submit" loading={loading} disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</Button>
      <p class="mt-6 text-center text-sm text-[var(--muted)]">New to Taskiller? <a class="font-bold text-[var(--foreground)] underline decoration-tk-strike decoration-2 underline-offset-4" href="/register">Create an account</a></p>
    </form>
</AuthFrame>
