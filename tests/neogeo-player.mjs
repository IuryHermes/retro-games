import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const player = await readFile(new URL('../player-universal.html', import.meta.url), 'utf8');
const preflight = await readFile(new URL('../emulator-preflight.js', import.meta.url), 'utf8');
const catalog = JSON.parse(await readFile(new URL('../systems/neogeo/games.json', import.meta.url), 'utf8'));

assert.match(preflight, /'fbneo'/);
assert.match(preflight, /fbneo:\s*\['zip'\]/);
assert.match(player, /window\.EJS_gameParentUrl\s*=\s*requestedBios/);
assert.match(player, /params\.get\('system'\)\s*===\s*'neogeo'/);
assert.match(player, /params\.get\('system'\) === 'neogeo' \? \{[\s\S]*"fbneo-neogeo-mode": "AES_EUR"/);
assert.match(player, /neo_fbneo_rom_cache_repair_v1/);
assert.match(player, /repairFbneoCache/);
assert.equal(catalog.length, 9);
assert.equal(catalog.filter(game => /fighters '96(?:\s|$)/i.test(game.nome)).length, 1);
assert.ok(catalog.every(game => /^roms\/kof.+\.zip\?v=(?:fbneo-standalone1|ptbr-v3)$/i.test(game.rom)));
const kof2002 = catalog.find(game => /fighters 2002$/i.test(game.nome));
assert.equal(kof2002?.rom, 'roms/kof2k2br.zip?v=ptbr-v3');
assert.match(kof2002?.descricao || '', /português/i);
assert.equal(catalog.find(game => /fighters '97$/i.test(game.nome))?.capa, 'kof97-user.webp');
assert.equal(catalog.find(game => /fighters 2001$/i.test(game.nome))?.capa, 'kof2001-user.jfif');
assert.equal(kof2002?.capa, 'kof2002-user.jfif');

console.log('Neo Geo player: FBNeo, parent BIOS, KOF 2002 PT-BR e 9 KOF únicos validados');
