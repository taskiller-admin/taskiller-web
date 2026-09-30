<script lang="ts">
  import { page } from '$app/state';
  import ClockCountdownIcon from 'phosphor-svelte/lib/ClockCountdownIcon';
  import Logo from '$lib/components/brand/Logo.svelte';

  const executeAfter = $derived(page.url.searchParams.get('executeAfter'));
  const requestedAt = $derived(page.url.searchParams.get('requestedAt'));

  function formatDate(value: string | null) {
    if (!value) return 'the configured grace period';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));
  }
</script>

<svelte:head><title>Account deletion scheduled — Taskiller</title></svelte:head>
<div class="grid min-h-screen place-items-center px-5 py-12">
  <div class="w-full max-w-lg">
    <Logo class="h-7 w-auto" />
    <div class="mt-10 rounded-[26px] bg-tk-ink p-7 text-white sm:p-8">
      <div class="grid size-12 place-items-center rounded-[15px] bg-white/10 text-tk-strike"><ClockCountdownIcon size={23} /></div>
      <p class="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Account lifecycle</p>
      <h1 class="tk-display mt-2 text-3xl font-extrabold sm:text-4xl">Deletion is scheduled.</h1>
      <p class="mt-4 text-sm leading-6 text-white/58">Your Taskiller account was deactivated and active device sessions were revoked when the request was accepted.</p>
      <div class="mt-6 rounded-[17px] bg-white/[0.06] p-4">
        <p class="text-xs text-white/40">Requested</p>
        <p class="mt-1 font-semibold">{formatDate(requestedAt)}</p>
        <p class="mt-4 text-xs text-white/40">Permanent deletion scheduled after</p>
        <p class="mt-1 font-semibold text-tk-strike">{formatDate(executeAfter)}</p>
      </div>
      <p class="mt-6 text-xs leading-5 text-white/38">The current backend does not expose a cancellation endpoint. If this was unexpected, contact the service operator before the scheduled execution time.</p>
      <a class="mt-6 inline-flex text-sm font-bold text-white/70 hover:text-white" href="/">Return to Taskiller home →</a>
    </div>
  </div>
</div>
