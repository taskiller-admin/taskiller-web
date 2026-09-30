<script lang="ts">
  import { setTheme, themeMode, type ThemeMode } from '$lib/theme/theme';

  const choices: { value: ThemeMode; label: string; description: string }[] = [
    { value: 'system', label: 'System', description: 'Follow this device.' },
    { value: 'light', label: 'Light', description: 'Bright workspace.' },
    { value: 'dark', label: 'Dark', description: 'Low-glare workspace.' }
  ];
</script>

<section id="appearance" class="scroll-mt-28 rounded-[22px] tk-panel p-5 sm:p-6">
  <div>
    <p class="text-sm font-semibold text-tk-graphite">Appearance</p>
    <h2 class="tk-display mt-1 text-2xl font-bold">Choose how the workspace feels.</h2>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-tk-graphite">
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
        <span class="block overflow-hidden rounded-[11px] border border-[var(--border)] bg-[#eef2f4] p-2">
          <span class="flex h-16 gap-1.5 rounded-[8px] bg-white p-2">
            <span class="w-4 rounded-[5px] bg-[#171a1f]"></span>
            <span class="flex-1 space-y-1.5">
              <span class="block h-2 w-3/4 rounded-full bg-[#cbd3d7]"></span>
              <span class="block h-5 rounded-[5px] bg-[#edf1f2]"></span>
              <span class="block h-5 rounded-[5px] bg-[#ff633f]"></span>
            </span>
          </span>
        </span>
        <span class="mt-3 block font-bold">{choice.label}</span>
        <span class="mt-1 block text-xs text-tk-graphite">{choice.description}</span>
      </button>
    {/each}
  </div>
</section>
