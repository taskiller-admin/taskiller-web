<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import type { WorkItemStatus } from '$lib/api/work';
  import { statusLabel } from '$lib/utils';

  let { status }: { status: WorkItemStatus } = $props();
  const tone = $derived(
    status === 'in_progress'
      ? 'accent'
      : status === 'ready'
        ? 'blue'
        : status === 'completed'
          ? 'green'
          : status === 'cancelled'
            ? 'danger'
            : 'neutral'
  );
</script>

<Badge {tone}>{statusLabel(status)}</Badge>
