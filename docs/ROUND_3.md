# Round 3 — Focus planning and session start

Round 3 connects Taskiller's work hierarchy to execution.

## Shipped

- Plan & Start route for Chores and Sprints.
- Project handoff to the backend-selected next action.
- Recommendation generation with `auto`, `continuous`, `structured`, and `flexible` strategies.
- Optional available-time budget.
- Recommendation provenance and rationale display.
- Recommendation output becomes an editable draft rather than an irreversible choice.
- Segment editor:
  - reorder up/down;
  - add/remove segments;
  - change kind and duration mode;
  - edit target/min/max durations;
  - edit labels;
  - mark segments optional;
  - retain or change linked Chores for Sprint plans.
- Manual Focus Plan creation.
- Saved Focus Plan list/load/update.
- Focus Plan ETag support and recoverable `412` conflict state.
- Save-only and Save & Start flows.
- Idempotent recommendation, plan, and session creation.
- One-open-session recovery: a `409 open_session_exists` resolves to the active session and offers Resume.
- Dedicated `/session/[id]` handoff screen with server-authoritative timer reconstruction and immutable plan snapshot.
- Chore/Sprint detail screens now expose Plan & Start directly.
- Project next-action card exposes Plan & Start for the selected executable child.

## Deliberately deferred to Round 4

Round 3 starts and reconstructs execution sessions, but it does not yet implement the complete event-control surface. Round 4 owns pause/resume, segment completion/skip rules, work-item completion, abandonment/completion flows, reviews, reconnect behavior, and session-event history.

## API contract

Built against `taskiller-backend` main:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`
