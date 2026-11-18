<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
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
  <div class="fixed inset-x-3 bottom-24 z-[70] mx-auto flex max-w-xl items-center justify-between gap-4 tk-motion-enter rounded-[20px] border border-[#3b5677] bg-[#152b49] px-4 py-3 text-sm text-white shadow-2xl lg:bottom-5" role="status">
    <span><strong>Taskiller updated.</strong> Reload when you’re ready.</span>
    <Button variant="dark" size="sm" loading={applying} disabled={applying} onclick={applyUpdate}>{applying ? 'Updating…' : 'Reload'}</Button>
  </div>
{/if}
