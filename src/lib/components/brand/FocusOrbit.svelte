<script lang="ts">
  import { cn } from '$lib/utils';
  let { animated = true, compact = false, decorative = true, label = 'Concentric focus orbits', class: className = '' }: { animated?: boolean; compact?: boolean; decorative?: boolean; label?: string; class?: string } = $props();
</script>

<div class={cn('focus-orbit relative mx-auto aspect-square w-full max-w-[510px]', className)} class:animated class:compact aria-hidden={decorative ? true : undefined} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label}>
  <div class="halo"></div>
  <svg viewBox="0 0 480 480" fill="none">
    <circle cx="240" cy="240" r="218" stroke="white" stroke-opacity=".09" />
    <circle cx="240" cy="240" r="170" stroke="white" stroke-opacity=".14" />
    <circle cx="240" cy="240" r="116" stroke="white" stroke-opacity=".2" />
    <g class="outer-track"><circle cx="240" cy="240" r="218" stroke="#bcb6f5" stroke-opacity=".7" stroke-dasharray="90 1280" stroke-linecap="round" stroke-width="3" /><circle cx="240" cy="22" r="7" fill="#bcb6f5" /></g>
    <g class="middle-track"><circle cx="240" cy="240" r="170" stroke="#a8dfd0" stroke-dasharray="160 910" stroke-linecap="round" stroke-width="2" /><circle cx="410" cy="240" r="9" fill="#a8dfd0" /></g>
    <g class="inner-track"><circle cx="240" cy="240" r="116" stroke="#ff8266" stroke-dasharray="190 540" stroke-linecap="round" stroke-width="3" /><circle cx="240" cy="124" r="6" fill="#ff8266" /></g>
    <circle class="core" cx="240" cy="240" r="67" fill="#ff8266" fill-opacity=".08" stroke="#ff8266" stroke-opacity=".25" />
    <path d="m212 242 18 18 39-43" stroke="#ff987f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="56" cy="354" r="3" fill="#a8dfd0" /><circle cx="405" cy="83" r="3" fill="#bcb6f5" />
  </svg>
  <span class="orbit-note note-one">A little structure.</span><span class="orbit-note note-two">Room to focus.</span>
</div>

<style>
  svg { position: relative; width: 100%; height: 100%; overflow: visible; }
  .halo { position: absolute; inset: 14%; border-radius: 50%; background: radial-gradient(circle, #ff826612, #a8dfd005 55%, transparent 72%); }
  .outer-track, .middle-track, .inner-track { transform-origin: 240px 240px; }
  .animated .outer-track { animation: orbit 65s linear infinite; }
  .animated .middle-track { animation: orbit 42s linear infinite reverse; }
  .animated .inner-track { animation: orbit 28s linear infinite; }
  .animated .core, .animated .halo { animation: breathe 6s ease-in-out infinite alternate; transform-origin: center; }
  .orbit-note { position: absolute; padding: 10px 15px; border: 1px solid #ffffff20; border-radius: 12px; background: #1b3350; color: #e9f1fa; font-size: 12px; box-shadow: 0 12px 28px #08142540; }
  .note-one { top: 21%; left: 0; transform: rotate(-6deg); }
  .note-two { bottom: 20%; right: 0; transform: rotate(5deg); }
  .animated .note-one { animation: float 7s ease-in-out infinite alternate; }
  .animated .note-two { animation: float 9s ease-in-out infinite alternate-reverse; }
  .compact .orbit-note { display: none; }
  @keyframes orbit { to { transform: rotate(360deg); } }
  @keyframes breathe { to { opacity: .65; transform: scale(.94); } }
  @keyframes float { to { translate: 0 -9px; } }
  @media (prefers-reduced-motion: reduce) { .focus-orbit * { animation: none !important; } }
</style>
