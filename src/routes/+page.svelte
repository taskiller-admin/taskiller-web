<script lang="ts">
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import FolderNotchOpenIcon from 'phosphor-svelte/lib/FolderNotchOpenIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import StackIcon from 'phosphor-svelte/lib/StackIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>Taskiller — Turn plans into finished work</title></svelte:head>

<div class="min-h-screen overflow-hidden">
  <header class="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8">
    <Logo class="h-6 w-auto" />
    <div class="flex items-center gap-1 sm:gap-2">
      <a href="/login"><Button variant="ghost">Log in</Button></a>
      <a href="/register"><Button>Start working</Button></a>
    </div>
  </header>

  <main>
    <section class="mx-auto grid max-w-[1240px] gap-14 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:pb-32 lg:pt-24">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/75 px-3 py-1.5 text-xs font-bold text-tk-graphite">
          <span class="size-2 rounded-full bg-tk-strike"></span>
          From backlog to executable work
        </div>
        <h1 class="tk-display mt-7 max-w-3xl text-6xl font-extrabold leading-[0.94] sm:text-7xl lg:text-[5.4rem]">
          Make the next move obvious.
        </h1>
        <p class="mt-7 max-w-xl text-lg leading-8 text-tk-graphite">Taskiller turns messy Projects into Sprints, Chores, and focused execution sessions—without forcing you into one productivity ritual.</p>
        <div class="mt-9 flex flex-wrap gap-3">
          <a href="/register"><Button size="lg">Create your workspace <ArrowRightIcon size={17} /></Button></a>
          <a href="/login"><Button size="lg" variant="secondary">I already have an account</Button></a>
        </div>
      </div>

      <div class="relative min-h-[480px]">
        <div class="absolute inset-x-4 top-3 rotate-[-2deg] rounded-[26px] border border-[var(--border)] bg-white/75 p-6 shadow-[0_24px_70px_rgb(23_23_23/0.08)] sm:inset-x-12">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-[12px] bg-tk-blue/10 text-tk-blue"><FolderNotchOpenIcon size={20} weight="fill" /></span><div><p class="text-xs font-bold uppercase tracking-[0.1em] text-tk-graphite">Project</p><p class="font-bold">Launch Taskiller</p></div></div>
            <span class="rounded-full bg-black/[0.05] px-2.5 py-1 text-[10px] font-bold text-tk-graphite">IN PROGRESS</span>
          </div>
          <div class="ml-5 mt-5 border-l border-[var(--border)] pl-5">
            <div class="flex items-center gap-3 rounded-[14px] bg-[#f1f1ed] p-3"><StackIcon size={18} class="text-violet-600" weight="fill" /><div><p class="text-xs text-tk-graphite">Sprint</p><p class="text-sm font-bold">Frontend foundation</p></div></div>
            <div class="ml-7 mt-2 flex items-center gap-3 rounded-[14px] bg-white p-3"><CheckCircleIcon size={18} class="text-tk-strike" /><div><p class="text-xs text-tk-graphite">Chore</p><p class="text-sm font-bold">Build project hierarchy</p></div></div>
          </div>
        </div>

        <div class="absolute bottom-0 right-0 w-[78%] rotate-[2deg] rounded-[26px] bg-tk-ink p-6 text-white shadow-[0_28px_80px_rgb(23_23_23/0.18)] sm:p-7">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-white/45"><LightningIcon size={15} class="text-tk-strike" weight="fill" /> Active focus</div>
          <div class="tk-mono mt-10 text-6xl font-semibold tracking-[-0.06em]">24:18</div>
          <div class="mt-5 h-1.5 overflow-hidden rounded-full bg-white/12"><div class="h-full w-[68%] rounded-full bg-tk-strike"></div></div>
          <div class="mt-4 flex items-center justify-between text-xs text-white/45"><span>Work · segment 1/3</span><span>45 min target</span></div>
        </div>
      </div>
    </section>

    <section class="border-y border-[var(--border)] bg-white/55">
      <div class="mx-auto grid max-w-[1240px] gap-px px-5 sm:grid-cols-3 sm:px-8">
        <div class="py-8 sm:pr-8"><p class="text-xs font-bold uppercase tracking-[0.12em] text-tk-graphite">Capture</p><h2 class="mt-2 text-xl font-bold">A name is enough.</h2><p class="mt-2 text-sm leading-6 text-tk-graphite">Add detail later instead of turning task entry into paperwork.</p></div>
        <div class="border-[var(--border)] py-8 sm:border-x sm:px-8"><p class="text-xs font-bold uppercase tracking-[0.12em] text-tk-graphite">Structure</p><h2 class="mt-2 text-xl font-bold">Project → Sprint → Chore.</h2><p class="mt-2 text-sm leading-6 text-tk-graphite">Enough hierarchy to plan serious work without becoming project-management theater.</p></div>
        <div class="py-8 sm:pl-8"><p class="text-xs font-bold uppercase tracking-[0.12em] text-tk-graphite">Execute</p><h2 class="mt-2 text-xl font-bold">Server-backed focus.</h2><p class="mt-2 text-sm leading-6 text-tk-graphite">Sessions reconstruct across devices from durable timestamps and events.</p></div>
      </div>
    </section>
  </main>
</div>
