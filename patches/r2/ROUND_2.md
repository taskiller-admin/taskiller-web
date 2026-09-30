# Round 2 — Work hierarchy + design pass

Backend contract checked against `kmab5/taskiller-backend` main at:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`

## Product delivered

Round 2 turns the Round-1 shell into a usable work-management client while preserving the backend as the source of truth.

### Design corrections

- The brand kit is treated as an asset library and identity anchor, not a layout constraint.
- Replaced the permanent dark sidebar with a lighter, quieter navigation shell.
- Kept dark surfaces for execution/focus moments where they improve hierarchy.
- Introduced a broader neutral surface system plus limited blue/green semantic accents.
- Switched interface typography to Manrope + DM Sans + JetBrains Mono for a more product-oriented UI while continuing to use Taskiller logo/icon assets.
- Removed the fake Focus Plan cards from Today; every work/focus claim shown in the app is now either server-derived or clearly marked as future functionality.
- Active Session now precedes backlog information on Today when present.
- Improved public landing, login, and signup pages so they feel like the same product as the authenticated workspace.

### Work hierarchy

Implemented against the existing REST API:

- Inbox of root/unfiled Chores.
- Inbox status filters.
- Quick capture with name-only minimum.
- Progressive-detail creation form.
- Projects index.
- Project cards with server-derived `nextAction`.
- Project creation.
- Project workspace.
- Sprint workspace.
- Chore detail.
- Project → Sprint/Chore creation.
- Sprint → Chore creation.
- Full hierarchy tree rendering.
- Explicit up/down ordering controls for direct children.
- Parent reassignment:
  - Sprint → Project.
  - Chore → Inbox, Project, or Sprint.
- Edit name, description, status, priority, active-effort estimate, planned start, deadline, and Project target dates.
- Soft delete through the backend delete endpoint.

### Concurrency

- Detail GETs retain the response `ETag`.
- PATCH uses `If-Match`.
- DELETE uses `If-Match`.
- Reorder fetches the child's current ETag before mutating.
- `412` is represented as `WorkConflictError`.
- Edit conflicts preserve the local draft and refetch server truth in the background.
- User can explicitly reset the editor to the newest server version.
- Every create/reorder mutation receives a client-generated UUID idempotency key.

### Auth correction

After refresh-cookie bootstrap, the client now calls `GET /api/v1/me` so the global authenticated shell always has the actual user profile after a reload.

## Accessibility decisions

- Reorder never depends on drag-and-drop.
- All hierarchy navigation is standard links.
- Create/edit forms use labels and native controls.
- Conflict messages use `role="alert"`.
- Visible focus treatment remains global.
- Reduced motion is respected.

## Deferred intentionally

Round 3 owns:

- recommendation creation;
- recommendation reasons/provenance UI;
- editable Focus Plan builder;
- Plan & Start;
- starting Chore/Sprint Sessions.

Round 4 owns full active-session event controls and review flow.
