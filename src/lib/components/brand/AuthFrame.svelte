<script lang="ts">
  import MotionToggle from '$lib/components/theme/MotionToggle.svelte';
  import type { Snippet } from 'svelte';
  import Logo from './Logo.svelte';
  import FocusOrbit from './FocusOrbit.svelte';
  import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
  let { children, eyebrow = 'MAKE ROOM FOR WHAT MATTERS', headline = 'A clear next step. A little more momentum.', description = 'Capture what’s on your mind. Shape a Focus Plan. Give one Chore your full attention.' }: { children: Snippet; eyebrow?: string; headline?: string; description?: string } = $props();
</script>

<div class="auth-frame">
  <aside class="showcase">
    <a href="/" aria-label="Taskiller home" class="brand"><Logo inverse class="h-7 w-auto" /></a>
    <div class="showcase-content"><p class="eyebrow">{eyebrow}</p><h2>{headline}</h2><div class="illustration"><FocusOrbit /></div><p class="description">{description}</p></div>
    <div class="showcase-foot"><span>Less ceremony. More finished work.</span><span class="signal"><i></i> Find your focus</span></div>
  </aside>
  <main class="form-side">
    <header><a href="/" aria-label="Taskiller home" class="mobile-brand"><Logo class="h-6 w-auto" /></a><a class="back-home" href="/">← Back to home</a><div class="flex items-center gap-1"><MotionToggle /><ThemeToggle compact /></div></header>
    <div class="form-content">{@render children()}</div>
    <footer>Capture. Plan. Focus. Make it happen.</footer>
  </main>
</div>

<style>
  .auth-frame { display: grid; min-height: 100dvh; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); background: var(--background); }
  .showcase { background: #132642; color: white; padding: clamp(28px, 4vw, 64px); display: flex; flex-direction: column; position: relative; overflow: hidden; }
  .showcase::before { content: ''; position: absolute; width: 420px; height: 420px; border-radius: 50%; background: #284b711f; top: -250px; right: -130px; }
  .brand { position: relative; align-self: flex-start; }
  .showcase-content { margin: auto 0; padding-top: 56px; }
  .eyebrow { font-size: 10px; letter-spacing: .2em; font-weight: 700; color: #a8dfd0; }
  h2 { font-family: var(--font-tk-display); font-size: clamp(32px, 3.7vw, 57px); line-height: 1.12; letter-spacing: -.05em; max-width: 12ch; margin-top: 20px; font-weight: 650; }
  .illustration { max-width: 360px; margin: -15px auto -12px; }
  .description { color: #bfcde0; font-size: 14px; line-height: 1.8; max-width: 40ch; padding-bottom: 30px; }
  .showcase-foot { border-top: 1px solid #ffffff1a; padding-top: 24px; display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; color: #bfcde0; font-size: 10px; }
  .signal { display: inline-flex; gap: 7px; align-items: center; } i { width: 6px; height: 6px; background: #a8dfd0; border-radius: 50%; }
  .form-side { display: flex; flex-direction: column; min-width: 0; padding: 28px clamp(24px, 5vw, 80px); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .back-home { color: var(--muted); font-size: 12px; font-weight: 600; }
  .mobile-brand { display: none; }
  .form-content { width: 100%; max-width: 460px; margin: auto; padding: 48px 0; animation: arrive .65s cubic-bezier(.16,1,.3,1) both; }
  .form-content :global(form.w-full), .form-content > :global(.auth-card) { border: 0; padding: 0; background: transparent; box-shadow: none; backdrop-filter: none; border-radius: 0; }
  .form-content :global(h1) { font-family: var(--font-tk-display); letter-spacing: -.045em; line-height: 1.15; }
  .form-content :global(input) { transition: border-color .2s, box-shadow .2s, background .2s; }
  .form-content :global(input:focus) { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent); }
  .form-content :global(a) { text-underline-offset: 4px; }
  .form-content :global([role='alert']) { padding: 12px 14px; border-radius: 12px; background: var(--danger-bg); border: 1px solid var(--danger-border); animation: arrive .25s ease-out both; }
  .form-content :global([role='status']) { animation: arrive .35s ease-out both; }
  footer { color: var(--muted); font-size: 11px; text-align: center; padding: 12px 0; }
  @keyframes arrive { from { transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @media(min-width: 1500px) { .illustration { max-width: 420px; } }
  @media(max-width: 900px) { .auth-frame { grid-template-columns: 1fr; } .showcase { display: none; } .mobile-brand { display: inline-flex; } .back-home { display: none; } .form-side { min-height: 100dvh; padding: 20px 24px; } .form-content { max-width: 440px; padding: 42px 0; } }
  @media(prefers-reduced-motion: reduce) { .form-content, .form-content :global(*) { animation: none !important; transition: none !important; } }
</style>
