# Frontend security notes

Taskiller Web keeps the access token in memory and relies on the backend-owned HttpOnly refresh cookie for session continuity.

## Browser storage

Do not persist access or refresh credentials in localStorage, IndexedDB, Cache Storage or the service worker.

## Service worker

The service worker must not cache cross-origin Taskiller API responses.

## CSP

SvelteKit emits the CSP configured in `svelte.config.js`. The API origin is derived from `PUBLIC_TASKILLER_API_URL` at build/deploy time.

Inline styles remain allowed because runtime chart/progress/hierarchy styles currently depend on style attributes. Inline scripts are not permitted by policy; SvelteKit handles required script hashes/nonces.

## Framing

Taskiller is not intended to run embedded in another site. Both CSP `frame-ancestors 'none'` and Vercel `X-Frame-Options: DENY` enforce that boundary.

## Secrets

No backend secret belongs in a `PUBLIC_` environment variable. The only public runtime environment value currently required is the Taskiller API URL.
