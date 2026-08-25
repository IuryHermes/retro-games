import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const games = JSON.parse(await readFile('systems/gba/games.json', 'utf8'));
const byRom = new Map(games.map(game => [game.rom, game]));
assert.equal(games.some(game => /\(Inglês\)/i.test(game.nome)), false, 'GBA must not expose English duplicate labels');
for (const rom of [
  'roms/final-fantasy-i-ii-dawn-of-souls.gba', 'roms/lady-sia.gba', 'roms/pokemon-fire-red-version.gba',
  'roms/spongebob-squarepants-supersponge.gba', 'roms/the-legend-of-zelda-the-minish-cap.gba'
]) assert.equal(byRom.has(rom), false, `English duplicate must be removed: ${rom}`);
const expected = {
  'roms/crash-bandicoot-2-n-tranced.gba': ['Crash Bandicoot 2: N-Tranced', 'crash-bandicoot-2-n-tranced'],
  'roms/donkey-kong-country.gba': ['Donkey Kong Country', 'donkey-kong-country'],
  'roms/donkey-kong-country-3.gba': ["Donkey Kong Country 3: Dixie Kong's Double Trouble!", 'donkey-kong-country-3'],
  'roms/final-fantasy-vi-advance.gba': ['Final Fantasy VI Advance', 'final-fantasy-vi-advance'],
  'roms/gekido-advance-kintaro-s-revenge.gba': ["Gekido Advance: Kintaro's Revenge", 'gekido-kintaros-revenge'],
  'roms/grand-theft-auto-advance.gba': ['Grand Theft Auto Advance', 'grand-theft-auto-advance'],
  'roms/harvest-moon-friends-of-mineral-town.gba': ['Harvest Moon: Friends Of Mineral Town', 'harvest-moon-friends'],
  'roms/harvest-moon-mfomt.gba': ['Harvest Moon: More Friends of Mineral Town', 'harvest-moon-more-friends'],
  'roms/need-for-speed-most-wanted.gba': ['Need For Speed: Most Wanted', 'need-for-speed-most-wanted'],
  'roms/pokemon-my-ass.gba': ['Pokémon My Ass', 'pokemon-my-ass'],
  'roms/pokemon-new-hoenn.gba': ['Pokémon New Hoenn', 'pokemon-new-hoenn'],
  'roms/pokemon-ruby.gba': ['Pokémon Ruby Version', 'pokemon-ruby'],
  'roms/super-mario-advance-2-super-mario-world.gba': ['Super Mario Advance 2: Super Mario World', 'super-mario-advance-2'],
  'roms/yu-yu-hakusho-ghostfiles-spirit-detective.gba': ['Yu Yu Hakusho: Ghostfiles - Spirit Detective', 'yu-yu-hakusho-spirit-detective'],
  'roms/yu-yu-hakusho-ghostfiles-tournament-tactics.gba': ['Yu Yu Hakusho: Ghostfiles - Tournament Tactics', 'yu-yu-hakusho-tournament-tactics'],
};

for (const [rom, [name, media]] of Object.entries(expected)) {
  const game = byRom.get(rom);
  assert.ok(game, `missing ${rom}`);
  assert.equal(game.nome, name, `${rom} has the wrong identity`);
  if (media.startsWith('pokemon-') && /my-ass|new-hoenn/.test(media)) continue;
  assert.equal(game.capa, `${media}.png`, `${name} has the wrong cover`);
  assert.equal(game.preview, `${media}.gif`, `${name} has the wrong preview`);
}

const duplicateNames = [...new Set(games.map(game => game.nome).filter((name, index, names) => names.indexOf(name) !== index))];
assert.deepEqual(duplicateNames, [], `unlabeled GBA variants: ${duplicateNames.join(', ')}`);
console.log(`GBA media/variants: ${Object.keys(expected).length} targeted games and ${games.length} unique labels verified.`);
