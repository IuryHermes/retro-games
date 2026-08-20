const base = 'http://127.0.0.1:8790';
const password = process.env.ADMIN_PASSWORD;
const username = process.env.ADMIN_USERNAME || 'admin';
let endpoint = `${base}/api/admin`;
let headers;
if (password) {
  const login = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  const loginData = await login.json();
  if (!login.ok) throw new Error(`login HTTP ${login.status}: ${loginData.erro || ''}`);
  headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': loginData.csrf, Cookie: login.headers.get('set-cookie')?.split(';')[0] || '' };
} else {
  if (!process.env.WORKER_ADMIN_KEY || !process.env.WORKER_URL) throw new Error('Panel or Worker credentials are required');
  endpoint = `${process.env.WORKER_URL.replace(/\/$/, '')}/internal/admin-console`;
  headers = { 'Content-Type': 'application/json', 'X-Admin-Key': process.env.WORKER_ADMIN_KEY };
}
for (const [action, detail] of [['overview', {}], ['accounts', {}], ['referrals-admin', {}], ['rooms', {}], ['payments', {}], ['games', { system:'snes' }], ['audit', {}]]) {
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ action, ...detail }) });
  const data = await response.json().catch(() => ({}));
  console.log(JSON.stringify({ action, status: response.status, error: data.erro || '', count: data.rooms?.length ?? data.accounts?.length ?? data.referrals?.length ?? data.payments?.length ?? data.games?.length ?? data.audit?.length ?? null }));
}
