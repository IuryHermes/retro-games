import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const player = await readFile(new URL('../player-universal.html', import.meta.url), 'utf8');
const preflight = await readFile(new URL('../emulator-preflight.js', import.meta.url), 'utf8');
const catalog = JSON.parse(await readFile(new URL('../systems/neogeo/games.json', import.meta.url), 'utf8'));

assert.match(preflight, /'fbneo'/);
assert.match(preflight, /fbneo:\s*\['zip'\]/);
assert.match(player, /window\.EJS_gameParentUrl\s*=\s*requestedBios/);
assert.match(player, /params\.get\('system'\)\s*===\s*'neogeo'/);
assert.match(player, /neo_fbneo_rom_cache_repair_v1/);
assert.match(player, /repairFbneoCache/);
assert.equal(catalog.length, 10);
assert.ok(catalog.every(game => /^roms\/kof.+\.zip\?v=fbneo-standalone1$/i.test(game.rom)));

console.log('Neo Geo player: FBNeo, parent BIOS and 10 KOF entries validated');
