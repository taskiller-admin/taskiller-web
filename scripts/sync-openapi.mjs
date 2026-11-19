import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { adminOpenapi } from './admin-openapi.mjs';

async function loadEnvFile() {
  if (!existsSync('.env')) return;
  const raw = await readFile('.env', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^['\"]|['\"]$/g, '');
    process.env[key] ??= value;
  }
}

await loadEnvFile();

const direct = process.env.TASKILLER_OPENAPI_URL;
const base = process.env.TASKILLER_API_URL ?? process.env.PUBLIC_TASKILLER_API_URL;

if (!direct && !base) {
  throw new Error(
    'Set TASKILLER_OPENAPI_URL, PUBLIC_TASKILLER_API_URL in .env, or TASKILLER_API_URL in the shell.'
  );
}

const url = direct
  ? new URL(direct)
  : new URL('/openapi.json', base.endsWith('/') ? base : `${base}/`);

const response = await fetch(url, { headers: { Accept: 'application/json' } });
if (!response.ok) throw new Error(`OpenAPI fetch failed: ${response.status} ${response.statusText}`);

const spec = await response.text();
const source = JSON.parse(spec);
const admin = process.argv.includes('--admin');
const path = admin ? 'openapi/admin.json' : 'openapi/taskiller.json';
if (admin) {
  await writeFile(path, JSON.stringify(adminOpenapi(source), null, 2) + '\n');
} else {
  if (Object.keys(source.paths).some(path => path.startsWith('/api/v1/admin/'))) {
    for (const path of Object.keys(source.paths)) if (path.startsWith('/api/v1/admin/')) delete source.paths[path];
    for (const name of Object.keys(source.components?.schemas ?? {})) if (name.startsWith('Admin')) delete source.components.schemas[name];
    delete source.components?.securitySchemes?.staffCookie;
    await writeFile(path, JSON.stringify(source, null, 2) + '\n');
  } else await writeFile(path, `${spec.trim()}\n`);
}
console.log(`Synced ${url} -> ${path}`);
