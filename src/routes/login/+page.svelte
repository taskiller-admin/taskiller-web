<script lang="ts">
  import { goto } from '$app/navigation';
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
    loading = true; error = '';
    try {
      await login({ email, password, deviceName: navigator.userAgent.slice(0, 200) });
      await goto('/today');
    } catch (cause) {
      error = problemMessage(cause, 'Could not log in.');
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Log in — Taskiller</title></svelte:head>
<div class="grid min-h-screen lg:grid-cols-2">
  <aside class="hidden bg-tk-ink p-12 text-white lg:flex lg:flex-col"><Logo inverse class="h-8 w-auto" /><div class="mt-auto"><p class="tk-display max-w-lg text-5xl font-black leading-tight">Get back to the work that matters.</p><p class="mt-5 text-white/55">Your refresh credential stays in an HttpOnly cookie; the access token stays in memory.</p></div></aside>
  <main class="flex items-center justify-center bg-tk-paper px-6 py-16">
    <form class="w-full max-w-md" onsubmit={submit}>
      <Logo class="mb-14 h-8 w-auto lg:hidden" />
      <h1 class="tk-display text-4xl font-extrabold">Log in</h1>
      <p class="mt-3 text-tk-graphite">Continue your Taskiller session.</p>
      <div class="mt-9 space-y-5">
        <label class="block text-sm font-semibold">Email<Input class="mt-2" type="email" bind:value={email} autocomplete="email" required /></label>
        <label class="block text-sm font-semibold">Password<Input class="mt-2" type="password" bind:value={password} autocomplete="current-password" required /></label>
      </div>
      {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
      <Button class="mt-7 w-full" size="lg" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</Button>
      <p class="mt-6 text-center text-sm text-tk-graphite">New to Taskiller? <a class="font-semibold text-tk-ink underline underline-offset-4" href="/register">Create an account</a></p>
    </form>
  </main>
</div>
