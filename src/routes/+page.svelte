<script lang="ts">
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>Taskiller — Plan it. Focus. Finish.</title></svelte:head>

<div class="min-h-screen bg-tk-paper">
  <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
    <Logo class="h-7 w-auto" />
    <div class="flex items-center gap-2">
      <a href="/login"><Button variant="ghost">Log in</Button></a>
      <a href="/register"><Button>Get started</Button></a>
    </div>
  </header>
  <main class="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:pt-28">
    <section>
      <p class="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-tk-strike">Execution, not backlog worship</p>
      <h1 class="tk-display max-w-3xl text-6xl font-black leading-[0.96] sm:text-7xl">Plan it.<br />Focus.<br />Finish.</h1>
      <p class="mt-8 max-w-xl text-lg leading-8 text-tk-graphite">Taskiller turns projects, sprints and chores into focused execution sessions—without pretending there is one scientifically perfect timer.</p>
      <div class="mt-10 flex flex-wrap gap-3">
        <a href="/register"><Button size="lg">Create your account</Button></a>
        <a href="/login"><Button size="lg" variant="secondary">Log in</Button></a>
      </div>
    </section>
    <section class="rounded-[28px] bg-tk-ink p-8 text-white shadow-none sm:p-10">
      <p class="text-sm font-semibold text-white/55">Focus session</p>
      <h2 class="tk-display mt-6 text-3xl font-bold">Ship the first Taskiller frontend</h2>
      <div class="tk-mono mt-16 text-7xl font-semibold">24:18</div>
      <div class="mt-7 h-2 overflow-hidden rounded-full bg-white/15"><div class="h-full w-[68%] rounded-full bg-tk-strike"></div></div>
      <div class="mt-12 border-t border-white/15 pt-5 text-sm text-white/60">Work 1 of 3 · server-authoritative state</div>
    </section>
  </main>
</div>
