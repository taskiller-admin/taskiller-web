<script lang="ts">
  import type { components } from '$lib/api/generated/schema';
  import Badge from '$lib/components/ui/Badge.svelte';

  let { reasons, provenance }: {
    reasons: components['schemas']['RecommendationReason'][];
    provenance: components['schemas']['RecommendationProvenance'];
  } = $props();

  const provenanceLabel = $derived(
    provenance === 'history_informed'
      ? 'Shaped by your history'
      : provenance === 'preference_informed'
        ? 'Shaped by your preferences'
        : 'Bootstrap recommendation'
  );

  function labelName(label: components['schemas']['RecommendationReasonLabel']) {
    return label.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
</script>

<section class="rounded-[20px] border border-[var(--border)] bg-white/76 p-5 sm:p-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Why this plan</p>
      <h2 class="mt-1 text-lg font-bold">{provenanceLabel}</h2>
    </div>
    <Badge>{provenance.replaceAll('_', ' ')}</Badge>
  </div>

  <div class="mt-5 space-y-3">
    {#each reasons as reason}
      <div class="rounded-[15px] bg-[#f1f1ed] px-4 py-3.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-tk-ink">{labelName(reason.label)}</span>
          <span class="tk-mono text-[10px] text-tk-graphite">{reason.code}</span>
        </div>
        <p class="mt-1.5 text-sm leading-6 text-tk-graphite">{reason.message}</p>
      </div>
    {/each}
  </div>
</section>
