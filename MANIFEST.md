# Taskiller Web Round 3 manifest

## New Round-3 surfaces

- `src/lib/api/focus.ts`
- expanded `src/lib/api/execution.ts`
- expanded `src/lib/api/query-keys.ts`
- expanded bootstrap `src/lib/api/generated/schema.d.ts`
- `src/lib/components/focus/RecommendationReasons.svelte`
- `src/lib/components/focus/SegmentEditor.svelte`
- `src/routes/(app)/work/[id]/plan/+page.svelte`
- `src/routes/(app)/session/[id]/+page.svelte`
- updated work detail Plan & Start entry points
- updated Today execution copy
- `docs/ROUND_3.md`

## Round-3 behavior

Recommendation → editable draft → save/update Focus Plan → start execution session → focused session handoff.

Concurrency and idempotency remain server-aligned: Focus Plan updates use ETags/If-Match, while recommendation/plan/session creation use Idempotency-Key.
