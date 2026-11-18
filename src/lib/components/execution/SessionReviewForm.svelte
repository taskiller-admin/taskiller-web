<script lang="ts">
  import { untrack } from 'svelte';
  import { protectUnsaved } from '$lib/actions/unsaved';
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

  let baseline = $state('');
  let loadedVersion = $state<string | null>(null);
  const draft = $derived(JSON.stringify([focusScore, fatigueScore, difficultyScore, satisfactionScore, note]));
  const dirty = $derived(baseline !== '' && draft !== baseline);
  protectUnsaved(() => dirty);

  let remoteChanged = $state(false);

  function reviewSnapshot(value: SessionReviewInput | null, normalize = false) {
    const text = value?.note ?? '';
    return JSON.stringify([
      value?.focusScore ?? null,
      value?.fatigueScore ?? null,
      value?.difficultyScore ?? null,
      value?.satisfactionScore ?? null,
      normalize ? text.trim() : text
    ]);
  }

  function useSavedReview(saved: SessionReview | null) {
    focusScore = saved?.focusScore ?? null;
    fatigueScore = saved?.fatigueScore ?? null;
    difficultyScore = saved?.difficultyScore ?? null;
    satisfactionScore = saved?.satisfactionScore ?? null;
    note = saved?.note ?? '';
    baseline = reviewSnapshot(saved);
    remoteChanged = false;
  }

  $effect(() => {
    const saved = review;
    const version = saved ? `${saved.sessionId}:${saved.version}` : 'new';
    untrack(() => {
      if (loadedVersion === version) return;
      loadedVersion = version;
      const incoming = reviewSnapshot(saved);
      const normalizedDraft = reviewSnapshot({ focusScore, fatigueScore, difficultyScore, satisfactionScore, note }, true);
      // A successful save can trim the note or turn an empty note into null.
      // Matching content acknowledges that save without treating it as a conflict.
      if (dirty && reviewSnapshot(saved, true) !== normalizedDraft) {
        remoteChanged = incoming !== baseline;
        return;
      }
      useSavedReview(saved);
    });
  });

  const rows = [
    { label: 'Focus', key: 'focus', low: 'Distracted', high: 'Fully focused' },
    { label: 'Fatigue', key: 'fatigue', low: 'Rested', high: 'Exhausted' },
    { label: 'Difficulty', key: 'difficulty', low: 'Easy', high: 'Very difficult' },
    { label: 'Satisfaction', key: 'satisfaction', low: 'Dissatisfied', high: 'Very satisfied' }
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

<section class="rounded-[14px] border border-white/10 bg-white/[0.055] p-5 sm:p-6">
  <div class="max-w-xl">
    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">Session review</p>
    <h2 class="tk-display mt-2 text-2xl font-bold">How did the session feel?</h2>
    <p class="mt-2 text-sm leading-6 text-white/75">Optional. These scores help Taskiller personalize future focus recommendations.</p>
  </div>

  {#if remoteChanged}
    <div role="status" class="mt-5 rounded-[12px] border border-[var(--warning-border)]/30 bg-amber-200/10 p-4 text-sm text-white">
      <p>A newer saved review is available. Your unsaved reflection is still here.</p>
      <Button class="mt-3 border-white/20 text-white hover:bg-white/10" variant="ghost" disabled={busy} onclick={() => useSavedReview(review)}>Use saved review</Button>
    </div>
  {/if}

  <div class="mt-6 grid gap-4 sm:grid-cols-2">
    {#each rows as row}
      <fieldset disabled={busy} class="min-w-0 rounded-[16px] bg-white/[0.045] p-4">
        <legend class="px-1 text-sm font-semibold">{row.label}</legend>
        <div class="flex items-center justify-between gap-4">
          <span class="text-xs text-white/75">1: {row.low}</span>
          <span class="text-xs text-white/75">5: {row.high}</span>
        </div>
        <div class="mt-3 grid grid-cols-5 gap-1.5">
          {#each [1, 2, 3, 4, 5] as score}
            <button
              type="button"
              onclick={() => setScore(row.key, score)}
              aria-label={`${row.label}, ${score} of 5${score === 1 ? `, ${row.low}` : score === 5 ? `, ${row.high}` : ''}`}
              class="tk-mono h-11 rounded-[10px] border text-xs font-bold transition {current(row.key) === score ? 'border-tk-strike bg-tk-strike text-[#1a1512]' : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.09]'}"
              aria-pressed={current(row.key) === score}
            >{score}</button>
          {/each}
        </div>
      </fieldset>
    {/each}
  </div>

  <label class="mt-5 block text-xs font-bold text-white/75">
    Note
    <Textarea disabled={busy} class="mt-2 min-h-28 border-white/10 bg-white/[0.06] text-white placeholder:text-white/75" bind:value={note} placeholder="What helped? What got in the way?" maxlength="4000" />
  </label>

  <div class="mt-5 flex items-center gap-3">
    <Button variant="dark" disabled={busy} onclick={submit}>{review ? 'Update review' : 'Save review'}</Button>
    {#if dirty}<span class="text-xs text-white/75">Unsaved changes</span>{:else if review}<span class="text-xs text-white/75">Saved</span>{/if}
  </div>
</section>
