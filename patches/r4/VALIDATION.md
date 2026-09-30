# Round 4 validation

Completed in the build workspace:

- backend contract rechecked at `7792c34c49e6a09e7e20380e8b6becf93c863c67`;
- parsed 44 TypeScript units, including every Svelte `<script lang="ts">`: OK;
- bundled `openapi/taskiller.json`: valid JSON;
- Round-4 bootstrap schema includes execution events and reviews;
- all `$lib` and relative local imports resolve, including `.d.ts` modules;
- Svelte `{#if}`, `{#each}`, `{#await}`, and `{#key}` block counts balance;
- full session event pagination, ETag mutation paths, and terminal review paths are represented in the client layer.

`npm install --prefer-offline --no-audit --no-fund` was attempted in the sandbox but timed out before dependencies were installed. Therefore the final Svelte compiler and Vite production build must be run locally.

Before committing/deploying:

```bash
npm install
npm run api:update
npm run check
npm run build
```

Exercise these flows against the deployed API:

1. Start a Chore session from Plan & Start.
2. Pause → Resume.
3. Complete current work segment → explicitly start next break/segment.
4. Skip an optional segment; confirm required segment cannot expose Skip.
5. Mark the Chore complete from a Chore session.
6. Sprint session → mark a linked child Chore complete.
7. Finish after the final segment.
8. Finish early and abandon paths.
9. Trigger a stale ETag from another client/tab → confirm latest state reloads.
10. Go offline → controls disable; reconnect → session/events refetch.
11. Close a session → save and update a review.
12. Reopen the session route → immutable plan snapshot and event history reconstruct correctly.
