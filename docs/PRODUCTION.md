# Production deployment

## Required Vercel environment

```text
PUBLIC_TASKILLER_API_URL=https://YOUR-RENDER-API.onrender.com
```

Use the exact production API origin with no trailing slash.

## Required backend environment

The Render backend must allow the frontend origin in `TASKILLER_CORS_ORIGINS`.

For example:

```json
["https://taskiller-web.vercel.app"]
```

For cross-site refresh cookies keep:

```text
TASKILLER_REFRESH_COOKIE_SECURE=true
TASKILLER_REFRESH_COOKIE_SAMESITE=none
```

If you later use same-site custom domains such as `app.example.com` and `api.example.com`, review whether `SameSite=lax` is appropriate.

## Vercel

Import the `taskiller-web` repository and keep the framework preset as SvelteKit.

Build command:

```text
npm run build
```

The repository already uses `@sveltejs/adapter-vercel`.

## Pre-deploy

```bash
npm install
# Commit the generated package-lock.json once dependencies install successfully.
npm run api:update
npm run api:check
npm run check
npm run release:check
npm run build
npx playwright install chromium
npm run test:e2e
```

## Post-deploy

```bash
TASKILLER_WEB_URL=https://YOUR-WEB.vercel.app \
TASKILLER_API_URL=https://YOUR-API.onrender.com \
npm run smoke:prod
```

Then manually validate:

- login and refresh across a hard reload;
- quick capture;
- Project/Sprint/Chore edits;
- recommendation → plan → start;
- pause/resume/segment progression;
- terminal review;
- analytics/history;
- device revocation;
- export creation/download;
- installable PWA behavior.
