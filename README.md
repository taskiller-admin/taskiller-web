# Taskiller Web

SvelteKit/Svelte 5 frontend for the Taskiller API.

## Release status

Rounds 1–8 are implemented. The frontend now includes:

- authentication and refresh-cookie bootstrap;
- responsive Project/Sprint/Chore planning surfaces;
- ETag conflict recovery and idempotent writes;
- Focus Plan recommendation/edit/save/start;
- full execution state machine + terminal review;
- History and Analytics;
- account/preferences/device/privacy/export/deletion flows;
- installable PWA and conservative offline recovery;
- accessibility/reduced-motion/high-contrast handling;
- OpenAPI drift CI gate;
- Playwright browser E2E + axe accessibility smoke;
- SvelteKit CSP + Vercel security headers;
- frontend health endpoint and production smoke command.

See `docs/ROUND_1.md` through `docs/ROUND_8.md`.

## Setup

```bash
cp .env.example .env
npm install
# Commit the generated package-lock.json once dependencies install successfully.
npm run api:update
npm run check
npm run build
npm run test:e2e
npm run dev
```

Set:

```env
PUBLIC_TASKILLER_API_URL=https://YOUR-API.onrender.com
```

The API URL must not end with `/`.

## Contract workflow

Taskiller Web treats the backend OpenAPI document as a release contract.

```bash
npm run api:update
npm run api:check
```

CI checks the committed frontend-used OpenAPI surface against backend `main` and also verifies that generated TypeScript types are committed.

Round 8 was built against backend:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`

## Quality

```bash
npm run check
npm run release:check
npm run build
npm run test:e2e
```

Optional production-dependency audit:

```bash
npm run audit:prod
```

## Production smoke

After Vercel deployment:

```bash
TASKILLER_WEB_URL=https://YOUR-WEB.vercel.app \
TASKILLER_API_URL=https://YOUR-API.onrender.com \
npm run smoke:prod
```

See `docs/PRODUCTION.md` and `docs/RELEASE_RUNBOOK.md`.
