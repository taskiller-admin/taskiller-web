# Repository Guidelines

## Project and Related Repositories

Taskiller is an API-first task-execution system: capture, structure, plan, execute, review, and learn. Preserve the domain terms Project, Sprint, Chore, Work Type, Focus Plan, and Execution Session.

- `D:/Code/taskiller-web` (this repository): SvelteKit web client.
- `D:/Code/taskiller-backend`: active Python/Django REST Framework backend. Read its `AGENTS.md` before working there. Active code lives in `src/taskiller/`; `openapi/current.json` is the canonical client contract. `legacy_backend/` is historical reference.
- `D:/Code/taskiller`: product requirements, domain and state-machine specifications, research, API/database planning, examples, and brand assets. Start with its `README.md` and relevant files in `docs/`. Its original technical stack is historical; use the active backend's documentation and implementation for current behavior.

Keep changes scoped to the requested repositories. Cross-repository contract changes must remain compatible with the other clients.

## Structure and Conventions

The frontend uses Svelte 5, SvelteKit 2, TypeScript, Tailwind CSS 4, TanStack Svelte Query, and `openapi-fetch`. Use the existing two-space indentation, single-quoted TypeScript strings, typed interfaces, and Svelte 5 runes/snippets where appropriate. Components use PascalCase filenames; route files follow SvelteKit conventions.

- `src/routes/`: public authentication pages and the authenticated `(app)` route group, including Today, Inbox, Projects, planning, sessions, History, Analytics, and Settings.
- `src/lib/api/`: domain API wrappers, shared fetch/auth refresh logic, query keys, Problem Details handling, and generated types.
- `src/lib/components/`: feature components and shared UI primitives. Reuse these before adding alternatives.
- `src/lib/auth/`, `theme/`, `pwa/`, and `portable/`: session state, appearance, connectivity/install behavior, and portable import/export.
- `src/app.css`: shared styles; `static/brand/`: existing brand assets.
- `src/service-worker.js`: offline/PWA behavior.
- `tests/e2e/`: Playwright tests and mock API fixtures.
- `docs/`: implementation rounds, security guidance, production/release runbooks, and portable format specification. Root phase/design documents provide additional change history; `patches/` contains historical patches.

## Development and Validation

Use Node.js 22 or newer and npm. Copy `.env.example` to `.env` and set `PUBLIC_TASKILLER_API_URL` to the intended API origin without a trailing slash. Never commit secrets or local environment files.

- `npm install`: install dependencies; use `npm ci` when a committed lockfile is available.
- `npm run dev`: start Vite development server.
- `npm run check`: synchronize SvelteKit and validate Svelte/TypeScript.
- `npm run build`: production build; `npm run preview`: serve the build locally.
- `npm run release:check`: validate required release assets, manifest, and security headers.
- `npm run test:e2e`: mocked API browser tests on desktop Chromium and Pixel 7. Playwright builds and serves the app at `http://127.0.0.1:4173`; install Chromium with `npx playwright install chromium` if needed.
- `npm run test:e2e:django`: integration suite against a running Django backend. In PowerShell, first set `$env:TASKILLER_DJANGO_API_URL = 'http://127.0.0.1:8000'`. `npm run release:django` also runs checks and a build.

For application changes, run the relevant browser tests plus `npm run check` and `npm run build`. Run release checks for changes affecting deployment, PWA assets, or security configuration. Report the commands actually run and any missing prerequisites. CI additionally checks OpenAPI compatibility and generated-type drift. No standalone unit-test or lint script is currently defined.

Local builds use the Node adapter; CI or Vercel builds use the Vercel adapter. See `svelte.config.js`, `vercel.json`, and `.github/workflows/ci.yml` before changing deployment behavior.

## API Contract and Behavioral Invariants

The backend is authoritative. `openapi/taskiller.json` is the committed frontend-used contract surface, which may be smaller than the backend specification. Generated TypeScript types live in `src/lib/api/generated/schema.d.ts`; do not hand-edit them.

- `npm run api:update`: fetch the contract and regenerate types. The source is `TASKILLER_OPENAPI_URL`, falling back to `${PUBLIC_TASKILLER_API_URL}/openapi.json`.
- `npm run api:generate`: regenerate types from the committed snapshot.
- `npm run api:check`: check compatibility with the configured backend contract; backend-only additions are allowed.

Review and commit the snapshot and generated types together. Keep domain requests in `src/lib/api/` and reuse the shared client rather than bypassing authentication/error handling.

Preserve in-memory bearer access tokens and refresh-cookie authentication, including coordinated refresh/retry behavior. Preserve ETag/`If-Match` concurrency control, conflict recovery, and idempotency keys on applicable writes. Server timestamps and session state are authoritative; client countdowns render that state. Offline mutations are rejected rather than queued. Keep browser-only APIs guarded from SSR, and maintain accessibility, reduced-motion behavior, and existing theme support.

For portable data changes, consult `docs/export_format/TASKILLER_PORTABLE_IMPORT_EXPORT_SPEC.md` and coordinate with backend behavior. For authentication, privacy, CSP, or deployment changes, consult `docs/SECURITY.md`, `docs/PRODUCTION.md`, and `docs/RELEASE_RUNBOOK.md`.
