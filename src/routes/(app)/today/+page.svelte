<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ActiveSessionCard from '$lib/components/execution/ActiveSessionCard.svelte';
  import WorkItemRow from '$lib/components/work/WorkItemRow.svelte';
  import { listChores, quickCaptureChore } from '$lib/api/work';
  import { getActiveSession } from '$lib/api/execution';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';
  import { auth } from '$lib/auth/session';
  import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
  import ArrowUpRightIcon from 'phosphor-svelte/lib/ArrowUpRightIcon';
  import { protectUnsaved } from '$lib/actions/unsaved';

  const client = useQueryClient();
  const firstName = $derived($auth.user?.displayName?.split(' ')[0] ?? 'there');
  let quickName = $state('');
  let captured = $state<{ id: string; name: string } | null>(null);
  const chores = createQuery(() => ({ queryKey: queryKeys.work.chores, queryFn: listChores }));
  const active = createQuery(() => ({ queryKey: queryKeys.execution.active, queryFn: getActiveSession, refetchInterval: 15_000 }));
  const capture = createMutation(() => ({
    mutationFn: quickCaptureChore,
    onSuccess: async (item) => {
      captured = { id: item.id, name: item.name };
      quickName = '';
      await client.invalidateQueries({ queryKey: queryKeys.work.all });
    }
  }));
  protectUnsaved(() => Boolean(quickName.trim()) && !capture.isPending);
  const openChores = $derived((chores.data?.items ?? []).filter(i => !['completed', 'cancelled', 'archived'].includes(i.status)));
  const nextWork = $derived([...openChores].sort((a, b) => {
    const rank: Record<string, number> = { in_progress: 0, ready: 1, draft: 2 };
    return (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || (b.priority ?? 0) - (a.priority ?? 0) || a.position - b.position;
  }).slice(0, 7));
  const upcoming = $derived([...openChores].filter(i => i.plannedStartAt || i.deadlineAt).sort((a, b) => Date.parse(a.plannedStartAt || a.deadlineAt || '') - Date.parse(b.plannedStartAt || b.deadlineAt || '')).slice(0, 4));
  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (quickName.trim() && !capture.isPending) { captured = null; capture.mutate(quickName.trim()); }
  }
</script>

<svelte:head><title>Today — Taskiller</title></svelte:head>
<div class="tk-page">
  <header class="flex flex-wrap items-end justify-between gap-3">
    <div><p class="tk-eyebrow">A fresh point of focus</p><h1 class="tk-display font-bold">Today</h1><p class="mt-2 text-sm leading-6 text-tk-graphite">Pick one thing. Give it your attention.</p></div>
    {#if chores.data}<p class="text-sm text-tk-graphite">{openChores.length} open {openChores.length === 1 ? 'Chore' : 'Chores'}</p>{/if}
  </header>

  <section class="tk-today-hero mt-7" aria-label="Your focus space">
    <div class="relative z-10 max-w-lg">
      <p class="flex items-center gap-2 text-xs font-semibold text-[#bfd0e7]"><SparkleIcon size={16} aria-hidden="true" /> YOUR SPACE TO MAKE PROGRESS</p>
      <h2 class="tk-display mt-5 text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.2] text-white">Hey {firstName}.<br />Let’s make room<br class="hidden sm:block" /> for what matters.</h2>
      <p class="mt-4 max-w-[32ch] text-sm leading-6 text-[#bfd0e7]">You don’t need to do everything.<br />Just find your next good move.</p>
      <a href={nextWork[0] ? `/work/${nextWork[0].id}/plan` : '/inbox?capture=1'} class="tk-capture-link mt-6 gap-3">{nextWork[0] ? 'Plan your next session' : 'Capture your first Chore'}<ArrowUpRightIcon size={17} aria-hidden="true" /></a>
    </div>
    <div class="tk-today-orbit" aria-hidden="true">
      <div class="tk-hero-orbit-track tk-hero-orbit-track-outer"><span></span></div>
      <div class="tk-hero-orbit-track tk-hero-orbit-track-middle"><span></span></div>
      <div class="tk-hero-orbit-track tk-hero-orbit-track-inner"><span></span></div>
      <div class="tk-hero-orbit-core"><svg viewBox="0 0 80 80"><path d="M48 14 25 43h19l-9 24 28-34H43z" fill="currentColor" /></svg></div>
      <div class="tk-hero-orbit-caption"><span></span> FIND YOUR FLOW</div>
    </div>
    <div class="tk-today-hero-foot"><span class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-[#afe4d4]"></span>Small steps. Real momentum.</span><span class="tk-mono">{chores.data ? `${openChores.length} open` : 'Your workspace'}</span></div>
  </section>

  <form class="tk-capture-deck mt-6 flex gap-2 rounded-[14px] p-2" onsubmit={submit}>
    <Input id="quick-capture" class="flex-1 border-transparent bg-transparent text-base shadow-none focus:shadow-none" placeholder="What do you want to work on?" bind:value={quickName} oninput={() => captured = null} name="quick-capture" maxlength="300" autocomplete="off" aria-label="Quick capture chore" />
    <Button type="submit" variant="dark" loading={capture.isPending} aria-label={capture.isPending ? 'Saving chore' : 'Capture chore'} disabled={capture.isPending || !quickName.trim()}><PlusIcon size={18} aria-hidden="true" /><span class="hidden sm:inline">{capture.isPending ? 'Saving…' : 'Capture'}</span></Button>
  </form>
  {#if capture.isError}<p class="mt-3 text-sm text-[var(--danger-text)]" role="alert">{problemMessage(capture.error, 'Couldn’t save your Chore.')} Your draft is still here. Try again with Capture.</p>{/if}
  {#if captured}<p class="mt-3 text-sm" role="status">“{captured.name}” added. <a class="font-semibold text-[var(--accent-ink)] underline underline-offset-4" href={`/work/${captured.id}/plan`}>Plan your session →</a></p>{/if}

  {#if active.data?.session}<div class="mt-6"><ActiveSessionCard session={active.data.session} /></div>
  {:else if active.isError}<p role="alert" class="mt-5 rounded-xl border border-[var(--border)] p-3 text-sm">Couldn’t check your active session. <button type="button" class="min-h-11 px-2 font-semibold underline" onclick={() => active.refetch()}>Retry</button></p>{/if}

  <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
    <section class="min-w-0" aria-labelledby="next-work-heading">
      <div class="mb-3 flex items-center justify-between gap-3"><h2 id="next-work-heading" class="text-lg font-semibold">Up next</h2><a href="/inbox" class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-tk-graphite hover:text-[var(--foreground)]">Full inbox <ArrowRightIcon size={16} aria-hidden="true" /></a></div>
      <p class="mb-4 text-sm text-tk-graphite">Open work, with in-progress and higher-priority Chores first.</p>
      {#if chores.isPending}<div class="space-y-3" role="status" aria-label="Loading your work">{#each Array(3) as _}<div class="h-18 animate-pulse rounded-xl bg-[var(--surface-strong)]"></div>{/each}</div>
      {:else if chores.isError}<div class="tk-panel rounded-[14px] p-5" role="alert"><p>Couldn’t load your work.</p><Button class="mt-3" variant="secondary" onclick={() => chores.refetch()}>Retry loading</Button></div>
      {:else if nextWork.length === 0}<div class="tk-empty-state rounded-[14px] p-7"><h3 class="text-lg font-semibold">A clear place to start</h3><p class="mt-2 max-w-lg text-sm leading-6 text-tk-graphite">Capture a Chore above. When you’re ready, open it to choose a Work Type and build a Focus Plan.</p><a href="/guide#planning" class="mt-3 inline-flex min-h-11 items-center font-semibold text-[var(--accent-ink)]">See how a focus session works →</a></div>
      {:else}<div class="tk-panel rounded-[14px] px-3">{#each nextWork as item (item.id)}<WorkItemRow {item} />{/each}</div>{#if openChores.length > 7}<a href="/projects?kind=chore" class="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-ink)]">Browse all {openChores.length} open Chores →</a>{/if}{/if}
    </section>
    <aside class="tk-today-aside space-y-6">
      <section class="border-t border-[var(--border)] pt-5 lg:border-t-0 lg:pt-3">
        <h2 class="text-base font-semibold">Upcoming</h2>
        {#if upcoming.length}<div class="mt-3 space-y-2">{#each upcoming as item (item.id)}<a href={`/work/${item.id}`} class="block rounded-xl p-3 hover:bg-[var(--surface-subtle)]"><p class="break-words text-sm font-semibold">{item.name}</p><p class="mt-1 text-xs text-tk-graphite">{item.plannedStartAt ? 'Planned' : 'Due'} · {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(item.plannedStartAt || item.deadlineAt || ''))}</p></a>{/each}</div>
        {:else if chores.data}<p class="mt-3 text-sm leading-6 text-tk-graphite">No planned starts or deadlines in your open work.</p>{/if}
      </section>
      {#if active.isSuccess && !active.data?.session}<section class="border-t border-[var(--border)] pt-5"><h2 class="text-base font-semibold">Make room for focus</h2><p class="mt-2 text-sm leading-6 text-tk-graphite">Open a Chore, choose a plan, and start when you’re ready.</p><a href="/projects?kind=chore" class="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-ink)]">Choose your work →</a></section>{/if}
    </aside>
  </div>
</div>
