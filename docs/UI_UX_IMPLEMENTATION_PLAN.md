# UI/UX implementation plan

Approved direction: implement all 30 findings in `UI_UX_AUDIT.md`, retain Taskiller's orange identity and domain model, and deliver a working visual direction for user evaluation.

1. Add browser regression coverage for off-screen search, account navigation, failed capture, dialog focus, filter persistence and timer resume. Confirm the current failures before implementation.
2. Build shared modal-focus and unsaved-draft helpers. Improve tokens, contrast, typography, controls, icon semantics and reduced-motion handling. Remove decorative workspace animation and broad theme repairs.
3. Rework navigation/search and Today: compact layouts, full-width mobile search, universal account access, complete searchable work data, explicit loading/error/success states and a contextual first-session path.
4. Update work organization: complete Inbox data, paged Projects, URL filters, accessible tabs, readable rows, draft guards, clear save/delete feedback and contextual Work Types.
5. Update focus planning/execution/review: reactive authoritative clock, nearby mobile controls, inline prerequisites, accessible state announcements, draft protection and meaningful review scales.
6. Update authentication/settings/portability: associated labels, password reveal/help, home links, accessible dialogs, truthful loading/errors/theme previews, plain-language destructive and export copy, lazy ZIP imports.
7. Update History/Analytics: cancel stale requests, persist filters, provide accessible chart values, consolidate first-use empty content and preserve real-data detail.
8. Make the landing example explicit and interactive. Validate the whole product at desktop/mobile widths in both themes, run checks/build/release/API/E2E checks and live Django integration where available. Review changes, resolve findings, commit and push to the configured origin.

Constraints: no token persistence, offline mutation queue, invented API parameters or claims; preserve ETags/idempotency/server session timestamps. No backend contract change is intended. Native dialogs/confirmations are acceptable where they accurately protect data. Reuse existing components and avoid new dependencies.

Shared interfaces: `modalFocus(node, { onclose, canClose? })` manages dialog entry/containment/Escape/inertness/return; `protectUnsaved(() => dirty)` registers router/unload protection inside a component. Parent owns these helpers, shell/search/Today/styles and cross-cutting icons. Feature work owns disjoint files; verification follows integration.
