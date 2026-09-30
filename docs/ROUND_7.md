# Round 7 — PWA, offline resilience, accessibility and performance

Round 7 hardens Taskiller as an installable production web app without weakening the API's server-authoritative model.

## PWA

- Native SvelteKit `src/service-worker.js`; no Workbox dependency.
- Pre-caches built application assets, `static/` assets and prerendered pages.
- Previously visited same-origin navigations are cached network-first for shell recovery.
- Cross-origin API traffic is never cached by the service worker.
- `site.webmanifest` now includes app identity, scope, categories, install shortcuts and maskable-capable icon declarations.
- Settings exposes an install surface using `beforeinstallprompt` when the browser supports it.
- SvelteKit version polling checks for new deployments every 60 seconds and exposes a controlled reload/update prompt.

## Offline model

Taskiller does **not** queue mutations offline. ETag- and idempotency-protected writes must be performed against current server state.

- The authenticated shell warns when connectivity is lost.
- Already-rendered query data remains visible while the app stays open.
- Session controls remain disabled offline as introduced in Round 4.
- API mutations fail immediately with a clear reconnect message instead of being queued.
- A cold authenticated navigation while offline goes to the prerendered `/offline` recovery page instead of incorrectly redirecting to login.
- On reconnect, the user can return to the original route; TanStack Query is configured to refetch on reconnect.

## Accessibility

- Desktop app shell and focus mode have keyboard skip links.
- Primary/mobile navigation exposes `aria-current="page"`.
- Global offline state is announced through a polite live region.
- Work Composer's expandable fields expose `aria-expanded` and `aria-controls`.
- Analytics comparison table has a caption and scoped column headings.
- Timer text includes a screen-reader description without making the one-second visual countdown a live region.
- Existing global `:focus-visible` and reduced-motion handling is retained.
- Added higher-contrast and forced-colors fallbacks.

## Performance/privacy

- Removed Google Fonts runtime requests; Taskiller now uses high-quality system font stacks.
- No new PWA/chart dependencies were added.
- SvelteKit retains route-level code splitting.
- Primary navigation asks SvelteKit to preload visible route code.
- Long history rows use `content-visibility: auto`.
- TanStack Query keeps inactive data for 30 minutes and refetches on reconnect/focus.
- Service worker cache is versioned and old Taskiller shell caches are removed on activation.

## Deployment notes

The service worker is production-only under normal SvelteKit behavior. Validate PWA behavior against `npm run build && npm run preview` or the Vercel deployment, not only `npm run dev`.

The service worker deliberately does not cache authenticated Render API responses. Offline reload therefore provides the shell/recovery page, not a persistent local clone of private account data.
