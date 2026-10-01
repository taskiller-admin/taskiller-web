import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const productionVercelBuild = Boolean(process.env.VERCEL || process.env.CI);
const vercelToolbar = Boolean(process.env.VERCEL);
const vercelLive = vercelToolbar ? ['https://vercel.live'] : [];
const vercelImages = vercelToolbar ? ['https://vercel.live', 'https://vercel.com'] : [];
const vercelFonts = vercelToolbar ? ['https://vercel.live', 'https://assets.vercel.com'] : [];
const vercelConnections = vercelToolbar ? ['https://vercel.live', 'wss://ws-us3.pusher.com'] : [];

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
    adapter: productionVercelBuild ? vercelAdapter() : nodeAdapter({ out: 'build' }),
    version: { pollInterval: 60_000 },
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'base-uri': ['self'],
        'connect-src': ['self', apiOrigin(), ...vercelConnections],
        'font-src': ['self', ...vercelFonts],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        'frame-src': vercelToolbar ? vercelLive : ['none'],
        'img-src': ['self', 'data:', 'blob:', ...vercelImages],
        'manifest-src': ['self'],
        'object-src': ['none'],
        'script-src': ['self', ...vercelLive],
        'style-src': ['self', 'unsafe-inline', ...vercelLive],
        'worker-src': ['self', 'blob:']
      }
    }
  }
};

export default config;
