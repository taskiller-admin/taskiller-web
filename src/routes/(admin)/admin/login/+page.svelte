<script lang="ts">
  import StaffAccess from '$lib/components/admin/StaffAccess.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<svelte:head><title>Staff sign in · Taskiller</title></svelte:head>
<StaffAccess enabled={data.enabled} />
