# Taskiller Web

SvelteKit/Svelte 5 frontend for the Taskiller API.

## Current implementation

Round 5 is complete:

- auth + refresh-cookie bootstrap;
- responsive application shell with dedicated full-screen focus mode;
- Today, Inbox, Projects and adaptive Project/Sprint/Chore workspaces;
- work CRUD, hierarchy, re-parenting, reorder, ETags and conflict recovery;
- Focus Plan recommendation generation, rationale and editable sequencing;
- saved-plan load/update + Save & Start;
- full execution state machine, reconnect recovery, event timeline and review;
- first-class History route with state/range/work-item filtering and pagination;
- analytics summary, activity timeseries and time-of-day execution view;
- work-type completion/focus/estimate comparisons;
- personalization-eligibility evidence without causal productivity claims;
- 30-day work-item analytics embedded directly in Project/Sprint/Chore detail;
- drill-down from analytics/history to the underlying work item and execution session.

See `docs/ROUND_1.md` through `docs/ROUND_5.md`.

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

Round 5 was built against Taskiller backend main:

`7792c34c49e6a09e7e20380e8b6becf93c863c67`

Run `npm run api:update` against the deployed backend before release so `openapi/taskiller.json` and `src/lib/api/generated/schema.d.ts` match production exactly.

The Round-5 analytics/history layer deliberately keeps its TypeScript response contracts in `src/lib/api/analytics.ts` and `src/lib/api/execution.ts`. This keeps the bundled Round-4 bootstrap schema usable offline while `api:update` remains the production source of truth.
