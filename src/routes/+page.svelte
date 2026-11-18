<script lang="ts">
  import Logo from '$lib/components/brand/Logo.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import { formatClock } from '$lib/utils';
  let step = $state(0);
  let demoName = $state('Write the launch announcement');
  let running = $state(false);
  let seconds = $state(1500);
  const stages = ['Capture', 'Plan', 'Focus'];
  $effect(() => {
    if (!running || step !== 2) return;
    const interval = window.setInterval(() => { seconds = Math.max(0, seconds - 1); if (!seconds) running = false; }, 1000);
    return () => clearInterval(interval);
  });
  function preview(index: number) { running = false; step = index; }
</script>

<svelte:head><title>Taskiller — Turn plans into motion</title><meta name="description" content="Capture Chores, organize Projects and Sprints, and make room for focused work with Taskiller." /></svelte:head>
<header class="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-5 py-5 sm:px-8">
  <a href="/" aria-label="Taskiller home"><Logo class="h-6 w-auto" /></a>
  <nav class="flex items-center gap-1 sm:gap-3" aria-label="Get started"><ThemeToggle compact /><a href="/login" class="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-[var(--surface-subtle)]">Log in</a><a href="/register" class="tk-capture-link hidden sm:inline-flex">Start working</a></nav>
</header>
<main>
  <section class="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:min-h-[680px] lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-20">
    <div>
      <p class="mb-6 text-sm font-medium text-[var(--accent-ink)]">A little structure. Room to focus.</p>
      <h1 class="tk-display max-w-[10ch] text-[clamp(3.5rem,7vw,6rem)] font-bold leading-[1.03]">Your work should move.</h1>
      <p class="mt-7 max-w-[45ch] text-lg leading-8 text-tk-graphite">Capture what’s on your mind. Turn it into a plan you can act on. Give the next Chore your full attention.</p>
      <a href="/register" class="tk-capture-link mt-8 gap-3 px-5 py-4">Build momentum <ArrowRightIcon size={18} aria-hidden="true" /></a>
      <p class="mt-4 text-sm text-tk-graphite">Already have an account? <a href="/login" class="font-semibold text-[var(--foreground)] underline underline-offset-4">Pick up where you left off.</a></p>
    </div>
    <div class="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div class="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><span class="text-sm font-semibold">Try the flow</span><span class="rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-xs text-tk-graphite">Interactive example</span></div>
      <div class="grid grid-cols-3 gap-2 border-b border-[var(--border)] px-4 py-3" aria-label="Example steps">
        {#each stages as stage, index}<button type="button" aria-pressed={step === index} class={`min-h-11 rounded-lg text-sm font-semibold ${step === index ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'text-tk-graphite hover:bg-[var(--surface-subtle)]'}`} onclick={() => preview(index)}>{index + 1}. {stage}</button>{/each}
      </div>
      <div class="flex min-h-[360px] flex-col p-6 sm:p-8">
        {#if step === 0}
          <h2 class="text-2xl font-semibold">Start with one Chore.</h2><p class="mt-3 text-sm leading-6 text-tk-graphite">A name is enough to get it out of your head. Details can come later.</p>
          <label for="example-chore" class="mt-8 text-sm font-medium">What would you like to work on?</label><input id="example-chore" name="example-chore" class="mt-2 min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 text-base" bind:value={demoName} maxlength="100" autocomplete="off" />
          <button type="button" class="tk-capture-link mt-5 self-start" disabled={!demoName.trim()} onclick={() => preview(1)}>Preview a plan <ArrowRightIcon size={16} aria-hidden="true" /></button>
        {:else if step === 1}
          <h2 class="break-words text-2xl font-semibold">{demoName.trim() || 'Your next Chore'}</h2><p class="mt-3 text-sm leading-6 text-tk-graphite">An example plan with a work block and a break. In your workspace, you can generate or edit a plan to suit the work.</p>
          <ol class="my-6 divide-y divide-[var(--border)]"><li class="flex justify-between py-4 text-sm"><span>Focused work</span><span class="tk-mono font-medium">25 min</span></li><li class="flex justify-between py-4 text-sm"><span>Break</span><span class="tk-mono font-medium">5 min</span></li></ol>
          <button type="button" class="tk-capture-link mt-auto self-start" onclick={() => preview(2)}>Preview focus <ArrowRightIcon size={16} aria-hidden="true" /></button>
        {:else}
          <p class="break-words text-sm font-medium text-tk-graphite">{demoName.trim() || 'Your next Chore'}</p><h2 class="mt-4 text-xl font-semibold">One block. One thing.</h2><p class="tk-mono my-7 text-6xl font-semibold tracking-[-0.03em]" aria-label={`${formatClock(seconds)} on the example timer`}>{formatClock(seconds)}</p>
          <div class="flex flex-wrap gap-3"><button type="button" class="tk-capture-link" onclick={() => running = !running}>{running ? 'Pause preview' : 'Start preview'}</button><button type="button" class="min-h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold" onclick={() => { running = false; seconds = 1500; }}>Reset</button></div>
        {/if}
        <p class="mt-6 text-xs leading-5 text-tk-graphite">Example only. Nothing here is saved or recorded as a session.</p>
      </div>
    </div>
  </section>
  <section class="border-y border-[var(--border)] bg-[var(--surface)]">
    <div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_2fr]">
      <div><h2 class="tk-display text-3xl font-bold">Plan wide.<br />Execute narrow.</h2><p class="mt-4 max-w-sm text-sm leading-6 text-tk-graphite">Keep the bigger outcome in view without carrying every detail into your focus session.</p></div>
      <dl class="grid gap-8 sm:grid-cols-3"><div><dt class="text-lg font-semibold">Project</dt><dd class="mt-3 text-sm leading-6 text-tk-graphite">The outcome you’re working toward. Hold Sprints and Chores together.</dd></div><div><dt class="text-lg font-semibold">Sprint</dt><dd class="mt-3 text-sm leading-6 text-tk-graphite">A connected group of Chores. Make a larger effort manageable.</dd></div><div><dt class="text-lg font-semibold">Chore</dt><dd class="mt-3 text-sm leading-6 text-tk-graphite">The concrete next piece of work. Plan it, focus on it, and review how it went.</dd></div></dl>
    </div>
  </section>
</main>
<footer class="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-5 px-5 py-8 text-sm text-tk-graphite sm:px-8"><Logo class="h-5 w-auto" /><p>Less ceremony. More finished work.</p></footer>
