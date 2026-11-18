<script lang="ts">
  import { onMount } from 'svelte';
  import PauseIcon from 'phosphor-svelte/lib/PauseIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  let paused = $state(false);
  function sync() { paused = document.documentElement.dataset.motion === 'paused'; }
  onMount(() => {
    try { document.documentElement.dataset.motion = localStorage.getItem('taskiller-motion') === 'paused' ? 'paused' : 'active'; } catch { /* Device preferences are optional. */ }
    sync();
    window.addEventListener('taskiller:motion', sync);
    return () => window.removeEventListener('taskiller:motion', sync);
  });
  function toggle() {
    document.documentElement.dataset.motion = paused ? 'active' : 'paused';
    try { localStorage.setItem('taskiller-motion', paused ? 'active' : 'paused'); } catch { /* Apply for this visit. */ }
    window.dispatchEvent(new Event('taskiller:motion'));
  }
</script>

<button type="button" class="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)]" aria-label={paused ? 'Resume animations' : 'Pause animations'} aria-pressed={paused} title={paused ? 'Resume animations' : 'Pause animations'} onclick={toggle}>
  {#if paused}<PlayIcon size={17} aria-hidden="true" />{:else}<PauseIcon size={17} aria-hidden="true" />{/if}
</button>
