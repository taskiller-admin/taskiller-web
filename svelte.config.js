import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

function apiOrigin() {
  const value =
    process.env.PUBLIC_TASKILLER_API_URL ??
    process.env.TASKILLER_API_URL ??
    'http://localhost:8000';

  try {
    return new URL(value).origin;
  } catch {
    throw new Error('PUBLIC_TASKILLER_API_URL must be an absolute URL.');
  }
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    version: { pollInterval: 60_000 },
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'base-uri': ['self'],
        'connect-src': ['self', apiOrigin()],
        'font-src': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        'frame-src': ['none'],
        'img-src': ['self', 'data:', 'blob:'],
        'manifest-src': ['self'],
        'object-src': ['none'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'worker-src': ['self', 'blob:']
      }
    }
  }
};

export default config;
