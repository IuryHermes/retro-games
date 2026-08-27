import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign, createHmac } from 'node:crypto';
import worker from '../worker/src/index.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' });
Object.assign(jwk, { kid: 'test-key', alg: 'RS256', use: 'sig' });

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const tokenFor = (overrides = {}) => {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'RS256', kid: 'test-key', typ: 'JWT' });
  const payload = encode({ aud: 'neoterminalroom', iss: 'https://securetoken.google.com/neoterminalroom', sub: 'firebase-user-1', email: 'jogador@example.com', iat: now, auth_time: now, exp: now + 3600, firebase: { sign_in_provider: 'google.com' }, ...overrides });
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
};

const objects = new Map();
const multiplayerRooms = new Map();
const rateBuckets = new Map();
const env = {
  ADMIN_PANEL_KEY: 'admin-test-key',
  DISCORD_CLIENT_SECRET: 'test-secret',
  TURN_KEY_ID: 'turn-test-id',
  TURN_KEY_API_TOKEN: 'turn-test-token',
  GAMES: {
    async get(key) {
      const entry = objects.get(key);
      return entry === undefined ? null : { size: entry.value.length, httpEtag: 'test', uploaded: entry.uploaded, customMetadata: entry.customMetadata, body: entry.value, async json() { return JSON.parse(entry.value.toString()); } };
    },
    async head(key) {
      const entry = objects.get(key);
      return entry === undefined ? null : { size:entry.value.length, uploaded:entry.uploaded, customMetadata:entry.customMetadata };
    },
    async put(key, value, options = {}) { objects.set(key, { value:Buffer.from(value), uploaded:new Date(), customMetadata:options.customMetadata || {} }); return { httpEtag: 'test' }; },
    async delete(key) { objects.delete(key); },
    async list({ prefix = '' } = {}) { return { truncated:false, objects:Array.from(objects, ([key, entry]) => ({ key, size:entry.value.length, uploaded:entry.uploaded, customMetadata:entry.customMetadata })).filter(object => object.key.startsWith(prefix)) }; }
  },
  MULTIPLAYER_ROOMS: {
    getByName(id) {
      return { async fetch(request) {
        const url = new URL(request.url);
        if (request.method === 'POST' && url.pathname === '/create') { const room = await request.json(); multiplayerRooms.set(id, room); return Response.json({ room }, { status:201 }); }
        if (url.pathname === '/summary') { const room = multiplayerRooms.get(id); return room ? Response.json({ ...room, status:'waiting', online:1, seatsUsed:1 }) : Response.json({ erro:'missing' }, { status:404 }); }
        return Response.json({ erro:'unsupported' }, { status:400 });
      }};
    }
  },
  SOCIAL_PLAYERS: {
    getByName(id) {
      return { async fetch(request) {
        const url = new URL(request.url);
        if (request.method !== 'POST' || url.pathname !== '/rate/check') return Response.json({ erro:'unsupported' }, { status:400 });
        const body = await request.json();
        const key = `${id}:${body.action}`;
        const now = Date.now();
        const bucket = rateBuckets.get(key);
        const current = !bucket || bucket.resetAt <= now ? { count:0, resetAt:now + body.windowMs } : bucket;
        current.count += 1; rateBuckets.set(key, current);
        return current.count > body.limit ? Response.json({ erro:'rate' }, { status:429, headers:{ 'Retry-After':'60' } }) : Response.json({ permitido:true });
      }};
    }
  }
};

const originalFetch = globalThis.fetch;
let paymentExternalReference = '';
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes('/service_accounts/v1/jwk/')) return Response.json({ keys: [jwk] });
  if (url.includes('firebaseio.com/hall_cadastros/')) return Response.json({ ok: true });
  if (url.includes('api.mercadopago.com/checkout/preferences')) { paymentExternalReference = JSON.parse(init.body).external_reference; return Response.json({ init_point:'https://mercadopago.test/checkout' }); }
  if (url.includes('api.mercadopago.com/v1/payments/')) return Response.json({ id:123456, status:'approved', external_reference:paymentExternalReference, transaction_amount:5 });
  if (url.includes('/credentials/generate-ice-servers')) {
    assert.equal(init.headers.Authorization, 'Bearer turn-test-token');
    assert.equal(JSON.parse(init.body).ttl, 14400);
    return Response.json({ iceServers:[{ urls:['stun:stun.cloudflare.com:3478'] }, { urls:['turn:turn.cloudflare.com:3478?transport=udp','turn:turn.cloudflare.com:53?transport=udp'], username:'temporary-user', credential:'temporary-password' }] });
  }
  return originalFetch(input, init);
};

const auth = token => ({ Authorization: `Bearer ${token}` });
const discordToken = (() => { const payload = Buffer.from(JSON.stringify({ accountId:'discord-123456789012345678', username:'DiscordPlayer', purpose:'account', exp:Date.now()+3600000 })).toString('base64url'); return `${payload}.${createHmac('sha256','test-secret').update(payload).digest('base64url')}`; })();
let response = await worker.fetch(new Request('https://worker/multiplayer/ice-servers'), env);
assert.equal(response.status, 401);
response = await worker.fetch(new Request('https://worker/multiplayer/ice-servers', { headers:auth(tokenFor()) }), env);
const ice = await response.json();
assert.equal(response.status, 200);
assert.equal(ice.relay, true);
assert.equal(ice.iceServers[1].urls.length, 1);
assert.equal(response.headers.get('Cache-Control'), 'no-store');
assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
response = await worker.fetch(new Request('https://worker/account/profile', { method: 'PUT', headers: { ...auth(tokenFor()), 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Iury Player', avatar: 'avatar-01', birthDate: '1990-01-01', locality: 'São Paulo', bio: 'Jogador retrô', instagram: 'https://instagram.com/iury' }) }), env);
assert.equal(response.status, 200);
assert.equal((await response.json()).created, true);

response = await worker.fetch(new Request('https://worker/club/session', { headers: auth(tokenFor()) }), env);
const session = await response.json();
assert.equal(response.status, 200);
assert.equal(session.plan, 'registered');
assert.equal(session.manualSaveLimit, 3);
assert.equal(session.username, 'Iury Player');

response = await worker.fetch(new Request('https://worker/club/save?game=mario&slot=manual-4', { method: 'PUT', headers: { ...auth(tokenFor()), 'Content-Length': '3' }, body: new Uint8Array([1, 2, 3]) }), env);
assert.equal(response.status, 403);

response = await worker.fetch(new Request('https://worker/club/session', { headers: auth(tokenFor({ exp: 1 })) }), env);
assert.equal(response.status, 401);

const played = (id, name) => worker.fetch(new Request('https://worker/account/history', { method: 'POST', headers: { ...auth(tokenFor()), 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name, system: 'snes', cover: 'systems/snes/capas/game.jpg', playUrl: `player-universal.html?game=${id}&core=snes` }) }), env);
assert.equal((await played('game-one', 'Game One')).status, 200);
assert.equal((await played('game-two', 'Game Two')).status, 200);
assert.equal((await played('game-one', 'Game One')).status, 200);
response = await worker.fetch(new Request('https://worker/account/history', { headers: auth(tokenFor()) }), env);
const history = await response.json();
assert.deepEqual(history.games.map(game => game.id), ['game-one', 'game-two']);

const putAuto = game => worker.fetch(new Request(`https://worker/club/save?game=${game}&slot=auto`, { method:'PUT', headers:{ ...auth(tokenFor()), 'Content-Length':'3', 'X-Game-Name':encodeURIComponent(game), 'X-Game-System':'snes' }, body:new Uint8Array([1, 2, 3]) }), env);
assert.equal((await putAuto('auto-one')).status, 200);
assert.equal((await putAuto('auto-two')).status, 200);
assert.equal((await putAuto('auto-three')).status, 200);
response = await putAuto('auto-four');
assert.equal(response.status, 409);
assert.equal((await response.json()).automaticGameLimit, 3);
response = await worker.fetch(new Request('https://worker/club/library', { headers:auth(tokenFor()) }), env);
const library = await response.json();
assert.equal(library.automaticGamesUsed, 3);
assert.equal(library.games.find(game => game.id === 'auto-one').name, 'auto-one');
response = await worker.fetch(new Request('https://worker/club/save-image?game=auto-one', { method:'PUT', headers:{ ...auth(tokenFor()), 'Content-Type':'image/png', 'Content-Length':'4' }, body:new Uint8Array([137, 80, 78, 71]) }), env);
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://worker/club/save-image?game=auto-one', { headers:auth(tokenFor()) }), env);
assert.equal(response.status, 200);
assert.equal(response.headers.get('Content-Type'), 'image/png');
assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71]);
response = await worker.fetch(new Request('https://worker/club/save?game=auto-one&slot=auto', { method:'DELETE', headers:auth(tokenFor()) }), env);
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://worker/club/save-image?game=auto-one', { headers:auth(tokenFor()) }), env);
assert.equal(response.status, 404);
assert.equal((await putAuto('auto-four')).status, 200);

response = await worker.fetch(new Request('https://worker/account/profile', { method:'PUT', headers:{ ...auth(discordToken), 'Content-Type':'application/json' }, body:JSON.stringify({ name:'Discord Player', avatar:'avatar-02', birthDate:'1992-02-02', locality:'Rio de Janeiro', bio:'Jogador online' }) }), env);
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://worker/club/session', { headers:auth(discordToken) }), env);
const discordSession = await response.json();
assert.equal(discordSession.plan, 'registered');
assert.equal(discordSession.manualSaveLimit, 3);

response = await worker.fetch(new Request('https://worker/multiplayer/rooms', { method:'POST', headers:{ ...auth(tokenFor()), 'Content-Type':'application/json' }, body:JSON.stringify({ gameId:'snes-mario', title:'Super Mario World', system:'snes', maxPlayers:2, isPublic:true }) }), env);
assert.equal(response.status, 201);
const createdRoom = await response.json();
assert.match(createdRoom.room.id, /^[a-f0-9]{12}$/);
assert.ok(createdRoom.ticket);
response = await worker.fetch(new Request('https://worker/multiplayer/rooms'), env);
const publicRooms = await response.json();
assert.equal(publicRooms.rooms.length, 1);
assert.equal(publicRooms.rooms[0].title, 'Super Mario World');
assert.equal(publicRooms.rooms[0].hostUid, undefined);
response = await worker.fetch(new Request(`https://worker/multiplayer/rooms/${createdRoom.room.id}/join`, { method:'POST', headers:auth(tokenFor()) }), env);
assert.equal(response.status, 200);
const joinedRoom = await response.json();
assert.ok(joinedRoom.ticket);
assert.equal(joinedRoom.room.hostUid, undefined);

for (let attempt = 0; attempt < 13; attempt++) response = await worker.fetch(new Request('https://worker/multiplayer/ice-servers', { headers:auth(discordToken) }), env);
assert.equal(response.status, 429);
assert.ok(Number(response.headers.get('Retry-After')) > 0);

const monthParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
const currentMonth = `${monthParts.year}-${monthParts.month}`;
const adminRequest = (payload, key = 'admin-test-key') => worker.fetch(new Request('https://worker/internal/admin-console', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Admin-Key':key }, body:JSON.stringify({ ...payload, adminActor:'teste' }) }), env);
response = await adminRequest({ action:'support-goal-get', month:currentMonth }, 'wrong-key');
assert.equal(response.status, 401);
response = await adminRequest({ action:'support-goal-get', month:'2026-13' });
assert.equal(response.status, 400);
response = await adminRequest({ action:'support-goal-get', month:currentMonth });
assert.equal(response.status, 200);
assert.equal((await response.json()).override, null);
response = await adminRequest({ action:'support-goal-set', month:currentMonth, goal:0 });
assert.equal(response.status, 400);
response = await adminRequest({ action:'support-goal-set', month:currentMonth, goal:450.5 });
assert.equal(response.status, 200);
assert.equal((await response.json()).override.goal, 450.5);
response = await worker.fetch(new Request('https://worker/public/hall'), env);
let publicGoal = (await response.json()).supportGoal;
assert.equal(publicGoal.goal, 450.5);
assert.equal(publicGoal.automatic, false);
response = await adminRequest({ action:'support-goal-clear', month:currentMonth });
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://worker/public/hall'), env);
publicGoal = (await response.json()).supportGoal;
assert.equal(publicGoal.goal, 300);
assert.equal(publicGoal.automatic, true);

response = await adminRequest({ action:'support-achievement-upsert', achievement:{ title:'Sem dados' } });
assert.equal(response.status, 400);
response = await adminRequest({ action:'support-achievement-upsert', achievement:{ title:'Servidor ampliado', description:'A comunidade viabilizou mais capacidade para saves.', category:'servidores', date:'2026-08-27', active:true } });
assert.equal(response.status, 200);
const achievement = (await response.json()).achievement;
assert.match(achievement.id, /^[a-f0-9-]{8,40}$/);
response = await adminRequest({ action:'support-achievements' });
assert.equal((await response.json()).achievements.length, 1);
response = await worker.fetch(new Request('https://worker/public/hall'), env);
let publicAchievements = (await response.json()).achievements;
assert.equal(publicAchievements.length, 1);
assert.equal(publicAchievements[0].title, 'Servidor ampliado');
response = await adminRequest({ action:'support-achievement-upsert', achievement:{ ...achievement, active:false } });
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://worker/public/hall'), env);
publicAchievements = (await response.json()).achievements;
assert.equal(publicAchievements.length, 0);
response = await adminRequest({ action:'support-achievement-delete', id:achievement.id, confirm:'errado' });
assert.equal(response.status, 400);
response = await adminRequest({ action:'support-achievement-delete', id:achievement.id, confirm:achievement.id });
assert.equal(response.status, 200);
response = await adminRequest({ action:'support-achievement-delete', id:achievement.id, confirm:achievement.id });
assert.equal(response.status, 404);

const siteOnlyToken = tokenFor({ sub:'site-supporter-1', email:'sem-discord@example.com' });
response = await worker.fetch(new Request('https://worker/gerar-link', { method:'POST', headers:{ ...auth(siteOnlyToken), 'Content-Type':'application/json' }, body:JSON.stringify({ plano:'cafe', nome:'Sem Discord', mensagem:'Preservando junto', anonimo:false, exibirMural:true, exibirValor:false, idMensagem:`MSG-${Date.now()}`, discordToken:'' }) }), env);
assert.equal(response.status, 200);
assert.equal((await response.json()).link, 'https://mercadopago.test/checkout');
const siteOnlyPayment = JSON.parse(objects.get(`payments/v1/${paymentExternalReference}.json`).value.toString());
assert.equal(siteOnlyPayment.accountUid, 'site-supporter-1');
assert.equal(siteOnlyPayment.discordId, undefined);
assert.equal(siteOnlyPayment.exibirValor, false);
response = await worker.fetch(new Request('https://worker/webhook', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ data:{ id:'123456' } }) }), env);
assert.equal(response.status, 200);
response = await worker.fetch(new Request('https://worker/club/session', { headers:auth(siteOnlyToken) }), env);
const supportedSession = await response.json();
assert.equal(supportedSession.plan, 'cafe');
assert.equal(supportedSession.manualSaveLimit, 7);
assert.ok(supportedSession.recognition.badges.includes('FUNDADOR'));
assert.ok(supportedSession.recognition.badges.includes('APOIADOR'));
response = await worker.fetch(new Request('https://worker/public/hall'), env);
const privateValueSupporter = (await response.json()).supporters.find(item => item.nome === 'Sem Discord');
assert.ok(privateValueSupporter);
assert.equal(privateValueSupporter.valor, null);
assert.ok(privateValueSupporter.recognition.badges.includes('FUNDADOR'));

console.log('worker auth/history/discord/cloud/multiplayer/admin support: 79 checks passed');
