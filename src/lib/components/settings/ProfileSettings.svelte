<script lang="ts">
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
  let draftInitializedFor = $state<string | null>(null);
  let conflict = $state(false);
  let message = $state('');
  let error = $state('');

  $effect(() => {
    const current = profile.data?.user;
    if (!current || draftInitializedFor !== null) return;
    displayName = current.displayName ?? '';
    draftInitializedFor = current.updatedAt;
  });

  const save = createMutation(() => ({
    mutationFn: () => updateProfile({ displayName: displayName.trim() || null }, profile.data?.etag ?? null),
    onSuccess: async (result) => {
      conflict = false;
      error = '';
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
    conflict = false;
    error = '';
    message = '';
  }
</script>

<section id="profile" class="scroll-mt-24 rounded-[22px] border border-[var(--border)] bg-white/78 p-5 sm:p-6">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="grid size-10 place-items-center rounded-[13px] bg-black/[0.055]"><UserCircleIcon size={21} /></div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Identity</p>
        <h2 class="mt-1 text-xl font-bold">Profile</h2>
      </div>
    </div>
    {#if profile.data?.user.emailVerified}
      <Badge tone="green"><CheckCircleIcon size={13} weight="fill" /> Verified email</Badge>
    {:else}
      <Badge tone="accent">Email unverified</Badge>
    {/if}
  </div>

  {#if profile.isPending}
    <div class="mt-6 h-32 animate-pulse rounded-[16px] bg-black/[0.04]"></div>
  {:else if profile.data}
    <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
      <form class="space-y-4" onsubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <label class="block">
          <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Display name</span>
          <Input bind:value={displayName} maxlength="200" placeholder="How Taskiller should address you" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Email</span>
          <Input value={profile.data.user.email} disabled />
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</Button>
          {#if message}<span class="text-sm text-tk-green">{message}</span>{/if}
        </div>
      </form>

      <div class="rounded-[17px] bg-[#f0f0ec] p-4">
        <p class="text-sm font-bold">Email verification</p>
        {#if profile.data.user.emailVerified}
          <p class="mt-2 text-sm leading-6 text-tk-graphite">Your address has been verified and can receive account-recovery messages.</p>
        {:else}
          <p class="mt-2 text-sm leading-6 text-tk-graphite">Verify your email so password recovery and important account notices have a confirmed destination.</p>
          <Button class="mt-4" variant="secondary" size="sm" disabled={verification.isPending} onclick={() => verification.mutate()}>
            <EnvelopeSimpleIcon size={15} /> {verification.isPending ? 'Requesting…' : 'Send verification email'}
          </Button>
        {/if}
      </div>
    </div>
  {/if}

  {#if conflict}
    <div class="mt-5 rounded-[14px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
      <p class="font-bold">Your profile changed on another client.</p>
      <p class="mt-1 leading-5">The newest server version is loaded. Your current draft is still in the field above.</p>
      <Button variant="ghost" size="sm" class="mt-2 text-amber-950" onclick={useServerVersion}><ArrowsClockwiseIcon size={15} /> Use server version</Button>
    </div>
  {/if}
  {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
</section>
