<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import StackIcon from 'phosphor-svelte/lib/StackIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';

  let driftX = $state(0);
  let driftY = $state(0);
  let stage = $state<HTMLElement | null>(null);

  function moveStage(event: PointerEvent) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    driftX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    driftY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function resetStage() {
    driftX = 0;
    driftY = 0;
  }

  onMount(() => {
    const node = stage;
    if (!node) return;
    const leave = () => resetStage();
    node.addEventListener('pointermove', moveStage);
    node.addEventListener('pointerleave', leave);
    return () => {
      node.removeEventListener('pointermove', moveStage);
      node.removeEventListener('pointerleave', leave);
    };
  });
</script>

<svelte:head>
  <title>Taskiller — Turn plans into motion</title>
  <meta name="description" content="Taskiller turns Projects, Sprints and Chores into focused execution sessions." />
</svelte:head>

<div class="min-h-screen overflow-hidden">
  <header class="relative z-30 mx-auto flex max-w-[1360px] items-center justify-between px-5 py-5 sm:px-8 lg:py-7">
    <Logo class="h-6 w-auto" />
    <div class="flex items-center gap-2">
      <ThemeToggle compact />
      <a href="/login"><Button variant="ghost">Log in</Button></a>
      <a href="/register"><Button variant="dark">Start working</Button></a>
    </div>
  </header>

  <main>
    <section class="relative mx-auto grid min-h-[calc(100dvh-84px)] max-w-[1360px] items-center gap-16 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 lg:pb-24">
      <div class="relative z-10 max-w-[720px]" style="animation:tk-hero-in 620ms cubic-bezier(.2,.8,.2,1) both">
        <div class="mb-7 flex items-center gap-3 text-sm font-semibold text-tk-graphite">
          <span class="relative flex size-2.5">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-tk-strike opacity-35"></span>
            <span class="relative inline-flex size-2.5 rounded-full bg-tk-strike"></span>
          </span>
          Plans are useful. Motion is the point.
        </div>

        <h1 class="tk-display max-w-[12ch] text-[clamp(4.2rem,9vw,8rem)] font-extrabold leading-[0.84]">
          Your work should move.
        </h1>

        <p class="mt-8 max-w-[54ch] text-lg leading-8 text-tk-graphite sm:text-xl">
          Taskiller turns Projects into Sprints, Chores, and focus sessions without turning the planning itself into another job.
        </p>

        <div class="mt-10 flex flex-wrap items-center gap-3">
          <a href="/register"><Button size="lg" variant="dark">Build momentum <ArrowRightIcon size={17} /></Button></a>
          <a href="/login" class="rounded-[12px] px-3 py-3 text-sm font-bold text-tk-graphite transition-colors hover:text-tk-ink">I already have an account</a>
        </div>

        <div class="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold text-tk-graphite">
          <span>No productivity personality test.</span>
          <span>No fake streak pressure.</span>
          <span>Your data stays server-backed.</span>
        </div>
      </div>

      <div bind:this={stage} class="relative min-h-[560px] lg:min-h-[660px]">
        <div class="absolute inset-0 rounded-[44px] tk-grid opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"></div>

        <div
          class="tk-panel absolute left-[2%] top-[7%] w-[88%] rounded-[26px] p-5 sm:left-[6%] sm:w-[76%] sm:p-6"
          style={`transform:translate3d(${driftX * -8}px,${driftY * -6}px,0) rotate(-1.6deg);transition:transform 180ms cubic-bezier(.2,.8,.2,1);animation:tk-hero-in 680ms 90ms cubic-bezier(.2,.8,.2,1) both`}
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="grid size-10 place-items-center rounded-[12px] bg-tk-blue/10 text-tk-blue"><TreeStructureIcon size={20} weight="fill" /></span>
              <div><p class="text-xs font-semibold text-tk-graphite">Project</p><p class="font-bold">Launch Taskiller</p></div>
            </div>
            <span class="h-2 w-16 overflow-hidden rounded-full bg-[var(--surface-subtle)]"><span class="block h-full w-2/3 rounded-full bg-tk-strike"></span></span>
          </div>

          <div class="mt-6 space-y-2.5 border-l border-[var(--border)] pl-5">
            <div class="flex items-center gap-3 rounded-[14px] bg-[var(--surface-subtle)] p-3">
              <StackIcon size={18} class="text-violet-500" weight="fill" />
              <div class="min-w-0"><p class="text-xs text-tk-graphite">Sprint</p><p class="truncate text-sm font-bold">Production frontend</p></div>
            </div>
            <div class="ml-7 flex items-center gap-3 rounded-[14px] border border-tk-strike/20 bg-tk-strike/7 p-3">
              <CheckCircleIcon size={18} class="text-tk-strike" />
              <div class="min-w-0"><p class="text-xs text-tk-graphite">Chore</p><p class="truncate text-sm font-bold">Ship the interactive workspace</p></div>
            </div>
          </div>
        </div>

        <div
          class="tk-session-reactor absolute bottom-[6%] right-[1%] w-[86%] rounded-[28px] p-6 text-white sm:right-[5%] sm:w-[72%] sm:p-7"
          style={`transform:translate3d(${driftX * 11}px,${driftY * 9}px,0) rotate(1.8deg);transition:transform 180ms cubic-bezier(.2,.8,.2,1);animation:tk-hero-in 720ms 170ms cubic-bezier(.2,.8,.2,1) both`}
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2 text-sm font-semibold text-white/55"><LightningIcon size={15} class="text-tk-strike" weight="fill" aria-hidden="true" /> Focus is live</div>
            <span class="rounded-md bg-white/8 px-2 py-1 text-[10px] font-bold text-white/45">SEGMENT 1 / 3</span>
          </div>
          <div class="tk-mono mt-12 text-[clamp(4rem,10vw,7rem)] font-semibold tracking-[-0.075em]">24:18</div>
          <div class="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="tk-progress-beam h-full w-[68%] rounded-full bg-tk-strike"></div></div>
          <div class="mt-4 flex items-center justify-between text-xs text-white/40"><span>Work block</span><span>45 min target</span></div>
        </div>

        <div class="absolute left-[6%] top-[56%] hidden h-px w-[34%] overflow-visible bg-gradient-to-r from-transparent via-tk-strike/45 to-transparent sm:block">
          <span class="absolute -top-1 left-[38%] size-2 rounded-full bg-tk-strike shadow-[0_0_20px_rgb(255_99_63/0.65)]" style="animation:tk-float 2.7s ease-in-out infinite"></span>
        </div>
      </div>
    </section>

    <section class="border-y border-[var(--border)] bg-[var(--surface)]/45">
      <div class="mx-auto grid max-w-[1360px] gap-0 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div class="py-12 pr-0 lg:py-16 lg:pr-16">
          <p class="text-sm font-semibold text-tk-graphite">One system, three scales.</p>
          <h2 class="tk-display mt-3 max-w-[11ch] text-4xl font-bold sm:text-5xl">Plan wide. Execute narrow.</h2>
        </div>

        <div class="grid border-t border-[var(--border)] lg:grid-cols-3 lg:border-l lg:border-t-0">
          {#each [
            ['Project', 'Hold the outcome.'],
            ['Sprint', 'Group the push.'],
            ['Chore', 'Name the next move.']
          ] as step, index}
            <div class="relative border-b border-[var(--border)] p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <span class="tk-mono text-xs text-tk-graphite">0{index + 1}</span>
              <p class="mt-10 text-xl font-bold">{step[0]}</p>
              <p class="mt-2 text-sm leading-6 text-tk-graphite">{step[1]}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <footer class="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-5 py-10 text-sm text-tk-graphite sm:px-8">
      <Logo class="h-5 w-auto opacity-70" />
      <span>Less ceremony. More finished work.</span>
    </footer>
  </main>
</div>
