# Round 5 validation

Completed in the build workspace:

- backend contract rechecked at `7792c34c49e6a09e7e20380e8b6becf93c863c67`;
- analytics/history endpoints and response fields re-read from committed backend OpenAPI;
- parsed 50 TypeScript units, including every Svelte `<script lang="ts">`: OK;
- bundled `openapi/taskiller.json`: valid JSON;
- all `$lib` and relative local imports resolve, including `.d.ts` modules;
- Svelte `{#if}`, `{#each}`, `{#await}`, and `{#key}` block counts balance;
- work-item analytics drill-down and History navigation resolve to real routes;
- analytics uses descriptive language and does not derive causal productivity scores;
- activity/history data comes through the centralized authenticated API layer.

`npm install --prefer-offline --no-audit --no-fund` was attempted in the sandbox and timed out before dependencies were installed. Therefore the final Svelte compiler and Vite production build must be run locally.

Before committing/deploying:

```bash
npm install
npm run api:update
npm run check
npm run build
```

Exercise these flows against the deployed API:

1. Open Analytics with 7/30/90-day ranges.
2. Verify active-work / adherence / session / Chore summary values against API responses.
3. Inspect daily/weekly activity and hour-of-day charts with no history and with real history.
4. Confirm work-type rows match `/analytics/work-types`.
5. Confirm personalization cards only appear when backend eligibility is true.
6. Open History; filter range and state; load another page.
7. Open a session from History and return to its work item.
8. Open a Project/Sprint/Chore and verify its 30-day analytics card.
9. Use the work-item History link and confirm `workItemId` filtering.
10. Run with zero review scores and confirm the UI shows missing evidence rather than inventing values.
