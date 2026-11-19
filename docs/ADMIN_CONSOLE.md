# Staff console deployment

The web console is at `/admin`. Use the existing Vercel and Django deployments. Enable reads with the following private runtime variables on the intended console origin.

| Variable | Value |
| --- | --- |
| `TASKILLER_ADMIN_ENABLED` | `true` to expose the staff console |
| `TASKILLER_ADMIN_WRITES` | `true` to enable staff mutations after integration validation |
| `TASKILLER_ADMIN_API_ORIGIN` | Exact Django HTTPS origin, without a path |
| `TASKILLER_ADMIN_PUBLIC_ORIGIN` | Exact browser-facing console origin |

Configure the same browser origin in Django's staff origin and CSRF allowlists. Enroll the first Owner through the backend operator command before enabling access. Keep preview deployments disabled unless explicitly configured with a staging backend. Roll back by disabling writes, then access if needed.

The relay uses `taskiller_staff`, `taskiller_staff_csrf`, and `taskiller_staff_challenge`. These cookies are scoped to the console and are distinct from product credentials. The service worker bypasses admin navigations and admin data. Staff invitations are returned once to the creating staff member for secure delivery. Invitation URLs put the token in the fragment.

`openapi/admin.json` contains the admin operations and their referenced definitions from Django's canonical contract. Run `npm run api:admin:update` to refresh the snapshot and generated types. GitHub CI compares both snapshots against the canonical contract and verifies both generated files. Review permission names, cookie names, and command inputs when the backend changes.

On Django, configure `TASKILLER_ADMIN_CONSOLE_ORIGINS` and the corresponding CSRF trusted origins for the exact console origin. Use `TASKILLER_ADMIN_CONSOLE_ENABLED` and `TASKILLER_ADMIN_CONSOLE_WRITES_ENABLED` to control access on the backend. Set up staff enrollment using the backend runbook.

The browser suite uses a synthetic localhost admin upstream to exercise the relay without Django. Production readiness requires a later Django integration run with real staff credentials in staging, including MFA, CSRF, scoped reads, and an audited write.
