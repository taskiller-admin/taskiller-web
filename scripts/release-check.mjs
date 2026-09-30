import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const required = [
  'src/app.html',
  'src/service-worker.js',
  'static/site.webmanifest',
  'static/icon-192.png',
  'static/icon-512.png',
  'openapi/taskiller.json',
  'vercel.json',
  'playwright.config.ts'
];

for (const path of required) await access(path, constants.R_OK);

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
if (pkg.version !== '0.8.0') throw new Error(`Expected package version 0.8.0, got ${pkg.version}.`);

const manifest = JSON.parse(await readFile('static/site.webmanifest', 'utf8'));
if (manifest.start_url !== '/today?source=pwa') throw new Error('Unexpected PWA start_url.');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
  throw new Error('PWA manifest must include both primary icon sizes.');
}

const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
const headers = vercel.headers?.flatMap((entry) => entry.headers ?? []) ?? [];
const keys = new Set(headers.map((entry) => entry.key.toLowerCase()));
for (const key of [
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security'
]) {
  if (!keys.has(key)) throw new Error(`Missing production header: ${key}`);
}

JSON.parse(await readFile('openapi/taskiller.json', 'utf8'));

console.log('Taskiller Web release contract is internally consistent.');
