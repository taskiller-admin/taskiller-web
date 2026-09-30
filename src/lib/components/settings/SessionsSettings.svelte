<script lang="ts">
  import { goto } from '$app/navigation';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import DevicesIcon from 'phosphor-svelte/lib/DevicesIcon';
  import DesktopIcon from 'phosphor-svelte/lib/DesktopIcon';
  import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
  import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { listAuthSessions, logoutAllSessions, revokeAuthSession } from '$lib/api/account';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { clearAuth } from '$lib/auth/session';

  const queryClient = useQueryClient();
  const sessions = createQuery(() => ({
    queryKey: queryKeys.account.sessions,
    queryFn: listAuthSessions
  }));

  let busyId = $state<string | null>(null);
  let confirmAll = $state(false);
  let error = $state('');

  const revoke = createMutation(() => ({
    mutationFn: async (session: { id: string; current: boolean }) => {
      busyId = session.id;
      await revokeAuthSession(session.id);
      return session;
    },
    onSuccess: async (session) => {
      error = '';
      busyId = null;
      if (session.current) {
        clearAuth();
        await goto('/login');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.account.sessions });
    },
    onError: (cause) => {
      busyId = null;
      error = problemMessage(cause, 'Could not revoke that device session.');
    }
  }));

  const logoutAll = createMutation(() => ({
    mutationFn: logoutAllSessions,
    onSuccess: async () => {
      clearAuth();
      await goto('/login');
    },
    onError: (cause) => {
      error = problemMessage(cause, 'Could not sign out all devices.');
    }
  }));

  function formatDate(value: string | null) {
    if (!value) return 'Never';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
</script>

<section id="devices" class="scroll-mt-24 rounded-[22px] border border-[var(--border)] bg-white/78 p-5 sm:p-6">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="grid size-10 place-items-center rounded-[13px] bg-tk-green/10 text-[#237754]"><DevicesIcon size={21} /></div>
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Security</p>
        <h2 class="mt-1 text-xl font-bold">Devices & sessions</h2>
      </div>
    </div>
    <Button variant="secondary" size="sm" onclick={() => sessions.refetch()}>Refresh</Button>
  </div>

  {#if sessions.isPending}
    <div class="mt-6 space-y-2">{#each Array(3) as _}<div class="h-20 animate-pulse rounded-[15px] bg-black/[0.04]"></div>{/each}</div>
  {:else if sessions.data?.length}
    <div class="mt-6 divide-y divide-[var(--border)] rounded-[18px] border border-[var(--border)] bg-white/70">
      {#each sessions.data as session}
        <div class="flex flex-wrap items-center gap-4 p-4">
          <div class="grid size-10 shrink-0 place-items-center rounded-[12px] bg-black/[0.045]"><DesktopIcon size={19} /></div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-sm font-bold">{session.deviceName || 'Unnamed device'}</p>
              {#if session.current}<Badge tone="green"><ShieldCheckIcon size={12} weight="fill" /> Current</Badge>{/if}
            </div>
            <p class="mt-1 text-xs text-tk-graphite">Last used {formatDate(session.lastUsedAt)} · expires {formatDate(session.expiresAt)}</p>
          </div>
          <Button variant={session.current ? 'danger' : 'secondary'} size="sm" disabled={busyId === session.id} onclick={() => revoke.mutate({ id: session.id, current: session.current })}>
            {busyId === session.id ? 'Revoking…' : session.current ? 'Sign out here' : 'Revoke'}
          </Button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="mt-6 text-sm text-tk-graphite">No active sessions were returned.</p>
  {/if}

  <div class="mt-6 rounded-[17px] bg-[#f0f0ec] p-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-bold">Sign out every device</p>
        <p class="mt-1 text-xs leading-5 text-tk-graphite">This revokes all refresh sessions, including this browser. You will need to sign in again everywhere.</p>
      </div>
      {#if confirmAll}
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" onclick={() => (confirmAll = false)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={logoutAll.isPending} onclick={() => logoutAll.mutate()}><SignOutIcon size={15} /> {logoutAll.isPending ? 'Signing out…' : 'Confirm all devices'}</Button>
        </div>
      {:else}
        <Button variant="secondary" size="sm" onclick={() => (confirmAll = true)}><SignOutIcon size={15} /> Sign out all</Button>
      {/if}
    </div>
  </div>

  {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
</section>
