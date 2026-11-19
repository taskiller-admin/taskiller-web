import { createServer } from 'node:http';

const id = '11111111-1111-4111-8111-111111111111';
const staff = { staffId: id, displayName: 'Test Operator', capabilities: ['view_users', 'manage_accounts', 'view_overview', 'view_jobs', 'view_audit'],
  expiresAt: '2099-01-01T00:00:00Z', idleExpiresAt: '2099-01-01T00:00:00Z' };
const user = { id, displayName: 'Sample User', email: 'sample@example.invalid', lifecycle: 'active', emailVerified: true, createdAt: '2026-11-01T00:00:00Z' };
const users = [user, {
  ...user, id: '22222222-2222-4222-8222-222222222222', displayName: 'Historical Verified',
  email: 'history-verified@example.invalid', createdAt: '2025-01-01T00:00:00Z'
}, {
  ...user, id: '33333333-3333-4333-8333-333333333333', displayName: 'Historical Unverified',
  email: 'history-unverified@example.invalid', emailVerified: false, createdAt: '2024-01-01T00:00:00Z'
}];

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace('/api/v1/admin/', '');
  const cookies = req.headers.cookie ?? '';
  const reply = (status, data, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(status === 204 ? undefined : JSON.stringify(data));
  };
  if (path === '/health') return reply(200, {});
  if (path === 'auth/csrf') return reply(200, { csrfToken: 'fixture-csrf' }, { 'set-cookie': 'taskiller_staff_csrf=fixture-csrf; Path=/api/v1/admin' });
  let body = {};
  if (req.method !== 'GET') {
    if (req.headers.origin !== 'http://127.0.0.1:4173' || req.headers['x-csrftoken'] !== 'fixture-csrf' || !cookies.includes('taskiller_staff_csrf=fixture-csrf')) {
      return reply(403, { code: 'admin_csrf_failed', title: 'CSRF validation failed' });
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch { return reply(400, { title: 'Invalid body' }); }
  }
  if (path === 'auth/login' && body.username === 'operator' && body.password === 'fixture-password') {
    return reply(200, { challengeId: id }, { 'set-cookie': 'taskiller_staff_challenge=fixture-challenge; Path=/api/v1/admin' });
  }
  if (path === 'auth/enroll' && body.invitationToken === 'fixture-invite' && body.password === 'existing9') {
    return reply(200, { challengeId: id, secret: 'FIXTUREKEY' }, {
      'set-cookie': 'taskiller_staff_challenge=fixture-enroll; Path=/api/v1/admin'
    });
  }
  if (path === 'auth/enroll/confirm' && cookies.includes('taskiller_staff_challenge=fixture-enroll')
      && body.challengeId === id && body.code === '123456') {
    return reply(200, { enrolled: true, recoveryCodes: ['fixture-recovery-code'] }, {
      'set-cookie': 'taskiller_staff_challenge=; Max-Age=0; Path=/api/v1/admin'
    });
  }
  if (path === 'auth/mfa' && cookies.includes('taskiller_staff_challenge=fixture-challenge') && body.challengeId === id && body.code === '123456') {
    return reply(200, staff, { 'set-cookie': ['taskiller_staff=fixture-session; Path=/api/v1/admin', 'taskiller_staff_challenge=; Max-Age=0; Path=/api/v1/admin'] });
  }
  if (!cookies.includes('taskiller_staff=fixture-session') || req.headers.authorization || cookies.includes('product_only=')) {
    return reply(401, { title: 'Staff authentication required' });
  }
  if (path === 'auth/logout') return reply(204, null, { 'set-cookie': 'taskiller_staff=; Max-Age=0; Path=/api/v1/admin' });
  if (path === 'me') return reply(200, staff);
  if (path === 'users' || path === 'users/search') {
    const { query, start, end, verified, lifecycle, cursor } = path === 'users/search' ? body : Object.fromEntries(url.searchParams);
    const matching = users.filter(row => {
      const created = Date.parse(row.createdAt);
      return (!query || row.email === query || row.displayName.toLowerCase().startsWith(query.toLowerCase()))
        && (!start || created >= Date.parse(start)) && (!end || created < Date.parse(end))
        && (verified === undefined || row.emailVerified === (verified === true || verified === 'true'))
        && (!lifecycle || row.lifecycle === lifecycle);
    });
    const offset = cursor ? Number(cursor) : 0;
    return reply(200, { items: matching.slice(offset, offset + 1), nextCursor: offset + 1 < matching.length ? String(offset + 1) : null });
  }
  if (path === 'users/' + id) return reply(200, user, { etag: '"user:fixture:1"' });
  if (path === 'users/' + id + '/suspend') {
    return reply(req.headers['if-match'] && req.headers['idempotency-key'] && body.reason?.comment ? 412 : 422,
      { code: 'conflict', title: 'Account changed' });
  }
  if (path === 'overview') {
    const start = Date.parse(url.searchParams.get('start'));
    const end = Date.parse(url.searchParams.get('end'));
    const days = Math.round((end - start) / 86_400_000);
    return reply(200, {
      registrations: days * 2, completedExecutionSessions: days * 3, accountsWithExecutionActivity: days,
      queuedJobs: 4, failedJobs: 1, observedAt: new Date().toISOString()
    });
  }
  if (path === 'jobs' || path === 'audit') return reply(200, { items: [], nextCursor: null });
  return reply(403, { title: 'Staff capability required' });
}).listen(4188, '127.0.0.1');
