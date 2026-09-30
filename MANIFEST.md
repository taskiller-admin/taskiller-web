# Taskiller Web Round 4 manifest

## New / expanded Round-4 surfaces

- expanded `src/lib/api/execution.ts`
- expanded `src/lib/api/query-keys.ts`
- expanded bootstrap `src/lib/api/generated/schema.d.ts`
- expanded `openapi/taskiller.json` execution/review subset
- `src/lib/components/execution/SessionTimeline.svelte`
- `src/lib/components/execution/SessionReviewForm.svelte`
- upgraded `src/lib/components/execution/ActiveSessionCard.svelte`
- upgraded `src/lib/components/layout/AppShell.svelte` with focus mode
- rebuilt `src/routes/(app)/session/[id]/+page.svelte`
- `docs/ROUND_4.md`

## Round-4 behavior

Plan & Start → live session → pause/resume → explicit segment/break progression → optional skip/work completion → finish/abandon → review, with reconnect and optimistic-concurrency recovery throughout.
