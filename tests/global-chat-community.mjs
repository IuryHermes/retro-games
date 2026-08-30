import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const social = await readFile(new URL('../social.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../social.js', import.meta.url), 'utf8');
const offers = await readFile(new URL('../ofertas.html', import.meta.url), 'utf8');
const multiplayer = await readFile(new URL('../multiplayer-v2.js', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker/src/index.js', import.meta.url), 'utf8');

assert.doesNotMatch(index, /id="chat-container"/);
assert.match(index, /href="social\.html"/);
assert.match(social, /id="global-chat"/);
assert.match(social, /id="global-messages"/);
assert.match(script, /ref\(getDatabase\(app\), 'mensagens'\)/);
assert.match(script, /onChildAdded\(query\(globalChat, limitToLast\(100\)\)/);
assert.match(script, /await push\(globalChat/);
assert.match(offers, /index\.html\?cadastro=1&return=ofertas\.html/);
assert.match(index, /auth-show-online/);
assert.match(index, /auth-show-game/);
assert.match(index, /auth-show-duration/);
assert.match(index, /safeAuthReturn/);
assert.match(script, /player\.currentGame/);
assert.match(script, /player\.playStartedAt/);
assert.match(multiplayer, /startedAt:playSessionStartedAt/);
assert.match(worker, /profile\.showOnlineStatus === false/);
assert.match(worker, /showCurrentGame/);
assert.match(worker, /showPlayDuration/);

console.log('global chat community: 18 checks passed');
