<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { cn } from '$lib/utils';
  import { defaultPreference, generateAvatar } from '$lib/avatar/generator';
  import { avatarPreferences, observeAvatar } from '$lib/avatar/store';

  interface Props {
    seed: string;
    size?: number;
    class?: string;
    decorative?: boolean;
  }

  let { seed, size = 40, class: className, decorative = true }: Props = $props();
  let reducedMotion = $state(true);
  const preference = $derived($avatarPreferences[seed]?.preference ?? defaultPreference(seed));
  const glyph = $derived(generateAvatar(seed, preference));

  $effect(() => observeAvatar(seed));
  onMount(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotion = media.matches; };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  });
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 80 80"
  class={cn('avatar shrink-0 overflow-hidden rounded-[28%]', className)}
  role={decorative ? undefined : 'img'}
  aria-hidden={decorative ? 'true' : undefined}
  aria-label={decorative ? undefined : 'Generated geometric avatar'}
  data-avatar={glyph.signature}
>
  <rect class="backdrop" width="80" height="80" rx="22" fill={glyph.palette.background} />
  {#key glyph.signature}
    <g transition:fade={{ duration: reducedMotion ? 0 : 220 }}>
      <g transform={`rotate(${glyph.rotation} 40 40)`}>
        <g class:orbit={glyph.variant === 0} class:breathe={glyph.variant !== 0}>
          {#if glyph.variant === 0}
            <ellipse cx="40" cy="40" rx="27" ry="18" fill="none" stroke={glyph.palette.soft} stroke-width="7" />
            <rect x="29" y="29" width="22" height="22" rx="8" fill={glyph.palette.ink} />
            <circle cx={40 + glyph.offset} cy="16" r="8" fill={glyph.palette.accent} />
            <circle cx="16" cy="47" r="4" fill={glyph.palette.ink} />
          {:else if glyph.variant === 1}
            <rect x="16" y="16" width="23" height="23" rx="9" fill={glyph.palette.ink} />
            <rect x="43" y="16" width="21" height="23" rx="10.5" fill={glyph.palette.accent} />
            <rect x="16" y="43" width="23" height="21" rx="10.5" fill={glyph.palette.soft} />
            <path d="M43 43H55Q64 43 64 52V64H52Q43 64 43 55Z" fill={glyph.palette.ink} />
            <circle cx={47 + glyph.offset / 2} cy="53" r="4" fill={glyph.palette.background} />
          {:else}
            <path d="M18 44A22 22 0 0 1 62 44" fill="none" stroke={glyph.palette.ink} stroke-width="12" stroke-linecap="round" />
            <rect x="22" y="49" width="36" height="12" rx="6" fill={glyph.palette.soft} />
            <circle cx={32 + glyph.offset} cy="39" r="9" fill={glyph.palette.accent} />
          {/if}
        </g>
      </g>
    </g>
  {/key}
</svg>

<style>
  .avatar { transition: filter 180ms ease, scale 180ms ease; }
  .avatar:hover { filter: saturate(1.12); scale: 1.035; }
  .backdrop { transition: fill 220ms ease; }
  .orbit { transform-origin: 40px 40px; animation: orbit 48s linear infinite; }
  .breathe { transform-origin: 40px 40px; animation: breathe 7s ease-in-out infinite; }
  @keyframes orbit { to { transform: rotate(360deg); } }
  @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.045); } }
  @media (prefers-reduced-motion: reduce) {
    .avatar, .backdrop { transition: none; }
    .avatar:hover { scale: none; }
    .orbit, .breathe { animation: none; }
  }
</style>
