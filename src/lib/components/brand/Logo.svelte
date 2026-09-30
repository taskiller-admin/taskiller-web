<script lang="ts">
  let { inverse = false, class: className = '' }: { inverse?: boolean; class?: string } = $props();
</script>
<img
  src={inverse ? '/brand/taskiller-logo-reverse.svg' : '/brand/taskiller-logo-primary.svg'}
  alt="Taskiller"
  class={className}
/>
