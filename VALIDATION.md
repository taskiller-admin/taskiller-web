# Round 7 validation

Completed in the build workspace:

- backend contract rechecked at `7792c34c49e6a09e7e20380e8b6becf93c863c67`;
- native SvelteKit service-worker behavior verified against current SvelteKit documentation;
- service worker JavaScript syntax checked with `node --check`: OK;
- bundled `openapi/taskiller.json`: valid JSON;
- all `$lib` and relative local imports resolve;
- Svelte `{#if}`, `{#each}`, `{#await}`, and `{#key}` block counts balance;
- no authenticated/cross-origin API request is cached by the service worker;
- non-GET/HEAD API actions fail immediately while offline and are not queued;
- `/offline` is prerendered for service-worker fallback;
- PWA manifest parses and declares app scope/start URL/icons/shortcuts;
- Google Fonts network dependency removed;
- skip-link, navigation-current, live-region, reduced-motion/high-contrast checks applied;
- `git diff --check`: OK;
- ZIP integrity: checked during packaging.

`npm install --ignore-scripts --no-audit --no-fund` was attempted in the sandbox and timed out before dependencies were installed. Therefore the final Svelte compiler, Vite build and browser PWA audit must be run locally.

Before commit/deploy:

```bash
npm install
npm run api:update
npm run check
npm run build
npm run preview
```

Then validate in a production browser context:

1. Application is installable from Chromium and can be added to Home Screen on supported mobile browsers.
2. DevTools Application panel shows an active Taskiller service worker and valid manifest.
3. Visit Today, Inbox and a work detail, then go offline; already-open UI stays visible and mutations fail immediately.
4. Reload an authenticated app route fully offline and confirm `/offline` recovery rather than `/login`.
5. Reconnect and return to the original route; queries refetch.
6. Start a session, lose connectivity, and confirm controls are disabled until reconnect while the visible timer/session snapshot remains understandable.
7. Deploy a new frontend version; wait for version polling and confirm the update banner reloads into the new worker/client together.
8. Keyboard-only: use the skip link, primary navigation, capture form, settings and focus controls.
9. Enable reduced motion and high-contrast/forced-colors modes and verify state remains understandable without animation/color alone.
10. Run Lighthouse/PWA/accessibility/performance checks against the deployed Vercel URL.
