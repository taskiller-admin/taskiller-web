<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  import { adminMessage, adminRequest } from '$lib/api/admin/client';

  let { enabled, enroll = false }: { enabled: boolean; enroll?: boolean } = $props();
  let token = $state('');
  let username = $state('');
  let password = $state('');
  let challengeId = $state('');
  let setupKey = $state('');
  let code = $state('');
  let recovery = $state(false);
  let recoveryCodes = $state<string[]>([]);
  let pending = $state(false);
  let failure = $state('');

  function destination() {
    const value = page.url.searchParams.get('returnTo') ?? '';
    return /^\/admin(?:\/(?:users(?:\/[\w-]+)?|work\/[\w-]+|operations|privacy|audit|staff))?$/.test(value) ? value : '/admin';
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (pending) return;
    pending = true;
    failure = '';
    try {
      if (!challengeId) {
        const { data } = await adminRequest<{ challengeId: string; secret?: string }>(enroll ? 'auth/enroll' : 'auth/login', {
          method: 'POST', body: enroll ? { invitationToken: token.trim(), password } : { username, password }
        });
        if (!data?.challengeId || (enroll && !data.secret)) throw new Error('Invalid challenge');
        password = '';
        token = '';
        challengeId = data.challengeId;
        setupKey = data.secret ?? '';
      } else {
        const { data } = await adminRequest<{ recoveryCodes?: string[] }>(enroll ? 'auth/enroll/confirm' : 'auth/mfa', {
          method: 'POST', body: { challengeId, code }
        });
        code = '';
        setupKey = '';
        if (enroll && data?.recoveryCodes?.length) recoveryCodes = data.recoveryCodes;
        else await goto(enroll ? '/admin/login' : destination(), { invalidateAll: true });
      }
    } catch (cause) { failure = adminMessage(cause); }
    finally { pending = false; }
  }
</script>

<main class="grid min-h-dvh lg:grid-cols-[.8fr_1fr]">
  <div class="flex flex-col justify-between gap-10 bg-[#152b49] px-7 py-8 text-white sm:px-12 lg:p-14">
    <a href="/" aria-label="Taskiller home"><Logo inverse class="h-7 w-auto" /></a>
    <div class="max-w-md">
      <p class="text-xs font-bold uppercase tracking-[.16em] text-[#ffac96]">Administration</p>
      <p class="tk-display mt-3 text-3xl leading-tight sm:text-5xl">Taskiller staff console</p>
    </div>
  </div>
  <section class="mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-12 sm:px-10">
    <h1 class="tk-display text-3xl">{enroll ? 'Set up staff access' : 'Staff sign in'}</h1>
    {#if !enabled}
      <p class="mt-4 text-[var(--muted)]" role="status">Staff access is currently unavailable.</p>
    {:else if recoveryCodes.length}
      <p class="mt-4">Save these single-use recovery codes somewhere secure before continuing.</p>
      <ul class="tk-panel my-5 space-y-2 p-5 font-mono">{#each recoveryCodes as item}<li>{item}</li>{/each}</ul>
      <a class="tk-capture-link self-start" href="/admin/login" onclick={() => recoveryCodes = []}>Continue to sign in</a>
    {:else}
      <form class="mt-6 space-y-4" onsubmit={submit} aria-busy={pending}>
        {#if !challengeId}
          {#if enroll}
            <label class="block text-sm font-semibold">Invitation code<Input class="mt-2" type="password" bind:value={token} required maxlength={200} autocomplete="off" /></label>
          {:else}
            <label class="block text-sm font-semibold">Staff username<Input class="mt-2" bind:value={username} required autocomplete="username" /></label>
          {/if}
          <label class="block text-sm font-semibold">Password<Input class="mt-2" type="password" bind:value={password} required maxlength={1024} autocomplete="current-password" aria-describedby={enroll ? 'staff-password-help' : undefined} /></label>
          {#if enroll}<p id="staff-password-help" class="text-sm text-[var(--muted)]">Use your existing Django staff password if you already have one. For a new staff account, choose a password of at least 12 characters.</p>{/if}
        {:else}
          {#if setupKey}<p>Add this key to your authenticator app.</p><output class="tk-panel block break-all p-4 font-mono">{setupKey}</output>{/if}
          <label class="block text-sm font-semibold">{recovery ? 'Recovery code' : 'Authenticator code'}<Input class="mt-2" bind:value={code} autocomplete="one-time-code" inputmode={recovery ? 'text' : 'numeric'} required /></label>
          {#if !enroll}<Button variant="ghost" onclick={() => { recovery = !recovery; code = ''; }}>{recovery ? 'Use authenticator' : 'Use a recovery code'}</Button>{/if}
        {/if}
        {#if failure}<p role="alert" class="text-[var(--danger-text)]">{failure}</p>{/if}
        <div class="flex flex-wrap gap-3">
          <Button type="submit" loading={pending}>{challengeId ? 'Verify' : 'Continue'}</Button>
          {#if challengeId}<Button variant="secondary" disabled={pending} onclick={() => { challengeId = ''; code = ''; setupKey = ''; failure = ''; }}>Start over</Button>{/if}
        </div>
      </form>
    {/if}
  </section>
</main>
