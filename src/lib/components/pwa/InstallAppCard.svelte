<script lang="ts">
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import { installState, promptInstall } from '$lib/pwa/install';
</script>

<section id="app" class="scroll-mt-24 rounded-[22px] border border-[var(--border)] bg-white/78 p-5 sm:p-6">
  <div class="flex items-start gap-3">
    <div class="grid size-10 place-items-center rounded-[13px] bg-tk-strike/10 text-[#b84429]"><DeviceMobileIcon size={21} /></div>
    <div class="min-w-0 flex-1">
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">App</p>
      <h2 class="mt-1 text-xl font-bold">Install Taskiller</h2>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-tk-graphite">Install the web app for a standalone window and offline access to the application shell. Task data itself still requires the API; Taskiller does not cache authenticated API responses on the device.</p>
    </div>
  </div>
  <div class="mt-5 flex flex-wrap items-center gap-3">
    {#if $installState.installed}
      <span class="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Installed</span>
    {:else if $installState.available}
      <Button onclick={promptInstall}><DownloadSimpleIcon size={17} weight="bold" /> Install app</Button>
    {:else}
      <span class="text-sm text-tk-graphite">Use your browser’s “Install app” or “Add to Home Screen” action when available.</span>
    {/if}
  </div>
</section>
