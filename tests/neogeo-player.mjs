import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const player = await readFile(new URL('../player-universal.html', import.meta.url), 'utf8');
const preflight = await readFile(new URL('../emulator-preflight.js', import.meta.url), 'utf8');
const catalog = JSON.parse(await readFile(new URL('../systems/neogeo/games.json', import.meta.url), 'utf8'));

assert.match(preflight, /'fbneo'/);
assert.match(preflight, /fbneo:\s*\['zip'\]/);
assert.match(player, /window\.EJS_externalFiles\s*=\s*\{[\s\S]*'\/neogeo\.zip': requestedBios/);
assert.doesNotMatch(player, /window\.EJS_gameParentUrl\s*=\s*requestedBios/);
assert.match(player, /params\.get\('system'\)\s*===\s*'neogeo'/);
assert.match(player, /params\.get\('system'\) === 'neogeo' \? \{[\s\S]*"fbneo-neogeo-mode": "MVS_EUR"/);
assert.match(player, /neoGeoPortuguesePresetGames = new Set\(\['kof95', 'kof96', 'kof97', 'kof99', 'kof2000', 'kof2001'\]\)/);
assert.match(player, /saveDatabaseLoaded/);
assert.match(player, /\/data\/saves\/\$\{neoGeoPortugueseGame\}\.srm/);
assert.match(player, /neo_fbneo_rom_cache_repair_v1/);
assert.match(player, /repairFbneoCache/);
assert.equal(catalog.length, 0, 'KOF deve ficar fora do catálogo durante a estabilização');

console.log('Neo Geo player preservado e catálogo KOF em quarentena');
