# Taskiller Web Round 7 manifest

## New files

- `src/service-worker.js`
- `src/lib/pwa/connectivity.ts`
- `src/lib/pwa/install.ts`
- `src/lib/components/pwa/UpdateAvailable.svelte`
- `src/lib/components/pwa/InstallAppCard.svelte`
- `src/routes/offline/+page.svelte`
- `src/routes/offline/+page.ts`
- `docs/ROUND_7.md`

## Expanded files

- `src/routes/+layout.svelte` — PWA initialization, update UI, reconnect-aware Query defaults and mobile app metadata
- `src/routes/(app)/+layout.svelte` — cold-offline recovery instead of false anonymous/login redirect
- `src/lib/components/layout/AppShell.svelte` — skip link, connectivity announcement, navigation semantics and route-code preloading
- `src/lib/api/client.ts` — immediate rejection of offline mutations; no silent mutation queue
- `src/routes/(app)/settings/+page.svelte` — install-app section
- `src/lib/components/work/WorkComposer.svelte` — expandable-form ARIA state
- `src/lib/components/execution/ActiveSessionCard.svelte` — avoids unnecessary timer interval while paused and improves assistive text
- `src/lib/components/history/SessionHistoryRow.svelte` — content-visibility optimization
- `src/routes/(app)/analytics/+page.svelte` — accessible table metadata
- `src/routes/(app)/session/[id]/+page.svelte` — focus-mode skip link
- `src/app.css` — local system fonts, contrast/forced-colors and performance helpers
- `static/site.webmanifest` — install metadata and shortcuts
- `svelte.config.js` — version polling
- `package.json` — version `0.7.0`
- `README.md`
