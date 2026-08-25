import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const games = JSON.parse(await readFile('systems/atari2600/games.json', 'utf8'));
assert.ok(games.length >= 100 && games.length <= 200, `expected 100-200 Atari games, received ${games.length}`);
assert.equal(new Set(games.map(game => game.rom)).size, games.length, 'Atari ROM entries must be unique');
for (const game of games) {
  assert.match(game.rom, /^roms\/[a-z0-9-]+\.bin$/);
  assert.match(game.capa, /^[a-z0-9-]+\.png$/);
  assert.match(game.preview, /^[a-z0-9-]+\.gif$/);
  await Promise.all([
    access(`systems/atari2600/${game.rom}`),
    access(`systems/atari2600/capas/${game.capa}`),
    access(`systems/atari2600/previews/${game.preview}`)
  ]);
}
const [index, player, preflight, worker] = await Promise.all([
  readFile('index.html', 'utf8'), readFile('player-universal.html', 'utf8'),
  readFile('emulator-preflight.js', 'utf8'), readFile('worker/src/index.js', 'utf8')
]);
assert.match(index, /atari2600': 'atari2600'/);
assert.match(index, /ATARI 2600/);
assert.match(player, /atari2600:'atari2600'/);
assert.match(preflight, /atari2600: \['a26', 'bin', 'zip'\]/);
assert.match(worker, /ps1\|atari2600/);
console.log(`validated ${games.length} Atari 2600 catalog entries`);
