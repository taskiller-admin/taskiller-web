<script lang="ts">
  let { size = 20 }: { size?: number } = $props();
</script>

<span class="tk-spinner" style:width={`${size}px`} style:height={`${size}px`} aria-hidden="true"></span>
