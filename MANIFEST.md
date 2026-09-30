# Taskiller Web — Round 8 manifest

Frontend version: `0.8.0`

Backend contract reference: `kmab5/taskiller-backend@7792c34c49e6a09e7e20380e8b6becf93c863c67`

## Round 8 release additions

- `.github/workflows/ci.yml` — frontend CI: contract, generated types, Svelte/TS check, build, Playwright.
- `.github/dependabot.yml` — weekly npm and GitHub Actions dependency maintenance.
- `.npmrc` — Node engine enforcement and reduced install noise.
- `playwright.config.ts` — desktop + Pixel 7 Chromium release suite.
- `tests/e2e/` — public, authentication, quick-capture, keyboard and axe smoke tests.
- `src/app.html` — explicit production document shell and language.
- `src/routes/+error.svelte` — global branded 404/error recovery.
- `src/routes/healthz/+server.ts` — frontend deployment health endpoint.
- `scripts/check-openapi.mjs` — frontend-used backend contract compatibility gate.
- `scripts/release-check.mjs` — internal release artifact validation.
- `scripts/smoke-production.mjs` — deployed Vercel + Render smoke verification.
- `vercel.json` — production security headers.
- SvelteKit CSP configuration in `svelte.config.js`.
- `static/robots.txt` — prevents authenticated workspace routes from crawler indexing.
- `docs/PRODUCTION.md`, `docs/RELEASE_RUNBOOK.md`, `docs/SECURITY.md`, `docs/ROUND_8.md`.

## Existing application

Rounds 1–7 remain intact: auth, work hierarchy, Focus Plans, execution, History, Analytics, account/privacy lifecycle and PWA/offline support.
