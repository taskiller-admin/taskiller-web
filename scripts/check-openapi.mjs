import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

async function loadEnvFile() {
  if (!existsSync('.env')) return;
  const raw = await readFile('.env', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    process.env[key] ??= value;
  }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value;
}

function projectRemote(remote, local) {
  const projected = {
    openapi: remote.openapi,
    paths: {},
    components: { schemas: {} }
  };

  for (const [path, localItem] of Object.entries(local.paths ?? {})) {
    const remoteItem = remote.paths?.[path];
    if (!remoteItem) throw new Error(`Backend removed frontend path: ${path}`);

    projected.paths[path] = {};
    for (const [key, localValue] of Object.entries(localItem)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace', 'parameters'].includes(key)) {
        if (!(key in remoteItem)) throw new Error(`Backend removed frontend operation: ${key.toUpperCase()} ${path}`);
        projected.paths[path][key] = remoteItem[key];
      } else {
        projected.paths[path][key] = remoteItem[key];
      }
    }
  }

  for (const schemaName of Object.keys(local.components?.schemas ?? {})) {
    const remoteSchema = remote.components?.schemas?.[schemaName];
    if (!remoteSchema) throw new Error(`Backend removed frontend schema: ${schemaName}`);
    projected.components.schemas[schemaName] = remoteSchema;
  }

  return projected;
}

await loadEnvFile();

const direct = process.env.TASKILLER_OPENAPI_URL;
const base = process.env.TASKILLER_API_URL ?? process.env.PUBLIC_TASKILLER_API_URL;
if (!direct && !base) {
  throw new Error('Set TASKILLER_OPENAPI_URL or TASKILLER_API_URL/PUBLIC_TASKILLER_API_URL.');
}

const url = direct
  ? new URL(direct)
  : new URL('/openapi.json', base.endsWith('/') ? base : `${base}/`);

const response = await fetch(url, { headers: { Accept: 'application/json' } });
if (!response.ok) throw new Error(`OpenAPI fetch failed: ${response.status} ${response.statusText}`);

const remote = await response.json();
const local = JSON.parse(await readFile('openapi/taskiller.json', 'utf8'));
const projected = projectRemote(remote, local);

const localComparable = {
  openapi: local.openapi,
  paths: local.paths ?? {},
  components: { schemas: local.components?.schemas ?? {} }
};

if (JSON.stringify(canonical(projected)) !== JSON.stringify(canonical(localComparable))) {
  throw new Error(
    `Backend changed the OpenAPI surface Taskiller Web depends on. Run npm run api:update, regenerate types, review the diff, and commit it. Source: ${url}`
  );
}

console.log(`Frontend OpenAPI surface is compatible with ${url}`);
