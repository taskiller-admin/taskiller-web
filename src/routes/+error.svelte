<script lang="ts">
  import { page } from '$app/state';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import AuthFrame from '$lib/components/brand/AuthFrame.svelte';

  const notFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{notFound ? 'Page not found' : 'Something went wrong'} — Taskiller</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AuthFrame headline="Let’s find your way back." eyebrow="A SMALL DETOUR">
  <section class="auth-card">
    <div class="mt-14 grid size-12 place-items-center rounded-[14px] bg-[var(--surface-subtle)] text-tk-strike">
      <WarningCircleIcon size={24} weight="fill" aria-hidden="true" />
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
        Your saved work is still there. Return to Taskiller and try again.
      {/if}
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <a href="/today" class="inline-flex min-h-11 items-center rounded-[13px] bg-[var(--action)] px-5 text-sm font-semibold text-[var(--action-foreground)]">Go to Today</a>
      <button class="inline-flex h-11 items-center gap-2 rounded-[13px] px-4 text-sm font-semibold text-tk-graphite hover:bg-[var(--surface-subtle)]" onclick={() => history.back()}>
        <ArrowLeftIcon size={16} aria-hidden="true" /> Go back
      </button>
    </div>
  </section>
</AuthFrame>
