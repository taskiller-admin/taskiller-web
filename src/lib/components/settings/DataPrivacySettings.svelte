<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import ArchiveIcon from 'phosphor-svelte/lib/ArchiveIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import {
    AccountConflictError,
    exportDownloadUrl,
    getDataExport,
    getProfile,
    requestAccountDeletion,
    requestDataExport,
    type DataExport
  } from '$lib/api/account';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { clearAuth } from '$lib/auth/session';

  const exportStorageKey = 'taskiller:last-export-request';
  let exportRequestId = $state<string | null>(null);
  let deletePhrase = $state('');
  let deleting = $state(false);
  let error = $state('');
  let exportMessage = $state('');

  onMount(() => {
    exportRequestId = localStorage.getItem(exportStorageKey);
  });

  const profile = createQuery(() => ({
    queryKey: queryKeys.account.profile,
    queryFn: getProfile
  }));

  const exportQuery = createQuery(() => ({
    queryKey: exportRequestId ? queryKeys.account.export(exportRequestId) : ['account', 'export', 'none'],
    queryFn: () => getDataExport(exportRequestId as string),
    enabled: Boolean(exportRequestId),
    refetchInterval: (query) => {
      const status = (query.state.data as DataExport | undefined)?.status;
      return status === 'queued' || status === 'processing' ? 3000 : false;
    }
  }));

  const createExport = createMutation(() => ({
    mutationFn: requestDataExport,
    onSuccess: (result) => {
      error = '';
      exportMessage = 'Export requested. Taskiller will update this card when it is ready.';
      exportRequestId = result.requestId;
      if (browser) localStorage.setItem(exportStorageKey, result.requestId);
    },
    onError: (cause) => {
      exportMessage = '';
      error = problemMessage(cause, 'Could not request a data export.');
    }
  }));

  const deletion = createMutation(() => ({
    mutationFn: () => requestAccountDeletion(profile.data?.etag ?? null),
    onSuccess: async (result) => {
      clearAuth();
      const params = new URLSearchParams({
        executeAfter: result.executeAfter,
        requestedAt: result.requestedAt
      });
      await goto(`/account-deletion-scheduled?${params.toString()}`);
    },
    onError: async (cause) => {
      deleting = false;
      if (cause instanceof AccountConflictError) {
        error = 'Your account changed elsewhere. The latest profile has been reloaded; confirm deletion again.';
        await profile.refetch();
        return;
      }
      error = problemMessage(cause, 'Could not schedule account deletion.');
    }
  }));

  function formatBytes(value: number | null | undefined) {
    if (value == null) return '—';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  function beginDeletion() {
    deleting = true;
    error = '';
  }

  function confirmDeletion() {
    if (deletePhrase !== 'DELETE MY ACCOUNT') return;
    deletion.mutate();
  }
</script>

<section id="data" class="scroll-mt-24 rounded-[22px] border border-[var(--border)] bg-white/78 p-5 sm:p-6">
  <div class="flex items-start gap-3">
    <div class="grid size-10 place-items-center rounded-[13px] bg-tk-blue/10 text-[#3654c9]"><ArchiveIcon size={21} /></div>
    <div>
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Portability & privacy</p>
      <h2 class="mt-1 text-xl font-bold">Your data</h2>
    </div>
  </div>

  <div class="mt-6 grid gap-5 xl:grid-cols-2">
    <div class="rounded-[18px] border border-[var(--border)] bg-white/70 p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="font-bold">Export your Taskiller data</p>
          <p class="mt-1 max-w-md text-sm leading-6 text-tk-graphite">Creates a compressed JSON archive of your profile, preferences, work hierarchy, focus plans, execution sessions, events and reviews. Authentication secrets are excluded.</p>
        </div>
        <Button variant="secondary" size="sm" disabled={createExport.isPending || exportQuery.data?.status === 'queued' || exportQuery.data?.status === 'processing'} onclick={() => createExport.mutate()}>
          <DownloadSimpleIcon size={15} /> {createExport.isPending ? 'Requesting…' : 'Request export'}
        </Button>
      </div>

      {#if exportRequestId}
        <div class="mt-5 rounded-[15px] bg-[#f0f0ec] p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold">Latest request</span>
              {#if exportQuery.data?.status === 'ready'}<Badge tone="green">Ready</Badge>
              {:else if exportQuery.data?.status === 'failed'}<Badge tone="danger">Failed</Badge>
              {:else}<Badge tone="blue">{exportQuery.data?.status ?? 'Loading'}</Badge>{/if}
            </div>
            <button type="button" class="text-xs font-bold text-tk-graphite hover:text-tk-ink" onclick={() => exportQuery.refetch()}>Refresh</button>
          </div>
          {#if exportQuery.data}
            <dl class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt class="text-xs text-tk-graphite">Created</dt><dd class="mt-1 font-semibold">{formatDate(exportQuery.data.createdAt)}</dd></div>
              <div><dt class="text-xs text-tk-graphite">Size</dt><dd class="tk-mono mt-1 font-semibold">{formatBytes(exportQuery.data.archiveSizeBytes)}</dd></div>
              <div><dt class="text-xs text-tk-graphite">Expires</dt><dd class="mt-1 font-semibold">{formatDate(exportQuery.data.expiresAt)}</dd></div>
              <div><dt class="text-xs text-tk-graphite">SHA-256</dt><dd class="tk-mono mt-1 truncate font-semibold" title={exportQuery.data.archiveSha256 ?? ''}>{exportQuery.data.archiveSha256 ? `${exportQuery.data.archiveSha256.slice(0, 12)}…` : '—'}</dd></div>
            </dl>
            {#if exportQuery.data.status === 'ready' && exportQuery.data.downloadUrl}
              <a class="mt-4 inline-flex h-10 items-center gap-2 rounded-[12px] bg-tk-ink px-4 text-sm font-bold text-white" href={exportDownloadUrl(exportQuery.data.downloadUrl)}>
                <DownloadSimpleIcon size={15} /> Download archive
              </a>
            {:else if exportQuery.data.status === 'failed'}
              <p class="mt-4 text-sm text-red-700">Export failed{exportQuery.data.failureCode ? ` · ${exportQuery.data.failureCode}` : ''}.</p>
            {:else}
              <p class="mt-4 text-xs leading-5 text-tk-graphite">The free Render deployment may sleep when idle, so background export processing can be delayed until the service is awake.</p>
            {/if}
          {/if}
        </div>
      {/if}
      {#if exportMessage}<p class="mt-3 text-sm text-tk-green">{exportMessage}</p>{/if}
    </div>

    <div class="rounded-[18px] border border-red-200 bg-red-50/75 p-5">
      <div class="flex items-start gap-3">
        <WarningCircleIcon size={20} class="mt-0.5 shrink-0 text-red-700" weight="fill" />
        <div>
          <p class="font-bold text-red-950">Delete account</p>
          <p class="mt-1 text-sm leading-6 text-red-900/75">Scheduling deletion immediately deactivates the account and revokes all device sessions. The backend permanently deletes account data after its configured grace period.</p>
        </div>
      </div>

      {#if deleting}
        <div class="mt-5 rounded-[14px] border border-red-200 bg-white/65 p-4">
          <p class="text-sm font-bold text-red-950">Type DELETE MY ACCOUNT to continue.</p>
          <Input class="mt-3 border-red-200" bind:value={deletePhrase} autocomplete="off" />
          <p class="mt-2 text-xs leading-5 text-red-900/65">Taskiller currently exposes no cancellation endpoint for a scheduled deletion, so only confirm when you intend to leave.</p>
          <div class="mt-4 flex gap-2">
            <Button variant="ghost" size="sm" onclick={() => { deleting = false; deletePhrase = ''; }}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={deletePhrase !== 'DELETE MY ACCOUNT' || deletion.isPending} onclick={confirmDeletion}>
              <TrashIcon size={15} /> {deletion.isPending ? 'Scheduling…' : 'Schedule deletion'}
            </Button>
          </div>
        </div>
      {:else}
        <Button class="mt-5" variant="danger" size="sm" disabled={profile.isPending || !profile.data?.etag} onclick={beginDeletion}><TrashIcon size={15} /> Delete account</Button>
      {/if}
    </div>
  </div>

  {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
</section>
