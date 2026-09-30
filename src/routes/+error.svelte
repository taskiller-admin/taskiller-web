<script lang="ts">
  import { page } from '$app/state';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  const notFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{notFound ? 'Page not found' : 'Something went wrong'} — Taskiller</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6 py-16">
  <section class="w-full max-w-xl rounded-[26px] border border-[var(--border)] bg-white/82 p-7 shadow-[0_26px_70px_rgb(23_23_23/0.08)] sm:p-10">
    <Logo class="h-7 w-auto" />
    <div class="mt-14 grid size-12 place-items-center rounded-[14px] bg-[#f0efea] text-tk-strike">
      <WarningCircleIcon size={24} weight="fill" />
    </div>
    <p class="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite">
      {notFound ? '404' : `Error ${page.status}`}
    </p>
    <h1 class="tk-display mt-2 text-4xl font-extrabold sm:text-5xl">
      {notFound ? 'That page is not here.' : 'Taskiller hit an unexpected edge.'}
    </h1>
    <p class="mt-4 max-w-lg text-sm leading-7 text-tk-graphite">
      {#if notFound}
        The link may be stale, mistyped, or point to something that moved.
      {:else}
        Your server-backed work has not been cleared. Return to Taskiller and retry the action.
      {/if}
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <a href="/today"><Button>Go to Today</Button></a>
      <button class="inline-flex h-11 items-center gap-2 rounded-[13px] px-4 text-sm font-semibold text-tk-graphite hover:bg-black/[0.05]" onclick={() => history.back()}>
        <ArrowLeftIcon size={16} /> Go back
      </button>
    </div>
  </section>
</main>
