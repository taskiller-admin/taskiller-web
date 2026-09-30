# Taskiller Web

SvelteKit/Svelte 5 frontend for the Taskiller API.

## Current implementation

Round 3 is complete:

- auth + refresh-cookie bootstrap;
- responsive application shell;
- Today, Inbox, Projects and adaptive Project/Sprint/Chore workspaces;
- work CRUD, hierarchy, re-parenting, reorder, ETags and conflict recovery;
- Focus Plan recommendation generation;
- recommendation rationale/provenance;
- editable Focus Plan segment sequencing;
- saved-plan load/update with ETags;
- Save & Start session flow;
- one-open-session recovery;
- active-session handoff and server-time reconstruction.

See `docs/ROUND_1.md`, `docs/ROUND_2.md`, and `docs/ROUND_3.md`.

## Setup

```bash
cp .env.example .env
npm install
npm run api:update
npm run check
npm run build
npm run dev
```

Set:

```env
PUBLIC_TASKILLER_API_URL=https://YOUR-API.onrender.com
```

The API URL must not end with `/`.

## Backend contract

Round 3 was built against Taskiller backend main:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`

Run `npm run api:update` against the deployed backend before release so `openapi/taskiller.json` and `src/lib/api/generated/schema.d.ts` match production exactly.
