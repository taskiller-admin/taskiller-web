/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, prerendered, version } from '$service-worker';

const self = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (globalThis.self));
const CACHE_PREFIX = 'taskiller-shell-';
const CACHE = `${CACHE_PREFIX}${version}`;
const isAdmin = (path) => /^\/admin(?:\/|$)/.test(path);
const ASSETS = [...build, ...files, ...prerendered].filter(path => !isAdmin(new URL(path, self.location.origin).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS);
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(CACHE_PREFIX) && key !== CACHE) await caches.delete(key);
      }
      const cache = await caches.open(CACHE);
      for (const request of await cache.keys()) {
        if (isAdmin(new URL(request.url).pathname)) await cache.delete(request);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never cache authenticated API traffic, especially the cross-origin Render API.
  if (url.origin !== self.location.origin || isAdmin(url.pathname)) return;

  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(url.pathname);
        return cached ?? fetch(request);
      })()
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (response.ok && !isAdmin(new URL(response.url || request.url).pathname) &&
              !/\bno-store\b/i.test(response.headers.get('cache-control') ?? '')) {
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          return (await cache.match(request)) ?? (await cache.match('/offline')) ?? Response.error();
        }
      })()
    );
  }
});
