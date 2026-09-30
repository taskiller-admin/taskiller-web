# Taskiller Web

SvelteKit/Svelte 5 frontend for the Taskiller API.

## Current implementation

Round 4 is complete:

- auth + refresh-cookie bootstrap;
- responsive application shell with dedicated full-screen focus mode;
- Today, Inbox, Projects and adaptive Project/Sprint/Chore workspaces;
- work CRUD, hierarchy, re-parenting, reorder, ETags and conflict recovery;
- Focus Plan recommendation generation, rationale and editable sequencing;
- saved-plan load/update + Save & Start;
- execution session reconstruction from server timestamps;
- pause/resume;
- explicit segment and break start/finish controls;
- optional-segment skipping;
- linked Chore/work-item completion;
- session finish/abandon flows;
- ETag conflict recovery and reconnect refresh;
- complete session event timeline (paginated through the API);
- post-session focus/fatigue/difficulty/satisfaction review.

See `docs/ROUND_1.md` through `docs/ROUND_4.md`.

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

Round 4 was built against Taskiller backend main:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`

Run `npm run api:update` against the deployed backend before release so `openapi/taskiller.json` and `src/lib/api/generated/schema.d.ts` match production exactly.
