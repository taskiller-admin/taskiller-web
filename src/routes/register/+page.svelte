<script lang="ts">
  import { protectUnsaved } from '$lib/actions/unsaved';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import AuthFrame from '$lib/components/brand/AuthFrame.svelte';
  import { register } from '$lib/auth/session';
  import { problemMessage } from '$lib/api/problem';

  let submitted = $state(false);
  protectUnsaved(() => !submitted && Boolean(displayName || email || password));
  let displayName = $state('');
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
      await register({
        email,
        password,
        displayName: displayName || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: navigator.language || 'en'
      });
      submitted = true;
      await goto('/today');
    } catch (cause) {
      error = problemMessage(cause, 'Could not create your account.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Create account — Taskiller</title></svelte:head>

<AuthFrame headline="Big ideas. Small steps. Real momentum.">
    <form class="w-full max-w-md rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_22px_60px_rgb(23_23_23/0.06)] backdrop-blur sm:p-8" onsubmit={submit}>
      <p class="text-xs font-bold uppercase tracking-[0.13em] text-[var(--muted)]">Start simple</p>
      <h1 class="tk-display mt-2 text-4xl font-extrabold">Create account</h1>
      <p class="mt-3 text-sm leading-6 text-[var(--muted)]">Your browser timezone becomes the initial default. You can change it later.</p>
      <div class="mt-8 space-y-5">
        <label class="block text-sm font-semibold">Name <span class="font-normal text-[var(--muted)]">(optional)</span><Input class="mt-2" bind:value={displayName} autocomplete="name" /></label>
        <label class="block text-sm font-semibold">Email<Input class="mt-2" type="email" bind:value={email} autocomplete="email" required /></label>
        <label class="block text-sm font-semibold">Password<Input class="mt-2" type={showPassword ? 'text' : 'password'} bind:value={password} aria-label="Password" aria-describedby="password-help" autocomplete="new-password" minlength="10" required /></label>
        <p id="password-help" class="text-sm text-[var(--muted)]">Use at least 10 characters.</p>
        <button type="button" class="min-h-11 text-sm font-semibold underline" aria-pressed={showPassword} onclick={() => (showPassword = !showPassword)}>{showPassword ? 'Hide password' : 'Show password'}</button>
      </div>
      {#if error}<p class="mt-4 text-sm text-[var(--danger-text)]" role="alert">{error}</p>{/if}
      <Button class="mt-7 w-full" size="lg" type="submit" loading={loading} disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
      <p class="mt-6 text-center text-sm text-[var(--muted)]">Already have an account? <a class="font-bold text-[var(--foreground)] underline decoration-tk-strike decoration-2 underline-offset-4" href="/login">Log in</a></p>
    </form>
</AuthFrame>
