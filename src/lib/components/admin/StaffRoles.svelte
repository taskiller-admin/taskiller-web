<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import AdminCommand from './AdminCommand.svelte';
  import { rowId } from '$lib/api/admin/views';
  import type { Row } from '$lib/api/admin/contract';
  let { rows, roles, onDone, refresh }: { rows: Row[]; roles: Row[]; onDone: (message: string) => void; refresh: () => void } = $props();
  let email = $state('');
  let username = $state('');
  let invitation = $state('');
  let roleId = $state('');
  let targetId = $state('');
  let role = $derived(roles.find(item => item.id === roleId));
  let target = $derived(rows.find(item => item.id === targetId));
  let etag = $derived(typeof target?.etag === 'string' ? target.etag : undefined);
  let summary = $derived(role && Array.isArray(role.capabilities) ? role.capabilities.filter(item => typeof item === 'string').join(', ') : '');
</script>
<section class="tk-panel space-y-4 p-5" aria-label="Staff access management">
  <h2 class="tk-display text-lg">Invite or change access</h2>
  <div class="grid gap-3 sm:grid-cols-2">
    <label class="text-sm">Staff username<Input class="mt-1" bind:value={username} maxlength={150} /></label>
    <label class="text-sm">Staff email<Input class="mt-1" type="email" bind:value={email} /></label>
    <label class="text-sm">Staff account<Select class="mt-1" bind:value={targetId}><option value="">Choose an account</option>
      {#each rows.filter(item => rowId(item.id)) as row}<option value={row.id}>{row.displayName ?? row.email ?? row.id}</option>{/each}
    </Select></label>
    <label class="text-sm">Proposed role<Select class="mt-1" bind:value={roleId}><option value="">Choose a role</option>
      {#each roles as item}<option value={item.id}>{item.name ?? item.id}</option>{/each}
    </Select></label>
  </div>
  {#if target}<p class="text-sm">Current roles: {Array.isArray(target.roles) ? target.roles.join(', ') : 'Unavailable'}</p>{/if}
  {#if summary}<p class="break-words text-sm">Proposed permissions: {summary}</p>{/if}
  <div class="flex flex-wrap gap-2">
    <AdminCommand command={{ label: 'Invite staff', description: 'Create an invitation for ' + email + ' with role ' + (role?.name ?? roleId) + '. ' + summary, path: 'staff/invitations', body: { username: username.trim(), email: email.trim(), roles: [roleId] }, disabled: !username.trim() || !role || !/^\S+@\S+\.\S+$/.test(email.trim()) }} onDone={(message, data) => {
      const token = (data as { invitationToken?: string } | undefined)?.invitationToken;
      invitation = typeof token === 'string' ? token : '';
      if (!invitation) onDone(message);
    }} onConflict={refresh} />
    {#if target}<AdminCommand command={{ label: 'Replace staff roles', description: 'Assign only ' + (role?.name ?? roleId) + ' to ' + (target.displayName ?? target.id) + '. ' + summary, path: 'staff/' + target.id + '/roles', method: 'PATCH', body: { roles: [roleId] }, etag, disabled: !etag || !role, danger: true }} {onDone} onConflict={refresh} />{/if}
  </div>
  {#if invitation}
    <div class="space-y-2" role="status">
      <p>Share this single-use code securely. The staff member enters it at <a class="underline" href="/admin/enroll">/admin/enroll</a>.</p>
      <output class="block select-all break-all rounded-lg bg-[var(--surface-subtle)] p-3">{invitation}</output>
      <button type="button" class="min-h-11 underline" onclick={() => { invitation = ''; refresh(); }}>Dismiss invitation</button>
    </div>
  {/if}
</section>
