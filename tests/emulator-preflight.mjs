import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const preflight = await readFile(new URL('../emulator-preflight.js', import.meta.url), 'utf8');
const player = await readFile(new URL('../player-universal.html', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(player, /emulator-preflight\.js\?v=1/);
assert.match(player, /NeoEmulatorPreflight\.check/);
assert.match(player, /Verificação preventiva/);
assert.match(preflight, /typeof WebAssembly/);
assert.match(preflight, /webglAvailable/);
assert.match(preflight, /method: 'HEAD'/);
assert.match(preflight, /response\.status === 404 \|\| response\.status === 410/);
assert.match(preflight, /new Set\(discs\)\.size !== discs\.length/);
assert.match(preflight, /Promise\.all\(targets\.map\(remoteExists\)\)/);
assert.match(preflight, /CACHE_TTL = 10 \* 60 \* 1000/);
assert.match(index, /id="profile-search"/);
assert.match(index, /applyProfileSearch/);
assert.match(index, /id="profile-diagnostic"/);
assert.match(index, /slot\.slot === 'previous'/);
assert.match(index, /normalizedSaveCatalogKey/);
assert.match(index, /const coverCandidates/);
assert.match(index, /withoutDisc/);

console.log('emulator preflight/profile search: 17 checks passed');
