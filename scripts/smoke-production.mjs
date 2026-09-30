const web = process.env.TASKILLER_WEB_URL?.replace(/\/$/, '');
const api = process.env.TASKILLER_API_URL?.replace(/\/$/, '');

if (!web || !api) {
  throw new Error('Set TASKILLER_WEB_URL and TASKILLER_API_URL.');
}

for (const [name, value] of [['TASKILLER_WEB_URL', web], ['TASKILLER_API_URL', api]]) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS for production smoke tests.`);
}

async function expectOk(url, label) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
  return response;
}

const health = await expectOk(`${web}/healthz`, 'frontend health');
const healthBody = await health.json();
if (healthBody.status !== 'ok') throw new Error('frontend health payload is not ok');

const login = await expectOk(`${web}/login`, 'frontend login page');
const loginHtml = await login.text();
if (!loginHtml.includes('Taskiller')) throw new Error('login page did not render Taskiller');

await expectOk(`${web}/site.webmanifest`, 'PWA manifest');
const ready = await expectOk(`${api}/health/ready`, 'backend readiness');
const readyBody = await ready.json();
if (readyBody.status !== 'ready') throw new Error(`backend is not ready: ${JSON.stringify(readyBody)}`);

const securityHeaders = [
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security',
  'content-security-policy'
];

for (const header of securityHeaders) {
  if (!login.headers.get(header)) throw new Error(`frontend is missing security header ${header}`);
}

console.log('Production smoke checks passed.');
