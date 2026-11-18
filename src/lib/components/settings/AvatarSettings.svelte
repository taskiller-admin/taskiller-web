<script lang="ts">
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import { defaultPreference, palettes, variants, type AvatarPreference } from '$lib/avatar/generator';
  import { avatarPreferences, saveAvatar } from '$lib/avatar/store';

  let { seed }: { seed: string } = $props();
  const preference = $derived($avatarPreferences[seed]?.preference ?? defaultPreference(seed));
  const saved = $derived($avatarPreferences[seed]?.saved !== false);

  function choose(change: Partial<AvatarPreference>) {
    saveAvatar(seed, { ...preference, ...change });
  }
</script>

<div class="avatar-settings mt-6 flex flex-wrap items-center gap-5 rounded-[17px] bg-[var(--surface-raised)] p-4 sm:p-5">
  <div class="preview rounded-[28%] shadow-sm">
    <Avatar {seed} size={96} />
  </div>
  <div class="min-w-0 flex-1 space-y-3">
    <div>
      <h3 class="text-sm font-bold">Your generated avatar</h3>
      <p class="mt-1 text-xs leading-5 text-[var(--muted)]">A little geometry, uniquely yours. Choose a color and shape, or shuffle for a new look.</p>
    </div>
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Avatar palette">
      {#each palettes as palette, index}
        <button
          type="button"
          class="palette-choice inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)]"
          class:selected={preference.palette === index}
          aria-label={`Palette: ${palette.name}`}
          aria-pressed={preference.palette === index}
          onclick={() => choose({ palette: index })}
        >
          <span class="flex overflow-hidden rounded-full" aria-hidden="true"><span class="size-3" style:background={palette.ink}></span><span class="size-3" style:background={palette.accent}></span></span>
          {palette.name}
        </button>
      {/each}
    </div>
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Avatar style">
      {#each variants as variant, index}
        <button
          type="button"
          class="style-choice min-h-11 rounded-xl border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)]"
          class:selected={preference.variant === index}
          aria-label={`Style: ${variant}`}
          aria-pressed={preference.variant === index}
          onclick={() => choose({ variant: index })}
        >{variant}</button>
      {/each}
      <Button variant="secondary" size="sm" aria-label="Regenerate avatar" onclick={() => choose({ revision: preference.revision < Number.MAX_SAFE_INTEGER ? preference.revision + 1 : 0 })}>
        <ArrowsClockwiseIcon size={16} aria-hidden="true" /> Regenerate
      </Button>
    </div>
    <p role="status" class="text-xs leading-5 text-[var(--muted)]">
      <span>{saved ? 'Saved on this device' : 'Storage unavailable. This choice lasts until you reload.'}</span>
      <span class="block">Your default follows your account. Custom choices stay in this browser.</span>
    </p>
  </div>
</div>

<style>
  .palette-choice, .style-choice {
    border-color: var(--border);
    background: var(--surface);
    transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
  }
  .selected { border-color: var(--action); background: var(--surface-subtle); }
  .palette-choice:hover, .style-choice:hover { transform: translateY(-2px); border-color: var(--action); }
  .palette-choice:active, .style-choice:active { transform: scale(.95); }
  .preview { animation: reveal 420ms cubic-bezier(.2,.7,.3,1) both; }
  @keyframes reveal { from { opacity: 0; transform: translateY(8px) scale(.92); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .palette-choice, .style-choice { transition: none; }
    .palette-choice:hover, .style-choice:hover, .palette-choice:active, .style-choice:active { transform: none; }
    .preview { animation: none; }
  }
</style>
