import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(index, /refreshPersonalHero = async function/);
assert.match(index, /const recent = historyData\.games\?\.\[0\]/);
assert.match(index, /id = 'personalized-hero'/);
assert.match(index, /button\.innerHTML = '<span>▶<\/span> CONTINUAR'/);
assert.match(index, /SEU ÚLTIMO JOGO/);
assert.match(index, /Promise\.allSettled\(fetchPromises\)/);
assert.match(index, /recent\.cover \|\| catalogCover/);
assert.match(index, /assets\/wallpapers_hero\/\$\{featured\.id\}\.jpg/);
assert.match(index, /historyRequest\('POST', \{ id:recent\.id/);
assert.match(index, /window\.startGame\(recent\.playUrl\)/);
assert.match(index, /heroSlideCount\(\)/);
assert.match(index, /autosaveHeroImage\(recent\.id\)/);
assert.match(index, /URL\.createObjectURL\(await response\.blob\(\)\)/);

console.log('personalized hero: 13 checks passed');
