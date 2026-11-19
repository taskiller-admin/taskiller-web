<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import AdminOverview from './AdminOverview.svelte';
  import AdminTable from './AdminTable.svelte';
  import AdminCommand from './AdminCommand.svelte';
  import AdminBulk from './AdminBulk.svelte';
  import StaffRoles from './StaffRoles.svelte';
  import WorkCorrection from './WorkCorrection.svelte';
  import { AdminProblem, adminMessage, adminRequest } from '$lib/api/admin/client';
  import { capabilities as c, type Row, type Page, type Overview, type Staff } from '$lib/api/admin/contract';
  import { userFields, jobFields, privacyFields, auditFields, staffFields, sessionFields,
    activityFields, workFields, rowActions, formatField, rowId } from '$lib/api/admin/views';

  let { data }: { data: { section: string; id: string; kind?: string; staff: Staff; writesEnabled: boolean } } = $props();
  let tab = $state('account');
  let status = $state(untrack(() => {
    const state = page.url.searchParams.get('state') ?? '';
    return data.section === 'operations' && ['dead', 'queued'].includes(state) ? state : '';
  }));
  let verified = $state('');
  let search = $state('');
  let type = $state('');
  let workKind = $state('chore');
  let stepUp = $state(false);
  let mfaCode = $state('');
  let verifying = $state(false);
  let windowEnd = $state(new Date().toISOString());
  let actorId = $state('');
  let targetId = $state('');
  let outcome = $state(untrack(() => data.section === 'audit' && page.url.searchParams.get('outcome') === 'denied' ? 'denied' : ''));
  let from = $state('');
  let to = $state('');
  let range = $state(untrack(() => {
    const days = page.url.searchParams.get('days') ?? '';
    return data.section === 'operations' && ['7', '30', '90'].includes(days) ? days : '30';
  }));
  let cursors = $state<string[]>([]);
  let selected = $state<string[]>([]);
  let revision = $state(0);
  let touched = $state(false);
  let rows = $state<Row[]>([]);
  let roles = $state<Row[]>([]);
  let record = $state<Row>();
  let etag = $state<string>();
  let overview = $state<Overview>();
  let overviewWindow = $state<{ start: string; end: string }>();
  let next = $state<string>();
  let busy = $state(true);
  let failure = $state('');
  let notice = $state('');
  let section = $derived(data.section === 'account' ? tab : data.section === 'operations' ? 'jobs' : data.section);
  const titles: Record<string, string> = { overview: 'Overview', users: 'Users', account: 'User account',
    operations: 'Operations', privacy: 'Privacy requests', 'privacy-detail': 'Privacy request', audit: 'Audit log', staff: 'Staff & roles', work: 'Work detail' };
  const detailFields: [string, string][] = [...workFields, ['description', 'Description'], ['ownerId', 'Account'], ['parentId', 'Parent'], ['workItemId', 'Work item'], ['focusPlanId', 'Focus Plan'], ['priority', 'Priority'], ['estimatedEffortSeconds', 'Estimated seconds']];
  const fields = { users: userFields, jobs: jobFields, privacy: privacyFields, audit: auditFields,
    staff: staffFields, sessions: sessionFields, activity: activityFields, work: workFields };
  const can = (key: string) => data.staff.capabilities.some(capability => capability === key);
  let bulk = $derived(data.writesEnabled && can(c.suspend) ?
    (['suspend', 'reactivate', 'revoke-sessions'] as const).slice() : []);
  const tabs = [
    { key: 'account', name: 'Account', cap: c.users },
    { key: 'sessions', name: 'Devices & sessions', cap: c.sessions },
    { key: 'activity', name: 'Activity', cap: c.activity },
    { key: 'work', name: 'Private work', cap: c.privateWork }
  ];

  function reset() { cursors = []; selected = []; }
  function refresh() {
    if (section === 'overview') windowEnd = new Date().toISOString();
    revision++;
  }
  function done(message: string) { notice = message; refresh(); }

  $effect(() => {
    revision;
    const view = section;
    const id = data.id;
    const cursor = cursors.at(-1) ?? '';
    const query = search.trim();
    const end = to && ['users', 'jobs', 'audit', 'privacy'].includes(view)
      ? new Date(Math.min(Date.parse(to + 'T00:00:00Z') + 86_400_000, Date.parse(windowEnd))).toISOString()
      : windowEnd;
    const days = view === 'overview' || view === 'jobs' ? Number(range) : 30;
    const start = from && ['users', 'jobs', 'audit', 'privacy'].includes(view) ? from + 'T00:00:00Z'
      : new Date(Date.parse(end) - days * 86_400_000).toISOString();
    const filter = Object.fromEntries(Object.entries({
      start, end, cursor,
      ...(view === 'users' ? { lifecycle: status, verified } : {}),
      ...(view === 'jobs' ? { type, state: status } : {}),
      ...(view === 'privacy' ? { type: type || 'export', state: status } : {}),
      ...(view === 'privacy-detail' ? { type: data.kind ?? '' } : {}),
      ...(view === 'audit' ? { actor: actorId, target: targetId, action: type, outcome } : {}),
      ...(view === 'work' ? { kind: data.section === 'work' ? data.kind || 'chore' : workKind } : {})
    }).filter(([, value]) => value !== ''));
    const params = new URLSearchParams(filter);
    if (view === 'account') {
      params.delete('start');
      params.delete('end');
    }
    const activeTab = data.section !== 'account' || view === 'account' || touched;
    const controller = new AbortController();
    busy = activeTab;
    failure = '';
    stepUp = false;
    rows = []; roles = []; record = undefined; etag = undefined; next = undefined; overview = undefined;
    if (!activeTab) return () => controller.abort();

    async function load() {
      try {
        if (view === 'overview' && !can(c.overview)) return;
        const resource = view === 'account' ? 'users/' + id :
          view === 'work' ? (data.section === 'work' ? 'work/' + id : 'users/' + id + '/work') :
          ['sessions', 'activity'].includes(view) ? 'users/' + id + '/' + view :
          view === 'privacy' ? 'privacy/requests' : view === 'privacy-detail' ? 'privacy/requests/' + id : view;
        const searchRequest = view === 'users' && query !== '';
        if (searchRequest && query.length < 3) { failure = 'Enter at least three characters to search.'; return; }
        const result = await adminRequest<Overview | Page | Row>(searchRequest ? 'users/search' : resource + (params.size ? '?' + params : ''), {
          signal: controller.signal, ...(searchRequest ? { method: 'POST' as const, body: { ...filter, query } } : {})
        });
        if (controller.signal.aborted) return;
        if (view === 'overview') {
          if (!result.data || typeof result.data !== 'object') throw new Error('Invalid overview');
          overview = result.data as Overview;
          overviewWindow = { start, end };
        } else if (view === 'account' || view === 'privacy-detail' || data.section === 'work') {
          const value = result.data as Row;
          if (value?.id !== id) throw new Error('Invalid record');
          record = value; etag = result.etag;
        } else {
          const value = result.data as Page;
          if (!Array.isArray(value?.items) || !value.items.every(item => item && typeof item === 'object')) throw new Error('Invalid list');
          rows = value.items;
          next = typeof value.nextCursor === 'string' && value.nextCursor ? value.nextCursor : undefined;
          if (view === 'staff' && data.writesEnabled) {
            const result = await adminRequest<Array<Omit<Row, 'id'> & { name: string }>>('roles', { signal: controller.signal });
            if (!controller.signal.aborted) roles = (Array.isArray(result.data) ? result.data : []).filter(item => rowId(item.name)).map(item => ({ ...item, id: item.name }));
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          stepUp = cause instanceof AdminProblem && ['admin_step_up_required', 'step_up_required'].includes(cause.code);
          failure = adminMessage(cause);
        }
      }
      finally { if (!controller.signal.aborted) busy = false; }
    }
    const timer = setTimeout(() => void load(), view === 'users' && query ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  });

  async function verify(event: SubmitEvent) {
    event.preventDefault();
    if (verifying) return;
    verifying = true;
    try {
      await adminRequest('auth/step-up', { method: 'POST', body: { code: mfaCode } });
      mfaCode = '';
      refresh();
    } catch (cause) { failure = adminMessage(cause); }
    finally { verifying = false; }
  }

  function changeTab(key: string) {
    if (tab === key) return;
    tab = key;
    touched = key !== 'work';
    notice = '';
    reset();
  }

  function toggle(id: string) {
    if (selected.includes(id)) selected = selected.filter(value => value !== id);
    else if (selected.length < 25) selected = [...selected, id];
  }
  function selectPage() {
    const ids = rows.map(row => row.id).filter(rowId);
    selected = [...new Set([...selected, ...ids])].slice(0, 25);
  }
</script>

<header class="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
  <div>
    <h1 class="tk-display break-words text-3xl sm:text-4xl">{titles[data.section] ?? 'Administration'}</h1>
    {#if section === 'overview'}<p class="mt-2 text-sm text-[var(--muted)]">Registrations, Execution Sessions, and job activity.</p>{/if}
  </div>
  <div class="flex flex-wrap items-end gap-2">
    {#if section === 'overview' && can(c.overview)}
      <label class="block text-xs font-bold">Date range<Select class="mt-1" bind:value={range}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
      </Select></label>
    {/if}
    <Button variant="secondary" size="sm" onclick={refresh} disabled={busy || (section === 'work' && data.section === 'account' && !touched)}>
      <ArrowClockwiseIcon size={17} aria-hidden="true" />Refresh
    </Button>
  </div>
</header>
{#if notice}<p role="status" class="mb-4 text-tk-green">{notice}</p>{/if}
{#if data.section === 'account'}
  <div class="mb-4 flex flex-wrap gap-2" aria-label="Account views">
    {#each tabs.filter(item => can(item.cap)) as item}
      <Button size="sm" variant={tab === item.key ? 'primary' : 'secondary'} aria-pressed={tab === item.key} onclick={() => changeTab(item.key)}>{item.name}</Button>
    {/each}
  </div>
{/if}
{#if section === 'users'}
  <div class="mb-4 grid items-end gap-3 sm:grid-cols-3">
    <label class="text-sm font-bold">Search users<Input class="mt-1" bind:value={search} oninput={reset} maxlength={200} placeholder="Name or email" autocomplete="off" /></label>
    <label class="text-sm font-bold">Account status<Select class="mt-1" bind:value={status} onchange={reset}>
      <option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="pending_deletion">Pending deletion</option>
    </Select></label>
    <label class="text-sm font-bold">Email verification<Select class="mt-1" bind:value={verified} onchange={reset}>
      <option value="">Any</option><option value="true">Verified</option><option value="false">Unverified</option>
    </Select></label>
  </div>
  <details class="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4">
    <summary class="min-h-11 cursor-pointer py-3 text-sm font-semibold">Registration dates</summary>
    <div class="grid gap-3 pb-4 sm:grid-cols-2">
      <label class="text-sm font-bold">From (UTC)<Input class="mt-1" type="date" bind:value={from} onchange={reset} /></label>
      <label class="text-sm font-bold">Through (UTC)<Input class="mt-1" type="date" bind:value={to} onchange={reset} /></label>
    </div>
  </details>
{:else if ['audit', 'jobs', 'privacy'].includes(section)}
  <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {#if section === 'jobs'}
      <label class="text-sm font-bold">Default window<Select class="mt-1" bind:value={range} onchange={reset}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
      </Select></label>
    {/if}
    {#if section === 'audit'}
      <label class="text-sm font-bold">Actor ID<Input class="mt-1" bind:value={actorId} oninput={reset} maxlength={80} /></label>
      <label class="text-sm font-bold">Target ID<Input class="mt-1" bind:value={targetId} oninput={reset} maxlength={80} /></label>
      <label class="text-sm font-bold">Action<Input class="mt-1" bind:value={type} oninput={reset} maxlength={80} /></label>
      <label class="text-sm font-bold">Outcome<Select class="mt-1" bind:value={outcome} onchange={reset}>
        <option value="">Any</option><option value="success">Success</option><option value="denied">Denied</option><option value="failed">Failed</option>
      </Select></label>
    {:else}
      <label class="text-sm font-bold">Type<Select class="mt-1" value={type || (section === 'privacy' ? 'export' : '')} onchange={event => { type = event.currentTarget.value; reset(); }}>
        {#if section === 'jobs'}<option value="">All types</option>{/if}
        {#each section === 'jobs' ? ['auth_email', 'retention', 'data_export', 'account_delete'] : ['export', 'deletion'] as kind}<option value={kind}>{kind.replaceAll('_', ' ')}</option>{/each}
      </Select></label>
      <label class="text-sm font-bold">Status<Select class="mt-1" bind:value={status} onchange={reset}>
        <option value="">All statuses</option>
        {#each section === 'jobs' ? ['queued', 'running', 'completed', 'dead'] : ['queued', 'pending', 'scheduled', 'running', 'completed', 'failed', 'cancelled'] as state}
          <option value={state}>{state === 'dead' ? 'Failed' : state}</option>
        {/each}
      </Select></label>
    {/if}
    <label class="text-sm font-bold">From (UTC)<Input class="mt-1" type="date" bind:value={from} onchange={reset} /></label>
    <label class="text-sm font-bold">Through (UTC)<Input class="mt-1" type="date" bind:value={to} onchange={reset} /></label>
  </div>
{/if}

{#if section === 'work' && data.section === 'account' && touched}
  <label class="mb-4 block max-w-52 text-sm font-bold">Work kind<Select class="mt-1" bind:value={workKind} onchange={reset}>
    {#each [['project','Project'], ['sprint','Sprint'], ['chore','Chore'], ['work_type','Work Type'], ['focus_plan','Focus Plan'], ['execution_session','Execution Session']] as [kind, label]}<option value={kind}>{label}</option>{/each}
  </Select></label>
{/if}
{#if section === 'users' && bulk.length}
  <div class="mb-4 space-y-2">
    <div class="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" disabled={busy || !rows.length || selected.length >= 25 || rows.every(row => selected.includes(row.id))} onclick={selectPage}>Select this page</Button>
      <Button size="sm" variant="ghost" disabled={!selected.length} onclick={() => { selected = []; }}>Clear selection</Button>
    </div>
    <AdminBulk ids={selected} operations={bulk} onDone={refresh} />
  </div>
{/if}
{#if busy}
  <p class="tk-panel flex items-center gap-2 p-6" role="status"><Spinner size={18} /> Loading records…</p>
{:else if failure}
  <div class="tk-panel space-y-3 p-6"><p role="alert" class="text-[var(--danger-text)]">{failure}</p>
    {#if stepUp}
      <form class="flex flex-wrap items-end gap-3" onsubmit={verify}>
        <label class="text-sm font-semibold">Authenticator code<Input class="mt-1" bind:value={mfaCode} autocomplete="one-time-code" required /></label>
        <Button type="submit" loading={verifying}>Verify identity</Button>
      </form>
    {:else}<Button size="sm" onclick={refresh}>Try again</Button>{/if}
  </div>
{:else if section === 'overview'}
  {#if overview && overviewWindow}
    <AdminOverview totals={overview} start={overviewWindow.start} end={overviewWindow.end} grants={data.staff.capabilities} />
  {:else}<p class="tk-panel p-6">Choose a section from the admin navigation.</p>{/if}
{:else if record}
  <section class="tk-panel p-5">
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {#each section === 'account' ? userFields : section === 'privacy-detail' ? privacyFields : detailFields.filter(([key]) => key in record!) as [key, label]}
        <div><dt class="text-sm font-bold text-[var(--muted)]">{label}</dt><dd class="mt-1 break-words">{formatField(key, record[key])}</dd></div>
      {/each}
    </dl>
    <div class="mt-5 flex flex-wrap gap-2">
      {#each rowActions(section, record, data.staff.capabilities, data.writesEnabled, data.id, etag) as command}
        <AdminCommand {command} onDone={done} onConflict={refresh} />
      {/each}
    </div>
    {#if section === 'work' && data.writesEnabled && can(c.correctWork) && can(c.suspend)}
      {#key record.id}<WorkCorrection row={record} {etag} onDone={done} {refresh} />{/key}
    {/if}
  </section>
{:else if section === 'work' && !touched}
  <section class="tk-panel space-y-3 p-5">
    <p>Access to private work is recorded in the audit log.</p>
    <Button onclick={() => { touched = true; }}>View private work</Button>
  </section>
{:else}
  {#if section === 'staff' && data.writesEnabled && roles.length}<div class="mb-4"><StaffRoles {rows} {roles} onDone={done} {refresh} /></div>{/if}
  <AdminTable {rows} fields={fields[section as keyof typeof fields] ?? []} label={section === 'jobs' ? 'Background jobs' : section}
    link={section === 'users' ? row => '/admin/users/' + row.id
      : section === 'work' ? row => '/admin/work/' + row.id + '?kind=' + encodeURIComponent(String(row.kind ?? workKind))
      : section === 'privacy' ? row => '/admin/privacy/' + row.id + '?type=' + encodeURIComponent(String(row.type))
      : undefined}
    actions={['sessions', 'jobs', 'privacy', 'staff'].includes(section) && data.writesEnabled ?
      row => rowActions(section, row, data.staff.capabilities, data.writesEnabled, data.id) : undefined}
    {selected} toggle={section === 'users' && bulk.length ? toggle : undefined} onDone={done} {refresh} />
  {#if cursors.length || next}
    <div class="mt-4 flex gap-2">
      <Button size="sm" variant="secondary" disabled={!cursors.length} onclick={() => { cursors = cursors.slice(0, -1); }}>Previous page</Button>
      <Button size="sm" variant="secondary" disabled={!next} onclick={() => { if (next) cursors = [...cursors, next]; }}>Next page</Button>
    </div>
  {/if}
{/if}
