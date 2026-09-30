<script lang="ts">
  import { updated } from '$app/state';
  let applying = $state(false);

  async function applyUpdate() {
    applying = true;
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.waiting) {
      const reload = () => window.location.reload();
      navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.setTimeout(reload, 1500);
    } else {
      window.location.reload();
    }
  }
</script>

{#if updated.current}
  <div class="fixed inset-x-3 bottom-24 z-[70] mx-auto flex max-w-xl items-center justify-between gap-4 rounded-[16px] border border-black/10 bg-tk-ink px-4 py-3 text-sm text-white shadow-2xl lg:bottom-5" role="status">
    <span><strong>Taskiller updated.</strong> Reload when you’re ready.</span>
    <button class="shrink-0 rounded-[10px] bg-white px-3 py-1.5 text-xs font-bold text-tk-ink" disabled={applying} onclick={applyUpdate}>{applying ? 'Updating…' : 'Reload'}</button>
  </div>
{/if}
