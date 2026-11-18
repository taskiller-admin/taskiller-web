<script lang="ts">
  import MotionToggle from '$lib/components/theme/MotionToggle.svelte';
  import FocusOrbit from '$lib/components/brand/FocusOrbit.svelte';
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import Logo from '$lib/components/brand/Logo.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import { formatClock } from '$lib/utils';
  let reduceMotion = $state(true);
  onMount(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => reduceMotion = query.matches;
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });
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

<div class="public-site">
  <header class="site-header">
    <a href="/" aria-label="Taskiller home"><Logo class="h-7 w-auto" /></a>
    <nav aria-label="Get started"><a class="how-link" href="#the-flow">How it works</a><MotionToggle /><ThemeToggle compact /><a href="/login" class="login-link">Log in</a><a href="/register" class="nav-cta">Start working <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> A LITTLE STRUCTURE. ROOM TO FOCUS.</p>
        <h1>Your work<br /> should <span class="move-word">move.<svg viewBox="0 0 290 20" fill="none" aria-hidden="true"><path d="M3 14Q130 -2 285 9" stroke="currentColor" stroke-width="5" stroke-linecap="round" /></svg></span></h1>
        <p class="hero-description">Capture what’s on your mind. Turn it into a plan you can act on. Give the next Chore your full attention.</p>
        <a href="/register" class="primary-link">Build momentum <ArrowRightIcon size={20} aria-hidden="true" /></a>
        <p class="returning">Already have an account? <a href="/login">Pick up where you left off.</a></p>
        <div class="flow-caption"><span>Less mental clutter.</span><span>More forward motion.</span></div>
      </div>
      <div class="preview-scene">
        <div class="preview-orbit"><FocusOrbit compact /></div>
        <div class="scene-caption"><span class="live-dot"></span> FROM “I SHOULD” TO “IT’S DONE”<span class="scene-number">01 / 03</span></div>
        <div class="app-preview">
          <div class="app-chrome"><div class="window-dots"><i></i><i></i><i></i></div><span>YOUR FOCUS, IN PRACTICE</span><span aria-hidden="true">↗</span></div>
    <div class="demo-window">
      <div class="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><span class="text-sm font-semibold">Try the flow</span><span class="rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-xs text-tk-graphite">Interactive example</span></div>
      <div class="grid grid-cols-3 gap-2 border-b border-[var(--border)] px-4 py-3" aria-label="Example steps">
        {#each stages as stage, index}<button type="button" aria-pressed={step === index} class={`min-h-11 rounded-lg text-sm font-semibold ${step === index ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'text-tk-graphite hover:bg-[var(--surface-subtle)]'}`} onclick={() => preview(index)}>{index + 1}. {stage}</button>{/each}
      </div>
      <div class="demo-body">
        {#key step}<div class="demo-stage" in:fly={{ y: reduceMotion ? 0 : 14, duration: reduceMotion ? 0 : 300 }}>
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
        </div>{/key}
        <p class="mt-6 text-xs leading-5 text-tk-graphite">Example only. Nothing here is saved or recorded as a session.</p>
      </div>
    </div>
        </div>
        <div class="preview-foot"><span class="mint-check">✓</span><span>One next step. That’s a good start.</span><span class="tiny-orbits" aria-hidden="true">◯ ◯ ◯</span></div>
      </div>
    </section>
    <section class="process" id="the-flow">
      <div class="section-heading" data-motion><p class="eyebrow">A FLOW YOU CAN COME BACK TO</p><h2>Big picture in mind.<br /><span>Next step in reach.</span></h2><p>You don’t need to solve your whole week.<br />Just give your next piece of work a way forward.</p></div>
      <div class="process-grid">
        <article data-motion class="process-card capture-card"><div class="step-heading"><span>01 / CAPTURE</span><span aria-hidden="true">↗</span></div><div class="mini-capture" aria-hidden="true"><span class="mini-plus">+</span><span>That thing on your mind…</span><span class="cursor"></span></div><h3>Get it out of your head.</h3><p>A name is enough. Capture a Chore now; add the details when you’re ready.</p></article>
        <article data-motion class="process-card plan-card"><div class="step-heading"><span>02 / PLAN</span><span aria-hidden="true">↗</span></div><div class="mini-plan" aria-hidden="true"><div><i></i><span>Focused work</span><b>25 min</b></div><div><i></i><span>A little breathing room</span><b>5 min</b></div></div><h3>Make room for the work.</h3><p>Shape a Focus Plan around the Chore. A clear work block. A well-earned break.</p></article>
        <article data-motion class="process-card focus-card"><div class="step-heading"><span>03 / FOCUS</span><span aria-hidden="true">↗</span></div><div class="mini-timer" aria-hidden="true"><span>25:00</span><i></i><b>ONE THING AT A TIME</b></div><h3>Find your forward motion.</h3><p>Start an Execution Session. Work, pause, and review what happened. Learn as you go.</p></article>
      </div>
    </section>
    <section class="big-picture" data-motion>
      <div><p class="eyebrow">STRUCTURE THAT STAYS OUT OF YOUR WAY</p><h2>Plan wide.<br />Execute narrow.</h2><p>Keep the bigger outcome in view without carrying every detail into your focus session.</p></div>
      <dl class="domain-stack"><div><dt><span class="domain-symbol project-symbol" aria-hidden="true">▧</span>Project</dt><dd>The outcome you’re working toward. Hold Sprints and Chores together.</dd></div><div><dt><span class="domain-symbol sprint-symbol" aria-hidden="true">≋</span>Sprint</dt><dd>A connected group of Chores. Make a larger effort manageable.</dd></div><div><dt><span class="domain-symbol chore-symbol" aria-hidden="true">✓</span>Chore</dt><dd>The concrete next piece of work. Plan it, focus on it, and review how it went.</dd></div></dl>
    </section>
    <section class="closing"><div class="closing-orbit"><FocusOrbit compact /></div><div class="closing-copy" data-motion><p class="eyebrow">YOUR NEXT STEP IS WAITING</p><h2>A little less thinking about it.<br />A little more <em>doing it.</em></h2><p>Start with one Chore. See where the momentum takes you.</p><a href="/register" class="primary-link">Make room for focus <ArrowRightIcon size={20} aria-hidden="true" /></a></div></section>
  </main>
  <footer class="site-footer"><a href="/" aria-label="Taskiller home"><Logo class="h-6 w-auto" /></a><p>Less ceremony. More finished work.</p><a href="/login">Your workspace <span aria-hidden="true">↗</span></a></footer>
</div>

<style>
  .public-site { overflow: clip; }
  .site-header { max-width: 1360px; margin: auto; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  nav { display: flex; align-items: center; gap: 20px; font-size: 13px; font-weight: 650; } nav a { min-height: 44px; display: inline-flex; align-items: center; }
  .how-link { color: var(--muted); margin-right: 10px; }.nav-cta { background: var(--foreground); color: var(--background); padding: 0 18px; border-radius: 12px; gap: 20px; }
  .hero { max-width: 1360px; margin: auto; padding: 60px 40px 100px; display: grid; grid-template-columns: 1fr 1.05fr; align-items: center; gap: 50px; }
  .hero-copy { position: relative; z-index: 1; animation: rise .8s cubic-bezier(.16,1,.3,1) both; }
  .eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .16em; line-height: 1.7; color: var(--accent-ink); display: flex; align-items: center; gap: 9px; }
  .eyebrow > span { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
  h1, h2, h3 { font-family: var(--font-tk-display); }
  h1 { font-size: clamp(54px, 6.5vw, 91px); font-weight: 650; line-height: 1.04; letter-spacing: -.065em; margin: 26px 0; }
  .move-word { color: var(--accent-ink); position: relative; white-space: nowrap; } .move-word svg { position: absolute; width: 104%; height: 20px; left: 0; bottom: -12px; color: var(--accent); }
  .hero-description { color: var(--muted); font-size: 17px; line-height: 1.85; max-width: 39ch; margin: 30px 0; }
  .primary-link { display: inline-flex; min-height: 54px; justify-content: center; align-items: center; gap: 28px; border-radius: 14px; background: #ff8266; color: #291c19; padding: 14px 23px; font-weight: 750; font-size: 14px; box-shadow: 0 8px 0 -5px #c7573d, 0 14px 30px #ff633f20; transition: transform .25s, box-shadow .25s; }
  .primary-link:hover { transform: translateY(-3px); box-shadow: 0 10px 0 -5px #c7573d, 0 20px 32px #ff633f30; } .primary-link:active { transform: translateY(1px); } .primary-link :global(svg) { transition: transform .25s; } .primary-link:hover :global(svg) { transform: translateX(4px); }
  .returning { margin-top: 22px; color: var(--muted); font-size: 11px; } .returning a { text-decoration: underline; text-underline-offset: 4px; color: var(--foreground); font-weight: 650; }
  .flow-caption { display: flex; gap: 22px; margin-top: 48px; font-size: 11px; color: var(--muted); } .flow-caption span::before { content: '✓'; color: var(--accent-ink); margin-right: 7px; }
  .preview-scene { background: #132642; color: white; border-radius: 30px; padding: 28px; position: relative; box-shadow: 0 32px 60px -30px #13264270; animation: rise .9s .15s cubic-bezier(.16,1,.3,1) both; }
  .preview-orbit { position: absolute; width: 440px; height: 440px; right: -140px; top: -120px; opacity: .6; pointer-events: none; }
  .scene-caption { position: relative; display: flex; gap: 8px; align-items: center; font-size: 8px; letter-spacing: .13em; color: #d0dcec; margin-bottom: 26px; } .scene-number { margin-left: auto; color: #a8dfd0; }
  .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #a8dfd0; box-shadow: 0 0 0 4px #a8dfd015; animation: pulse 3s ease-in-out infinite; }
  .app-preview { position: relative; background: var(--surface); color: var(--foreground); border: 1px solid #ffffff30; border-radius: 17px; overflow: hidden; box-shadow: 0 24px 45px #08152655; }
  .app-chrome { display: flex; justify-content: space-between; align-items: center; background: var(--surface-subtle); border-bottom: 1px solid var(--border); padding: 14px 16px; font-size: 8px; letter-spacing: .1em; color: var(--muted); }
  .window-dots { display: flex; gap: 4px; }.window-dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--border-strong); } .window-dots i:first-child { background: var(--accent); }
  .demo-body { padding: 25px; display: flex; min-height: 408px; flex-direction: column; } .demo-stage { display: flex; flex-direction: column; flex: 1; } .demo-stage :global(h2) { font-size: 23px; letter-spacing: -.04em; line-height: 1.3; }
  .preview-foot { position: relative; display: flex; align-items: center; gap: 10px; margin-top: 24px; font-size: 10px; color: #c3d1e2; } .mint-check { display: grid; place-items: center; width: 22px; height: 22px; background: #a8dfd018; border-radius: 50%; color: #a8dfd0; }.tiny-orbits { margin-left: auto; color: #a8dfd0; letter-spacing: -4px; }
  .process { border-top: 1px solid var(--border); max-width: 1280px; margin: auto; padding: 88px 0; } .section-heading { display: grid; grid-template-columns: 1.2fr 1fr; column-gap: 60px; align-items: end; } .section-heading .eyebrow { grid-column: 1/-1; margin-bottom: 20px; }.section-heading h2 { font-size: clamp(32px, 3.5vw, 47px); font-weight: 650; letter-spacing: -.05em; line-height: 1.15; } .section-heading h2 span { color: var(--muted); }.section-heading > p:last-child { color: var(--muted); font-size: 14px; line-height: 1.8; }
  .process-grid { margin-top: 42px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }.process-card { padding: 26px; border: 1px solid var(--border); background: var(--surface); border-radius: 22px; transition: transform .3s, box-shadow .3s; }.process-card:hover { transform: translateY(-7px); box-shadow: 0 20px 35px -20px #13264240; } .step-heading { display: flex; justify-content: space-between; color: var(--muted); font-size: 9px; letter-spacing: .12em; font-weight: 750; } .step-heading > span:last-child { font-size: 18px; color: var(--accent-ink); }
  .process-card h3 { font-size: 19px; font-weight: 650; letter-spacing: -.035em; margin-top: 20px; }.process-card > p { font-size: 12px; line-height: 1.9; color: var(--muted); margin-top: 12px; }
  .mini-capture, .mini-plan, .mini-timer { height: 100px; margin-top: 20px; } .mini-capture { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--muted); } .mini-plus { color: var(--accent-ink); background: var(--accent-soft); border-radius: 10px; width: 32px; height: 32px; display: grid; place-items: center; font-size: 22px; }.cursor { width: 2px; height: 16px; background: var(--accent); animation: pulse 1.8s ease-in-out infinite; }
  .mini-plan { display: flex; flex-direction: column; justify-content: center; gap: 10px; }.mini-plan div { display: flex; gap: 8px; align-items: center; font-size: 10px; background: var(--surface-subtle); padding: 10px; border-radius: 8px; } .mini-plan i { width: 5px; height: 5px; background: var(--accent); border-radius: 50%; }.mini-plan div:last-child i { background: var(--success); }.mini-plan b { margin-left: auto; font-weight: 600; }
  .mini-timer { display: flex; flex-wrap: wrap; align-content: center; justify-content: center; align-items: center; gap: 10px; }.mini-timer span { font-family: var(--font-tk-display); font-size: 36px; font-weight: 600; letter-spacing: -.05em; font-variant-numeric: tabular-nums; }.mini-timer i { border: 2px solid var(--accent); width: 26px; height: 26px; border-right-color: transparent; border-radius: 50%; animation: turn 9s linear infinite; }.mini-timer b { flex-basis: 100%; text-align: center; font-size: 8px; letter-spacing: .15em; color: var(--muted); font-weight: 600; }
  .big-picture { max-width: 1280px; margin: 0 auto 88px; border-top: 1px solid var(--border); padding-top: 80px; display: grid; grid-template-columns: 1fr 1.1fr; gap: 90px; }.big-picture h2 { font-size: clamp(34px, 4vw, 54px); font-weight: 650; letter-spacing: -.05em; line-height: 1.12; margin: 22px 0; }.big-picture > div > p:last-child { color: var(--muted); font-size: 14px; line-height: 1.8; max-width: 37ch; }.domain-stack { display: grid; gap: 14px; }.domain-stack > div { background: var(--surface); border: 1px solid var(--border); padding: 22px; border-radius: 17px; display: grid; grid-template-columns: 130px 1fr; align-items: center; gap: 14px; transition: translate .25s; }.domain-stack > div:hover { translate: 5px 0; }.domain-stack dt { display: flex; gap: 12px; align-items: center; font-weight: 750; font-size: 13px; }.domain-stack dd { color: var(--muted); font-size: 11px; line-height: 1.8; }.domain-symbol { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-size: 18px; }.project-symbol { background: #bcb6f526; color: var(--blue); }.sprint-symbol { background: #a8dfd026; color: var(--success); }.chore-symbol { background: var(--accent-soft); color: var(--accent-ink); }
  .closing { max-width: 1280px; margin: 0 auto 55px; background: #132642; color: white; border-radius: 28px; position: relative; overflow: hidden; padding: 65px; }.closing-copy { position: relative; z-index: 1; }.closing .eyebrow { color: #a8dfd0; }.closing h2 { font-size: clamp(30px, 3.5vw, 46px); line-height: 1.2; letter-spacing: -.05em; font-weight: 600; margin: 22px 0; }.closing h2 em { font-style: normal; color: #ff987f; }.closing p:not(.eyebrow) { color: #c3d1e2; font-size: 13px; margin-bottom: 28px; }.closing-orbit { position: absolute; width: 460px; right: -70px; top: -50px; opacity: .65; }
  .site-footer { max-width: 1360px; margin: auto; padding: 0 40px 36px; display: flex; align-items: center; justify-content: space-between; gap: 20px; color: var(--muted); font-size: 11px; }.site-footer > a:last-child { font-weight: 650; }
  @keyframes rise { from { transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } } @keyframes pulse { 50% { opacity: .35; } } @keyframes turn { to { transform: rotate(360deg); } }
  @media(max-width: 1350px) { .process, .big-picture, .closing { margin-inline: 40px; } }
  @media(max-width: 1000px) { .hero { gap: 28px; padding-inline: 28px; } .preview-scene { padding: 18px; } .demo-body { padding: 22px; } .flow-caption { flex-direction: column; gap: 8px; }.big-picture { gap: 40px; }.process-card { padding: 20px; }.domain-stack > div { grid-template-columns: 1fr; } }
  @media(max-width: 760px) { .site-header { padding: 20px; } nav { gap: 10px; }.how-link, .nav-cta { display: none; }.hero { grid-template-columns: 1fr; padding: 36px 20px 60px; gap: 44px; }.hero-copy { max-width: 560px; } h1 { font-size: clamp(57px, 11.5vw, 82px); }.hero-description { font-size: 16px; }.flow-caption { margin-top: 26px; flex-direction: row; gap: 18px; }.preview-scene { max-width: 560px; width: 100%; margin: auto; border-radius: 24px; }.demo-body { min-height: 410px; padding: 22px; }.scene-caption { margin-bottom: 20px; }.process, .big-picture, .closing { margin-inline: 20px; }.process { padding-block: 55px; }.section-heading { grid-template-columns: 1fr; gap: 20px; }.section-heading .eyebrow { margin: 0; }.process-grid { grid-template-columns: 1fr; gap: 15px; margin-top: 30px; }.process-card { padding: 24px; }.mini-capture, .mini-plan, .mini-timer { height: 90px; }.big-picture { grid-template-columns: 1fr; gap: 28px; padding-top: 50px; margin-bottom: 55px; }.domain-stack > div { grid-template-columns: 110px 1fr; gap: 12px; padding: 18px; }.closing { padding: 38px 26px; margin-bottom: 32px; }.closing-orbit { opacity: .22; right: -210px; }.site-footer { flex-wrap: wrap; padding: 0 20px 28px; gap: 18px; }.site-footer p { order: 3; width: 100%; } }
  @media(prefers-reduced-motion: reduce) { .public-site *, .primary-link :global(svg) { animation: none !important; transition: none !important; } }
</style>
