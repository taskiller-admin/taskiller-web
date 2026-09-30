<script lang="ts">
  import { page } from '$app/state';
</script>
<svelte:head><title>Work item — Taskiller</title></svelte:head>
<div class="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-14 lg:py-16"><a href="/today" class="text-sm font-semibold text-tk-graphite">← Today</a><h1 class="tk-display mt-7 text-4xl font-black">Work item</h1><p class="mt-3 text-tk-graphite">Detail route wired for <span class="tk-mono text-xs">{page.params.id}</span>. Full edit + Plan & Start comes in Round 2/3.</p></div>
