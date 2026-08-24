import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const generator = await readFile(new URL('../scripts/generate-game-pages.mjs', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker/src/index.js', import.meta.url), 'utf8');
assert.match(generator, /\/jogos\/\$\{system\}\/\$\{slug\}\//);
assert.match(generator, /rel="canonical"/);
assert.match(generator, /application\/ld\+json/);
assert.match(generator, /sitemap-games\.xml/);
assert.match(index, /publicGameUrl/);
assert.match(index, /`\/jogos\/\$\{system\}/);
assert.match(worker, /jogos\\\/\(nes\|snes\|n64\|gba\|megadrive\|ps1\)/);
console.log('game routes: 7 checks passed');
