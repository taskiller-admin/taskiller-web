<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import type { SessionReview, SessionReviewInput } from '$lib/api/execution';

  let {
    review = null,
    busy = false,
    onsave
  }: {
    review?: SessionReview | null;
    busy?: boolean;
    onsave: (input: SessionReviewInput) => Promise<void> | void;
  } = $props();

  let focusScore = $state<number | null>(null);
  let fatigueScore = $state<number | null>(null);
  let difficultyScore = $state<number | null>(null);
  let satisfactionScore = $state<number | null>(null);
  let note = $state('');

  $effect(() => {
    focusScore = review?.focusScore ?? null;
    fatigueScore = review?.fatigueScore ?? null;
    difficultyScore = review?.difficultyScore ?? null;
    satisfactionScore = review?.satisfactionScore ?? null;
    note = review?.note ?? '';
  });

  const rows = [
    { label: 'Focus', key: 'focus' },
    { label: 'Fatigue', key: 'fatigue' },
    { label: 'Difficulty', key: 'difficulty' },
    { label: 'Satisfaction', key: 'satisfaction' }
  ] as const;

  function current(key: (typeof rows)[number]['key']) {
    if (key === 'focus') return focusScore;
    if (key === 'fatigue') return fatigueScore;
    if (key === 'difficulty') return difficultyScore;
    return satisfactionScore;
  }

  function setScore(key: (typeof rows)[number]['key'], score: number) {
    const next = current(key) === score ? null : score;
    if (key === 'focus') focusScore = next;
    else if (key === 'fatigue') fatigueScore = next;
    else if (key === 'difficulty') difficultyScore = next;
    else satisfactionScore = next;
  }

  async function submit() {
    await onsave({
      focusScore,
      fatigueScore,
      difficultyScore,
      satisfactionScore,
      note: note.trim() || null
    });
  }
</script>

<section class="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 sm:p-6">
  <div class="max-w-xl">
    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">Session review</p>
    <h2 class="tk-display mt-2 text-2xl font-bold">Capture the signal while it’s fresh.</h2>
    <p class="mt-2 text-sm leading-6 text-white/48">Optional. These scores help Taskiller personalize future focus recommendations.</p>
  </div>

  <div class="mt-6 grid gap-4 sm:grid-cols-2">
    {#each rows as row}
      <div class="rounded-[16px] bg-white/[0.045] p-4">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm font-semibold text-white/75">{row.label}</span>
          <span class="text-[11px] text-white/30">1–5</span>
        </div>
        <div class="mt-3 grid grid-cols-5 gap-1.5">
          {#each [1, 2, 3, 4, 5] as score}
            <button
              type="button"
              onclick={() => setScore(row.key, score)}
              class="tk-mono h-9 rounded-[10px] border text-xs font-bold transition {current(row.key) === score ? 'border-tk-strike bg-tk-strike text-[#1a1512]' : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.09]'}"
              aria-pressed={current(row.key) === score}
            >{score}</button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <label class="mt-5 block text-xs font-bold text-white/55">
    Note
    <Textarea class="mt-2 min-h-28 border-white/10 bg-white/[0.06] text-white placeholder:text-white/28" bind:value={note} placeholder="What helped? What got in the way?" maxlength="4000" />
  </label>

  <div class="mt-5 flex items-center gap-3">
    <Button variant="dark" disabled={busy} onclick={submit}>{review ? 'Update review' : 'Save review'}</Button>
    {#if review}<span class="text-xs text-white/35">Saved · v{review.version}</span>{/if}
  </div>
</section>
