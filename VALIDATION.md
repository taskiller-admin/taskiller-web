# Round 8 validation

## Passed in this environment

- JavaScript/MJS syntax:
  - `svelte.config.js`
  - `src/service-worker.js`
  - OpenAPI/release/smoke scripts
- `npm run release:check`
- JSON parsing:
  - `package.json`
  - `static/site.webmanifest`
  - `vercel.json`
  - `openapi/taskiller.json`
- explicit `src/app.html` SvelteKit placeholders + `lang="en"`
- local `$lib` and relative import resolution
- Svelte control-block balance
- release-specific CI/script assertions
- TypeScript syntax parse of 72 `.ts` files and Svelte `<script>` units using the installed TypeScript compiler
- `git diff --check` for the Round 7 → Round 8 source diff

## Blocked by sandbox networking

`npm install --no-audit --no-fund` timed out. The sandbox also cannot resolve `raw.githubusercontent.com`, so `npm run api:check` could not perform its network fetch here.

Because dependencies could not install, the following release gates could not be executed in this sandbox:

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
npm run audit:prod
```

Run them locally or let the included GitHub Actions workflow execute them.

## Lockfile

This artifact cannot include a truthful `package-lock.json` because npm dependency resolution is blocked here. After the first successful local `npm install`, commit the generated `package-lock.json`. The included CI automatically switches from `npm install` to deterministic `npm ci` when the lockfile exists.

## Recommended local validation

```bash
npm install
npm run api:update
npm run api:check
npm run check
npm run release:check
npm run build
npx playwright install chromium
npm run test:e2e
```

After deployment:

```bash
TASKILLER_WEB_URL=https://YOUR-WEB.vercel.app \
TASKILLER_API_URL=https://YOUR-API.onrender.com \
npm run smoke:prod
```
