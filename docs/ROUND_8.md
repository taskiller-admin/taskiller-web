# Round 8 — production hardening and release

Round 8 turns Taskiller Web into a release-managed frontend rather than only an application source tree.

## Release gates

### Contract gate

`npm run api:check` checks every path and schema in committed `openapi/taskiller.json` against the configured backend OpenAPI source. Backend-only additions are allowed.

For CI, the default workflow compares against:

`https://raw.githubusercontent.com/kmab5/taskiller-backend/main/openapi/current.json`

A mismatch fails CI and requires:

```bash
npm run api:update
npm run api:generate
```

followed by committing both the OpenAPI snapshot and generated TypeScript schema.

### Browser gate

Playwright 1.63 runs deterministic browser tests against a production build with a mocked Taskiller API.

The suite covers:

- public landing and entry points;
- global 404/error surface;
- serious/critical axe accessibility violations on Login;
- login and refresh bootstrap;
- authenticated Today route;
- quick Chore capture + query refresh;
- keyboard access to the skip link;
- desktop Chromium and Pixel 7 Chromium profiles.

Service workers are blocked in E2E tests so network mocking remains deterministic. PWA behavior remains a separate preview/deployment validation concern.

### Build gate

CI requires:

```bash
npm run check
npm run release:check
npm run build
npm run test:e2e
```

The workflow uses Node 22 and installs Playwright's Chromium dependencies on the GitHub runner.

## Error handling

A global `+error.svelte` now provides branded 404 and unexpected-error recovery instead of SvelteKit's default error page.

Authenticated app routes also emit `noindex,nofollow`.

## Security

SvelteKit CSP is configured in `svelte.config.js`.

The policy is intentionally restrictive:

- default/script/font/form/manifest/worker sources are self-only;
- frames and objects are blocked;
- frame ancestors are denied;
- API connections are limited to the configured Taskiller API origin;
- inline styles remain allowed because the current UI uses runtime style attributes for progress bars, charts and hierarchy indentation.

`vercel.json` adds deployment-level headers:

- HSTS;
- X-Content-Type-Options;
- X-Frame-Options;
- Referrer-Policy;
- Permissions-Policy;
- Cross-Origin-Opener-Policy.

## Production health and smoke

`GET /healthz` returns a no-store frontend health response.

After deployment:

```bash
TASKILLER_WEB_URL=https://app.example.com \
TASKILLER_API_URL=https://api.example.com \
npm run smoke:prod
```

The smoke script verifies:

- frontend health;
- Login rendering;
- PWA manifest;
- backend readiness;
- expected security headers including CSP.

## PWA and caching

Round 7's conservative cache policy remains unchanged:

- frontend shell/static assets may be cached;
- visited navigations may be used for offline shell recovery;
- authenticated API responses are never service-worker cached;
- mutations are never queued offline.

## Release sequence

```text
backend CI green
    ↓
backend OpenAPI committed
    ↓
frontend api:check
    ↓
frontend check/build/E2E
    ↓
merge main
    ↓
Vercel production deploy
    ↓
smoke:prod against Vercel + Render
    ↓
release complete
```
