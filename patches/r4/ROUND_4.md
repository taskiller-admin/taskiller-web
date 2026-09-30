# Round 4 — Execution and review

Round 4 turns the Round-3 session handoff into the complete execution experience.

## Shipped

- Dedicated full-screen focus mode: normal Taskiller navigation is hidden on `/session/*`.
- Server-authoritative timer reconstruction from session timestamps.
- Pause and resume events.
- Explicit segment start after advancing to the next segment.
- Work/retrieval/review/planning completion through `segment_completed`.
- Break/long-break start and completion through `break_started` / `break_ended`.
- Optional segment skipping.
- Work-item completion events:
  - Chore session can complete its Chore;
  - Sprint session can complete a segment-linked child Chore.
- Finish session and abandon session flows.
- ETag/If-Match on every execution mutation.
- `412` recovery reloads the latest server session while preserving a clear conflict message.
- Online/offline indicator and automatic session + event refresh on reconnect.
- Active sessions refetch while open and refetch on window focus.
- Event history retrieves all pages (up to the client safety cap) instead of only the first page.
- Immutable plan snapshot remains visible during and after execution.
- Post-terminal review with optional 1–5 focus, fatigue, difficulty, satisfaction scores and a note.
- Review upsert uses Idempotency-Key.
- Active-session cards now link directly back into the dedicated session view.

## Server alignment

The UI mirrors backend transition rules instead of inferring its own state machine:

- advancing a segment does not auto-start the next segment;
- break segments use break-specific event types;
- only optional segments expose Skip;
- reviews are only shown/saved after terminal session states;
- Project remains non-executable and is still resolved through Project next-action before planning.

## Deferred to Round 5

Round 5 owns analytics/history surfaces: summary cards, time-series visualization, work-type/work-item breakdowns, focus patterns, and browsing past execution sessions.

## API contract

Built against `taskiller-backend` main:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`
