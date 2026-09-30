# Round 6 — Account, settings, devices, data & privacy

Round 6 completes the authenticated account lifecycle around the existing Taskiller backend.

## Implemented

- profile editing with user ETags and recoverable `412` handling
- email verification request UX
- public email verification confirmation route (`/verify-email?token=...`)
- preference editing with ETags
  - IANA timezone
  - locale
  - week start
  - preferred focus strategy
  - preferred min/max work block
  - post-session review prompt
- active device/session listing
- revoke individual device sessions
- revoke the current session and return to login
- logout-all with confirmation
- password-reset request route with non-enumerating copy
- password-reset confirmation route
- asynchronous data export request/poll/download UX
- persistence of the latest export request ID across page reloads
- account-deletion confirmation and scheduled-deletion receipt
- immediate local auth clearing after the backend accepts deletion

## Lifecycle rules kept visible in the UI

- exports are jobs, not instant downloads
- ready export download URLs are short-lived signed links
- account deletion immediately deactivates the account and revokes sessions
- hard deletion occurs only after the backend-configured grace period
- the current backend exposes no deletion-cancellation endpoint
- profile and preference edits use optimistic concurrency instead of silent overwrite

## Security posture

Access tokens remain memory-only. Refresh credentials remain HttpOnly cookies managed by the API. Device revocation and logout-all invalidate server-side auth sessions rather than relying on client storage cleanup alone.
