# Release runbook

## 1. Backend

Confirm Taskiller backend CI is green and `openapi/current.json` is committed on `main`.

## 2. Contract sync

```bash
TASKILLER_OPENAPI_URL=https://raw.githubusercontent.com/kmab5/taskiller-backend/main/openapi/current.json npm run api:update
npm run api:check
```

Review any contract change before committing generated frontend types.

## 3. Frontend quality

```bash
npm run check
npm run release:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Optional production dependency audit:

```bash
npm run audit:prod
```

## 4. Commit

Commit the OpenAPI snapshot and generated types together whenever the contract changes.

## 5. Deploy

Push/merge `main`. Vercel should build the SvelteKit application automatically.

## 6. Smoke

```bash
TASKILLER_WEB_URL=https://YOUR-WEB.vercel.app \
TASKILLER_API_URL=https://YOUR-API.onrender.com \
npm run smoke:prod
```

Do not call the release healthy until both frontend `/healthz` and backend `/health/ready` pass.

## 7. Manual critical-path verification

1. Log in.
2. Hard reload `/today` and confirm refresh-cookie bootstrap.
3. Capture a Chore.
4. Build or load a Focus Plan.
5. Start a Session.
6. Pause/resume.
7. Complete/advance a segment.
8. Finish and save a review.
9. Open History and Analytics.
10. Open Settings → Devices.
11. Request an export.
12. Verify offline shell/update behavior in a production build.

## Rollback

If the frontend deploy is unhealthy, rollback the Vercel deployment without rolling back the backend unless the API contract itself caused the failure.

If a backend rollback changes the OpenAPI contract, immediately rerun frontend `api:check` against the rolled-back backend state before declaring compatibility.
