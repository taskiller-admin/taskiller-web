<script lang="ts">
  import { page } from '$app/state';
</script>
<section class="tk-panel p-6">
  <h1 class="tk-display text-2xl">{page.status === 403 ? 'Access denied' : page.status === 404 ? 'Page unavailable' : 'Administration unavailable'}</h1>
  <p class="mt-3 text-[var(--muted)]">{page.error?.message}</p>
  <a href="/admin" class="mt-5 inline-block font-bold text-[var(--accent-ink)] underline">Return to administration</a>
</section>
