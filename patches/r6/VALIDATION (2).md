# Round 6 validation

Completed in the build workspace:

- backend contract rechecked at `7792c34c49e6a09e7e20380e8b6becf93c863c67`;
- user/preferences/session/export/deletion/password-recovery behavior re-read from backend routes/services;
- parsed 62 TypeScript units, including every Svelte `<script lang="ts">`: OK;
- bundled `openapi/taskiller.json`: valid JSON;
- all `$lib` and relative local imports resolve, including `.d.ts` modules;
- Svelte `{#if}`, `{#each}`, `{#await}`, and `{#key}` block counts balance;
- profile and preference writes preserve ETag / `If-Match` concurrency semantics;
- active-session revocation and logout-all clear local auth state after server revocation;
- export UI treats exports as asynchronous jobs and polls only while queued/processing;
- account deletion reflects immediate deactivation/session revocation plus delayed hard deletion;
- password-reset request copy does not disclose whether an email is registered.

`npm install --prefer-offline --no-audit --no-fund` was attempted in the sandbox and timed out before dependencies were installed. Therefore the final Svelte compiler and Vite production build must be run locally.

Before committing/deploying:

```bash
npm install
npm run api:update
npm run check
npm run build
```

Exercise these flows against the deployed API:

1. Edit display name, then simulate a stale ETag and confirm conflict recovery.
2. Request email verification and confirm a token through `/verify-email`.
3. Change timezone, week start, focus strategy, min/max block length and review prompt.
4. Open two browser/device sessions; revoke the non-current one, then revoke current.
5. Sign in again and test logout-all.
6. Request a password reset; confirm with a valid token; verify prior sessions are revoked.
7. Request a data export and leave Settings open until status reaches `ready`; download the gzip archive.
8. Reload Settings while an export is in progress and confirm the latest request resumes polling.
9. Schedule account deletion only after typing the confirmation phrase; confirm redirect to the public receipt.
10. Verify the account can no longer authenticate after deletion is scheduled.
