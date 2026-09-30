# Taskiller Web

Svelte 5 / SvelteKit web client for Taskiller.

This package includes **Rounds 1–2**:

- production frontend foundation;
- login/register + rotating refresh-cookie bootstrap;
- memory-only access token;
- typed OpenAPI client boundary;
- TanStack Svelte Query state;
- responsive Taskiller application shell;
- Today execution runway + quick capture;
- active-session reconstruction display;
- Inbox;
- Projects;
- Project/Sprint/Chore workspaces;
- create/edit/delete/re-parent work;
- work hierarchy rendering;
- Project next-action;
- accessible reorder controls;
- ETag / `If-Match` conflict handling;
- Vercel adapter.

## Stack

- Svelte 5
- SvelteKit
- TypeScript
- Tailwind CSS v4
- shadcn-svelte-compatible local component structure
- Phosphor Icons
- TanStack Svelte Query
- openapi-typescript
- openapi-fetch
- Vercel adapter

## Run locally

```bash
cp .env.example .env
npm install
npm run check
npm run dev
```

Set the deployed API origin in `.env`:

```env
PUBLIC_TASKILLER_API_URL=https://YOUR-RENDER-API.onrender.com
```

No trailing slash.

The backend must allow your frontend origin in `TASKILLER_CORS_ORIGINS`. For local development that normally includes:

```json
["http://localhost:5173"]
```

## API contract

The committed `src/lib/api/generated/schema.d.ts` is a focused bootstrap subset matching backend OpenAPI v1.0.0 and the Round-2 endpoints.

Once the deployed backend is available, replace it with the full generated contract:

```bash
npm run api:update
npm run check
```

`api:update` downloads `/openapi.json` and runs `openapi-typescript`.

All component code talks to Taskiller through `src/lib/api/*`; components do not reproduce backend state machines.

## Round 2

See [`docs/ROUND_2.md`](docs/ROUND_2.md).

## Next — Round 3

Round 3 will implement Focus Plan recommendations and **Plan & Start**:

1. request recommendation for a Chore/Sprint;
2. show rationale/provenance without claiming scientific optimality;
3. edit recommended segments into the user's selected plan;
4. save Focus Plan;
5. create Execution Session;
6. reconcile one-open-session conflicts;
7. transition into the active focus surface.
