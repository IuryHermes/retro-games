import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const onlineIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/jogar-online.png', import.meta.url));
const playersIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/on-transparent.png', import.meta.url));
const supportIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/apoiar-projeto-v2.png', import.meta.url));

assert.ok(onlineIcon.size > 100_000);
assert.ok(playersIcon.size > 100_000);
assert.ok(supportIcon.size > 20_000);
assert.match(index, /ÁREA SOCIAL · FORA DO EMULADOR/);
assert.match(index, /id="multiplayer-hub-trigger-desktop"/);
assert.match(index, /class="mobile-community-actions"/);
assert.match(index, /\.search-container \{ flex:0 0 100%/);
assert.match(index, /\.community-shortcuts-pc/);
assert.match(index, /'multiplayer-hub-trigger-desktop'/);
assert.match(index, /\.multiplayer-hub-trigger \{[^}]*background:var\(--sidebar-bg\)/);
assert.match(index, /\.community-shortcut \{[^}]*background:transparent/);
assert.match(index, /height: 245px; min-height: 220px/);
assert.match(index, /out\.prepend\(row\)/);
assert.ok(index.indexOf('class="chat-controls"') < index.indexOf('id="terminal-output"'));
assert.match(index, /\.community-shortcut \{[^}]*border:0;[^}]*background:transparent/);
assert.match(index, /apoiar-projeto-v2\.png/);

console.log('home community layout: 16 checks passed');
