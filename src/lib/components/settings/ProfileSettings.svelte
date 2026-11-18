<script lang="ts">
  import { protectUnsaved } from '$lib/actions/unsaved';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import UserCircleIcon from 'phosphor-svelte/lib/UserCircleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import {
    AccountConflictError,
    getProfile,
    requestEmailVerification,
    updateProfile
  } from '$lib/api/account';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { updateAuthenticatedUser } from '$lib/auth/session';

  const queryClient = useQueryClient();
  const profile = createQuery(() => ({
    queryKey: queryKeys.account.profile,
    queryFn: getProfile
  }));

  let displayName = $state('');
  let baseline = $state('');
  let draftInitializedFor = $state<string | null>(null);
  const dirty = $derived(draftInitializedFor !== null && displayName !== baseline);
  protectUnsaved(() => dirty);
  let conflict = $state(false);
  let message = $state('');
  let error = $state('');

  $effect(() => {
    const current = profile.data?.user;
    if (!current || draftInitializedFor !== null) return;
    displayName = current.displayName ?? '';
    baseline = displayName;
    draftInitializedFor = current.updatedAt;
  });

  const save = createMutation(() => ({
    mutationFn: () => updateProfile({ displayName: displayName.trim() || null }, profile.data?.etag ?? null),
    onSuccess: async (result) => {
      conflict = false;
      error = '';
      displayName = result.user.displayName ?? '';
      baseline = displayName;
      message = 'Profile saved.';
      updateAuthenticatedUser(result.user);
      queryClient.setQueryData(queryKeys.account.profile, result);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: async (cause) => {
      message = '';
      if (cause instanceof AccountConflictError) {
        conflict = true;
        await profile.refetch();
        return;
      }
      error = problemMessage(cause, 'Could not save your profile.');
    }
  }));

  const verification = createMutation(() => ({
    mutationFn: requestEmailVerification,
    onSuccess: () => {
      error = '';
      message = 'Verification email requested. Check your inbox.';
    },
    onError: (cause) => {
      message = '';
      error = problemMessage(cause, 'Could not request a verification email.');
    }
  }));

  function useServerVersion() {
    const current = profile.data?.user;
    if (!current) return;
    displayName = current.displayName ?? '';
    baseline = displayName;
    conflict = false;
    error = '';
    message = '';
  }
</script>

<section id="profile" class="scroll-mt-24 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="grid size-10 place-items-center rounded-[13px] bg-[var(--surface-subtle)]"><UserCircleIcon size={21} aria-hidden="true" /></div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Identity</p>
        <h2 class="mt-1 text-xl font-bold">Profile</h2>
      </div>
    </div>
    {#if profile.data?.user.emailVerified}
      <Badge tone="green"><CheckCircleIcon size={13} weight="fill" aria-hidden="true" /> Verified email</Badge>
    {:else if profile.data}
      <Badge tone="accent">Email unverified</Badge>
    {/if}
  </div>

  {#if profile.isPending}
    <div role="status" aria-label="Loading profile" class="mt-6 h-32 animate-pulse rounded-[16px] bg-[var(--surface-subtle)]"></div>
  {:else if profile.isError && !profile.data}
    <p role="alert" class="mt-6 text-sm">Could not load your profile.</p>
    <Button variant="secondary" onclick={() => profile.refetch()}>Retry profile</Button>
  {:else if profile.data}
    <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
      <form class="space-y-4" oninput={() => (message = '')} onsubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <label class="block">
          <span class="mb-1.5 block text-xs font-bold text-[var(--muted)]">Display name</span>
          <Input disabled={save.isPending} aria-label="Display name" bind:value={displayName} maxlength="200" placeholder="How Taskiller should address you" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs font-bold text-[var(--muted)]">Email</span>
          <Input value={profile.data.user.email} disabled />
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</Button>
          {#if message}<span role="status" class="text-sm text-tk-green">{message}</span>{/if}
        </div>
      </form>

      <div class="rounded-[17px] bg-[var(--surface-raised)] p-4">
        <p class="text-sm font-bold">Email verification</p>
        {#if profile.data.user.emailVerified}
          <p class="mt-2 text-sm leading-6 text-[var(--muted)]">Your address has been verified and can receive account-recovery messages.</p>
        {:else}
          <p class="mt-2 text-sm leading-6 text-[var(--muted)]">Verify your email so password recovery and important account notices have a confirmed destination.</p>
          <Button class="mt-4" variant="secondary" size="sm" disabled={verification.isPending} onclick={() => verification.mutate()}>
            <EnvelopeSimpleIcon size={15} aria-hidden="true" /> {verification.isPending ? 'Requesting…' : 'Send verification email'}
          </Button>
        {/if}
      </div>
    </div>
  {/if}

  {#if conflict}
    <div class="mt-5 rounded-[14px] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning-text)]" role="alert">
      <p class="font-bold">Your profile changed on another client.</p>
      <p class="mt-1 leading-5">Your draft is preserved. You can keep editing or replace it with your latest saved profile.</p>
      <Button variant="ghost" size="sm" class="mt-2 text-[var(--warning-text)]" onclick={useServerVersion}><ArrowsClockwiseIcon size={15} aria-hidden="true" /> Use saved profile</Button>
    </div>
  {/if}
  {#if error}<p class="mt-4 text-sm text-[var(--danger-text)]" role="alert">{error}</p>{/if}
</section>
