<script lang="ts">
  import { page } from '$app/state';
  import { createQuery } from '@tanstack/svelte-query';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import ActiveSessionCard from '$lib/components/execution/ActiveSessionCard.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { getExecutionSession } from '$lib/api/execution';
  import { getWorkItem } from '$lib/api/work';
  import { queryKeys } from '$lib/api/query-keys';

  const id = page.params.id;
  const session = createQuery(() => ({
    queryKey: queryKeys.execution.detail(id),
    queryFn: () => getExecutionSession(id)
  }));
  const work = createQuery(() => ({
    queryKey: queryKeys.work.detail(session.data?.session.workItemId ?? ''),
    queryFn: () => getWorkItem(session.data!.session.workItemId),
    enabled: Boolean(session.data?.session.workItemId)
  }));
</script>

<svelte:head><title>Focus session — Taskiller</title></svelte:head>

<div class="min-h-[calc(100vh-64px)] bg-[#111214] px-5 py-8 text-white sm:px-8 lg:px-12 lg:py-12">
  <div class="mx-auto max-w-[980px]">
    <a href="/today" class="inline-flex items-center gap-1.5 text-sm font-bold text-white/50 hover:text-white"><ArrowLeftIcon size={15} /> Today</a>

    {#if session.isPending}
      <div class="mt-8 h-80 animate-pulse rounded-[24px] bg-white/[0.06]"></div>
    {:else if session.isError || !session.data}
      <div class="mt-8 rounded-[20px] border border-red-500/30 bg-red-500/10 p-6 text-red-100">Couldn’t load this session.</div>
    {:else}
      <header class="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2"><Badge class="border-white/10 bg-white/10 text-white">{session.data.session.state}</Badge><span class="text-xs text-white/40">Session snapshot</span></div>
          <h1 class="tk-display mt-3 text-4xl font-extrabold sm:text-5xl">{work.data?.item.name ?? 'Focus session'}</h1>
          <p class="mt-2 text-sm text-white/50">Round 3 starts and reconstructs the session. Round 4 adds the full event-control surface.</p>
        </div>
      </header>

      <div class="mt-7"><ActiveSessionCard session={session.data.session} /></div>

      <section class="mt-6 rounded-[22px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">Immutable plan snapshot</p>
        <div class="mt-4 grid gap-2">
          {#each session.data.session.planSnapshot.segments as segment, index}
            <div class="flex items-center gap-3 rounded-[14px] bg-white/[0.05] px-4 py-3">
              <span class="tk-mono flex size-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">{index + 1}</span>
              <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold capitalize">{segment.label || segment.kind.replaceAll('_', ' ')}</p><p class="mt-0.5 text-xs text-white/40">{segment.durationMode} · {segment.targetSeconds ? `${Math.round(segment.targetSeconds / 60)} min` : 'open'}</p></div>
              {#if index === session.data.session.currentSegmentIndex}<span class="size-2 rounded-full bg-tk-strike"></span>{/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>
