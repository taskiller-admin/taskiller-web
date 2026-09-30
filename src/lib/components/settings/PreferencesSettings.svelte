<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import SlidersHorizontalIcon from 'phosphor-svelte/lib/SlidersHorizontalIcon';
  import CrosshairIcon from 'phosphor-svelte/lib/CrosshairIcon';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import {
    AccountConflictError,
    getPreferences,
    updatePreferences,
    type PreferredStrategy
  } from '$lib/api/account';
  import { queryKeys } from '$lib/api/query-keys';
  import { problemMessage } from '$lib/api/problem';

  const queryClient = useQueryClient();
  const preferences = createQuery(() => ({
    queryKey: queryKeys.account.preferences,
    queryFn: getPreferences
  }));

  let timezone = $state('UTC');
  let locale = $state('en');
  let weekStartsOn = $state('1');
  let preferredStrategy = $state<PreferredStrategy>('auto');
  let minMinutes = $state('');
  let maxMinutes = $state('');
  let showReviewPrompt = $state(true);
  let draftInitializedFor = $state<number | null>(null);
  let conflict = $state(false);
  let message = $state('');
  let error = $state('');

  function loadServerValues() {
    const current = preferences.data?.preferences;
    if (!current) return;
    timezone = current.timezone;
    locale = current.locale;
    weekStartsOn = String(current.weekStartsOn);
    preferredStrategy = current.preferredStrategy;
    minMinutes = current.preferredWorkBlockMinSeconds == null ? '' : String(Math.round(current.preferredWorkBlockMinSeconds / 60));
    maxMinutes = current.preferredWorkBlockMaxSeconds == null ? '' : String(Math.round(current.preferredWorkBlockMaxSeconds / 60));
    showReviewPrompt = current.showReviewPrompt;
    conflict = false;
    error = '';
    message = '';
  }

  $effect(() => {
    const current = preferences.data?.preferences;
    if (!current || draftInitializedFor !== null) return;
    loadServerValues();
    draftInitializedFor = current.version;
  });

  const save = createMutation(() => ({
    mutationFn: () => {
      const min = minMinutes.trim() ? Math.round(Number(minMinutes) * 60) : null;
      const max = maxMinutes.trim() ? Math.round(Number(maxMinutes) * 60) : null;
      return updatePreferences(
        {
          timezone: timezone.trim(),
          locale: locale.trim(),
          weekStartsOn: Number(weekStartsOn),
          preferredStrategy,
          preferredWorkBlockMinSeconds: Number.isFinite(min) ? min : null,
          preferredWorkBlockMaxSeconds: Number.isFinite(max) ? max : null,
          showReviewPrompt
        },
        preferences.data?.etag ?? null
      );
    },
    onSuccess: (result) => {
      conflict = false;
      error = '';
      message = 'Preferences saved.';
      queryClient.setQueryData(queryKeys.account.preferences, result);
      draftInitializedFor = result.preferences.version;
    },
    onError: async (cause) => {
      message = '';
      if (cause instanceof AccountConflictError) {
        conflict = true;
        await preferences.refetch();
        return;
      }
      error = problemMessage(cause, 'Could not save preferences.');
    }
  }));

  function useBrowserTimezone() {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
</script>

<section id="preferences" class="scroll-mt-24 rounded-[22px] border border-[var(--border)] bg-white/78 p-5 sm:p-6">
  <div class="flex items-start gap-3">
    <div class="grid size-10 place-items-center rounded-[13px] bg-tk-blue/10 text-[#3654c9]"><SlidersHorizontalIcon size={21} /></div>
    <div>
      <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Behavior</p>
      <h2 class="mt-1 text-xl font-bold">Preferences</h2>
    </div>
  </div>

  {#if preferences.isPending}
    <div class="mt-6 h-48 animate-pulse rounded-[16px] bg-black/[0.04]"></div>
  {:else}
    <form class="mt-6 grid gap-5 lg:grid-cols-2" onsubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Timezone</span>
        <div class="flex gap-2">
          <Input bind:value={timezone} maxlength="100" placeholder="Europe/Istanbul" />
          <Button type="button" variant="secondary" size="icon" aria-label="Use browser timezone" onclick={useBrowserTimezone}><CrosshairIcon size={16} /></Button>
        </div>
        <span class="mt-1.5 block text-[11px] leading-5 text-tk-graphite">Use an IANA timezone, for example Europe/Istanbul.</span>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Locale</span>
        <Input bind:value={locale} maxlength="40" placeholder="en" />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Week starts on</span>
        <Select bind:value={weekStartsOn}>
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </Select>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Preferred focus strategy</span>
        <Select bind:value={preferredStrategy}>
          <option value="auto">Auto</option>
          <option value="continuous">Continuous</option>
          <option value="structured">Structured</option>
          <option value="flexible">Flexible</option>
        </Select>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Preferred minimum work block (minutes)</span>
        <Input type="number" min="1" max="360" step="5" bind:value={minMinutes} placeholder="No preference" />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-bold text-tk-graphite">Preferred maximum work block (minutes)</span>
        <Input type="number" min="1" max="360" step="5" bind:value={maxMinutes} placeholder="No preference" />
      </label>

      <label class="lg:col-span-2 flex items-center justify-between gap-5 rounded-[16px] bg-[#f0f0ec] p-4">
        <span>
          <span class="block text-sm font-bold">Prompt for a review after sessions</span>
          <span class="mt-1 block text-xs leading-5 text-tk-graphite">Reviews are optional, but they supply the focus/fatigue signals used by history-informed recommendations.</span>
        </span>
        <input class="size-5 accent-tk-strike" type="checkbox" bind:checked={showReviewPrompt} />
      </label>

      <div class="lg:col-span-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save preferences'}</Button>
        {#if message}<span class="text-sm text-tk-green">{message}</span>{/if}
      </div>
    </form>
  {/if}

  {#if conflict}
    <div class="mt-5 rounded-[14px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
      <p class="font-bold">Preferences changed elsewhere.</p>
      <p class="mt-1 leading-5">The latest server values are available, but your draft has not been replaced.</p>
      <Button variant="ghost" size="sm" class="mt-2 text-amber-950" onclick={loadServerValues}><ArrowsClockwiseIcon size={15} /> Use server values</Button>
    </div>
  {/if}
  {#if error}<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>{/if}
</section>
