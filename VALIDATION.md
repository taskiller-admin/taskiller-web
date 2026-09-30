# Round 3 validation

Completed in the build workspace:

- parsed 42 TypeScript units, including every Svelte `<script lang="ts">`: OK;
- bundled `openapi/taskiller.json`: valid JSON;
- all `$lib` and relative local imports resolve;
- Round-3 bootstrap schema includes recommendation, Focus Plan, and session-start operations;
- backend contract rechecked at `7792c34c49e6a09e7e20380e8b6becf93c863c67`.

External npm installation is not reliably available in this environment, so the final Svelte compiler and Vite production build must be run locally.

Before committing/deploying:

```bash
npm install
npm run api:update
npm run check
npm run build
```

Exercise these flows against the deployed API:

1. Chore → Plan & Start → recommendation → edit → Save only.
2. Load saved plan → edit → ETag update.
3. Sprint → recommendation with linked Chores → save.
4. Save & Start → `/session/{id}`.
5. Attempt Start while another session is open → Resume path.
6. Project → backend next action → Plan & Start.
