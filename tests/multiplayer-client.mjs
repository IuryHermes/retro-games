import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const host = await readFile(new URL('../multiplayer.js', import.meta.url), 'utf8');
const guest = await readFile(new URL('../multiplayer-room.html', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker/src/index.js', import.meta.url), 'utf8');

assert.match(host, /canvas\.captureStream\(30\)/);
assert.match(host, /createDataChannel\('neo-controls'/);
assert.match(host, /manager\.simulateInput\(seat - 1, index, value\)/);
assert.match(host, /type:'assign'/);
assert.match(guest, /new RTCPeerConnection/);
assert.match(guest, /SOLICITAR|Aguardando aprovação/);
assert.match(index, /JOGAR ONLINE/);
assert.match(index, /\/multiplayer\/rooms/);
assert.match(worker, /class MultiplayerRoom/);
assert.match(worker, /MULTIPLAYER_ROOMS\.getByName/);

console.log('multiplayer client and room: 10 checks passed');
