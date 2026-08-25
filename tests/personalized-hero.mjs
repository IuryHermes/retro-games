import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(index, /refreshPersonalHero = async function/);
assert.match(index, /const recent = historyData\.games\?\.\[0\]/);
assert.match(index, /id = 'personalized-hero'/);
assert.match(index, /button\.innerHTML = '<span>▶<\/span> CONTINUE'/);
assert.match(index, /cloudRequest\('\/club\/library'\)/);
assert.match(index, /slot\.slot === 'auto'/);
assert.match(index, /SEU ÚLTIMO JOGO/);
assert.match(index, /Promise\.allSettled\(fetchPromises\)/);
assert.match(index, /recent\.cover \|\| catalogCover/);
assert.match(index, /showOnlyPlayedHeroes\(true\)/);
assert.match(index, /LOCAL_HISTORY_KEY = 'neo_local_game_history_v1'/);
assert.match(index, /LOCAL_SAVE_STARTED_KEY = 'neo_anonymous_save_started_at'/);
assert.match(index, /purgeExpiredAnonymousProgress/);
assert.match(index, /migrateLocalProgressToProfile/);
assert.match(index, /slot=manual-\$\{slot\}/);
assert.match(index, /hero-slide:not\(\[hidden\]\)/);
assert.match(index, /historyRequest\('POST', \{ id:recent\.id/);
assert.match(index, /window\.startGame\(recent\.playUrl\)/);
assert.match(index, /heroSlideCount\(\)/);
assert.match(index, /autosaveHeroImage\(recent\.id\)/);
assert.match(index, /URL\.createObjectURL\(await response\.blob\(\)\)/);
assert.match(index, /historyData\.games \|\| \[\]\)\.slice\(0, 3\)/);
assert.match(index, /savedFrames = await Promise\.all/);
assert.match(index, /RECENTE \$\{recentIndex \+ 1\} DE \$\{recentGames\.length\}/);
assert.match(index, /id = `personalized-hero-\$\{recentIndex\}`/);
assert.match(index, /id="hero-prev"/);
assert.match(index, /id="hero-next"/);
assert.doesNotMatch(index, /imagem da partida aparecerá aqui depois do próximo autosave/);

console.log('personalized hero: 28 checks passed');
