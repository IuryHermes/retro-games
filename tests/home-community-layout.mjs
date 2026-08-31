import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const onlineIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/jogar-online.png', import.meta.url));
const playersIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/on-transparent.png', import.meta.url));
const supportIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/apoiar-projeto-v2.png', import.meta.url));
const offersIcon = await stat(new URL('../assets/imagens-videos/imagens do menu/achados-neoterminal.png', import.meta.url));

assert.ok(onlineIcon.size > 100_000);
assert.ok(playersIcon.size > 100_000);
assert.ok(supportIcon.size > 20_000);
assert.ok(offersIcon.size > 1_000);
assert.match(index, />ÁREA SOCIAL<\/div>/);
assert.match(index, /class="emulators-title">EMULADORES<\/div>/);
assert.match(index, /id="multiplayer-hub-trigger-desktop"/);
assert.match(index, /class="mobile-community-actions"/);
assert.match(index, /\.mobile-quick-scroll \{ display:flex;[^}]*overflow-x:auto/);
assert.match(index, /class="mobile-action-label">Achados</);
assert.match(index, /\.community-shortcuts-pc/);
assert.match(index, /'multiplayer-hub-trigger-desktop'/);
assert.match(index, /\.multiplayer-hub-trigger \{[^}]*background:var\(--sidebar-bg\)/);
assert.match(index, /\.community-shortcut \{[^}]*background:transparent/);
assert.match(index, /height: 245px; min-height: 220px/);
assert.match(index, /\.community-shortcut \{[^}]*border:0;[^}]*background:transparent/);
assert.match(index, /\.community-shortcut \{[^}]*justify-content:flex-start/);
assert.match(index, /\.community-shortcut \{[^}]*width:100%;[^}]*text-align:left/);
assert.match(index, /apoiar-projeto-v2\.png/);
assert.doesNotMatch(index, /<a class="chat-trigger-mobile"/);
assert.match(index, /href="social\.html"[^>]*aria-label="Comunidade"/);
assert.match(index, /logo-discord\.gif\?v=2/);
assert.match(index, /\.discord-float \{[^}]*max-width:230px/);
assert.doesNotMatch(index, /session\.recognition\.badges\.join/);

console.log('home community layout: 24 checks passed');
