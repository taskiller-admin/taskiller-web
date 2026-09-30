<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  import { register } from '$lib/auth/session';
  import { problemMessage } from '$lib/api/problem';

  let displayName = $state(''); let email = $state(''); let password = $state('');
  let loading = $state(false); let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault(); loading = true; error = '';
    try {
      await register({
        email, password, displayName: displayName || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: navigator.language || 'en'
      });
      await goto('/today');
    } catch (cause) { error = problemMessage(cause, 'Could not create your account.'); }
    finally { loading = false; }
  }
</script>

<svelte:head><title>Create account — Taskiller</title></svelte:head>
<div class="grid min-h-screen lg:grid-cols-2">
  <aside class="hidden bg-tk-ink p-12 text-white lg:flex lg:flex-col"><Logo inverse class="h-8 w-auto" /><div class="mt-auto"><p class="tk-display max-w-lg text-5xl font-black leading-tight">Capture quickly. Plan deliberately. Finish explicitly.</p></div></aside>
  <main class="flex items-center justify-center bg-tk-paper px-6 py-16">
    <form class="w-full max-w-md" onsubmit={submit}>
      <Logo class="mb-14 h-8 w-auto lg:hidden" />
      <h1 class="tk-display text-4xl font-extrabold">Create account</h1>
      <p class="mt-3 text-tk-graphite">We’ll use your browser timezone as the initial default.</p>
      <div class="mt-9 space-y-5">
        <label class="block text-sm font-semibold">Name <span class="font-normal text-tk-graphite">(optional)</span><Input class="mt-2" bind:value={displayName} autocomplete="name" /></label>
        <label class="block text-sm font-semibold">Email<Input class="mt-2" type="email" bind:value={email} autocomplete="email" required /></label>
        <label class="block text-sm font-semibold">Password<Input class="mt-2" type="password" bind:value={password} autocomplete="new-password" minlength="10" required /></label>
      </div>
      {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
      <Button class="mt-7 w-full" size="lg" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
      <p class="mt-6 text-center text-sm text-tk-graphite">Already have an account? <a class="font-semibold text-tk-ink underline underline-offset-4" href="/login">Log in</a></p>
    </form>
  </main>
</div>
