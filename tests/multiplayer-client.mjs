import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const host = await readFile(new URL('../multiplayer.js', import.meta.url), 'utf8');
const guest = await readFile(new URL('../multiplayer-room.html', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker/src/index.js', import.meta.url), 'utf8');
const social = await readFile(new URL('../social.js', import.meta.url), 'utf8');

assert.match(host, /canvas\.captureStream\(30\)/);
assert.match(host, /createDataChannel\('neo-controls'/);
assert.match(host, /manager\.simulateInput\(seat - 1, index, value\)/);
assert.match(host, /type:'assign'/);
assert.match(guest, /new RTCPeerConnection/);
assert.match(guest, /SOLICITAR|Aguardando aprovação/);
assert.match(index, /JOGAR ONLINE/);
assert.match(index, /\/multiplayer\/rooms/);
assert.match(index, /neo_pending_multiplayer_room/);
assert.match(guest, /voltará automaticamente/);
assert.match(worker, /class MultiplayerRoom/);
assert.match(worker, /MULTIPLAYER_ROOMS\.getByName/);
assert.match(worker, /generate-ice-servers/);
assert.match(host, /\/multiplayer\/ice-servers/);
assert.match(guest, /\/multiplayer\/ice-servers/);
assert.doesNotMatch(guest, /stun\.cloudflare\.com:53/);
assert.match(host, /3\.5 \* 60 \* 60 \* 1000/);
assert.match(guest, /3\.5 \* 60 \* 60 \* 1000/);
assert.match(host, /CONVIDAR JOGADORES ONLINE/);
assert.match(host, /\.ejs_menu_bar/);
assert.match(worker, /class SocialPlayer/);
assert.match(worker, /\/social\/invite/);
assert.match(social, /\/social\/messages/);

console.log('multiplayer client and room: 23 checks passed');
