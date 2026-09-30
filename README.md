# Taskiller Web — Round 1

Production frontend foundation for Taskiller.

## Stack

- SvelteKit + Svelte 5 + strict TypeScript
- Tailwind CSS v4
- shadcn-svelte-compatible component structure
- Phosphor Icons
- TanStack Svelte Query v6
- OpenAPI sync/codegen pipeline (`openapi-typescript` + `openapi-fetch`)
- Vercel adapter

## Included in Round 1

- Taskiller brand tokens/assets and responsive shell
- login/register against the real API
- rotating refresh-cookie bootstrap; access token stays in memory
- automatic one-time access-token refresh for authenticated API calls
- Today view with real Chore query
- quick Chore capture (`Idempotency-Key` UUID)
- active Session query + server-timestamp-derived timer
- responsive desktop/sidebar + mobile bottom navigation
- placeholders for Inbox, Projects, Analytics and Settings
- live OpenAPI synchronization/code generation scripts

## Run

```bash
cp .env.example .env
# set PUBLIC_TASKILLER_API_URL to the Render API, without a trailing slash
npm install
npm run check
npm run dev
```

If you use pnpm, all npm commands map directly (`pnpm install`, `pnpm check`, etc.).

## Refresh the API contract

The repository includes a small Round-1 type subset so it can be read immediately. Replace it with the authoritative backend OpenAPI types as soon as your API is reachable:

```bash
npm run api:update
npm run check
```

The backend must allow the frontend origin in `TASKILLER_CORS_ORIGINS`, and because Vercel and Render are cross-site initially the backend refresh cookie should remain `Secure; SameSite=None`.

## Next round

Round 2: full Work domain UI — Inbox, Project/Sprint/Chore create/edit, tree navigation, ETags, conflict UX, reorder, and Project next-action.
