<script lang="ts">
  import type { PageData } from './$types';
  import Dashboard from '$lib/components/admin/Dashboard.svelte';
  import { page } from '$app/state';
  import { navItems } from '$lib/api/admin/contract';
  let { data }: { data: PageData } = $props();
  let viewKey = $derived(data.section + ':' + data.id + ':' + page.url.search);
</script>

<svelte:head><title>{navItems.find(item => item.path === data.section)?.label ?? 'Administration'} · Taskiller</title></svelte:head>
{#key viewKey}
  <Dashboard {data} />
{/key}
