<script lang="ts">
  import { setTheme, themeMode, type ThemeMode } from '$lib/theme/theme';

  const choices: { value: ThemeMode; label: string; description: string }[] = [
    { value: 'system', label: 'System', description: 'Follow this device.' },
    { value: 'light', label: 'Light', description: 'Bright workspace.' },
    { value: 'dark', label: 'Dark', description: 'Low-glare workspace.' }
  ];
</script>

<section id="appearance" class="scroll-mt-28 rounded-[14px] tk-panel p-5 sm:p-6">
  <div>
    <p class="text-sm font-semibold text-[var(--muted)]">Appearance</p>
    <h2 class="tk-display mt-1 text-2xl font-bold">Appearance</h2>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
      The preference stays on this device. System mode follows the OS automatically.
    </p>
  </div>

  <div class="mt-6 grid gap-3 sm:grid-cols-3">
    {#each choices as choice}
      <button
        type="button"
        aria-pressed={$themeMode === choice.value}
        class="group rounded-[16px] border p-3 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 { $themeMode === choice.value ? 'border-tk-strike bg-tk-strike/8' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]' }"
        onclick={() => setTheme(choice.value)}
      >
        <span aria-hidden="true" class="theme-preview block overflow-hidden rounded-[11px] border border-[var(--border)] p-2" data-preview={choice.value}>
          <span class="preview-canvas flex h-16 gap-1.5 rounded-[8px] p-2">
            <span class="w-4 rounded-[5px] bg-[#171a1f]"></span>
            <span class="flex-1 space-y-1.5">
              <span class="preview-line block h-2 w-3/4 rounded-full"></span>
              <span class="preview-panel block h-5 rounded-[5px]"></span>
              <span class="block h-5 rounded-[5px] bg-[#ff633f]"></span>
            </span>
          </span>
        </span>
        <span class="mt-3 block font-bold">{choice.label}</span>
        <span class="mt-1 block text-xs text-[var(--muted)]">{choice.description}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .theme-preview { background: #e6e8eb; --preview-canvas: #ffffff; --preview-panel: #eceef1; --preview-line: #68717f; }
  .theme-preview[data-preview='dark'] { background: #11151c; --preview-canvas: #202630; --preview-panel: #343e4c; --preview-line: #b5bec9; }
  .theme-preview[data-preview='system'] { background: linear-gradient(90deg, #e6e8eb 50%, #11151c 50%); --preview-canvas: linear-gradient(90deg, #ffffff 50%, #202630 50%); --preview-panel: linear-gradient(90deg, #eceef1 50%, #343e4c 50%); --preview-line: #8893a2; }
  .preview-canvas { background: var(--preview-canvas); }
  .preview-panel { background: var(--preview-panel); }
  .preview-line { background: var(--preview-line); }
</style>
