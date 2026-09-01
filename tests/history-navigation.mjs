import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const cloudSaves = await readFile(new URL('../cloud-saves.js', import.meta.url), 'utf8');

assert.match(index, /const PENDING_HISTORY_KEY = 'neo_pending_history'/);
assert.match(index, /sessionStorage\.setItem\(PENDING_HISTORY_KEY, JSON\.stringify\(pending\)\)/);
assert.match(index, /await historyRequest\('POST', pending\)/);
assert.match(cloudSaves, /async function flushPendingHistory\(\)/);
assert.match(cloudSaves, /fetch\(`\$\{API\}\/account\/history`/);
assert.match(cloudSaves, /await flushPendingHistory\(\);[\s\S]*?sessionInfo\(\)/);
assert.match(cloudSaves, /automaticChoice\(session\)/);
assert.match(cloudSaves, /automaticEnabled = false/);
assert.match(index, /SAVES NA NUVEM/);
assert.match(index, /\/club\/library/);
assert.match(index, /id="profile-logout"/);
assert.match(index, /function logoutAccount/);
assert.match(index, /const splashKey = 'neo_intro_seen_v1'/, 'a abertura deve aparecer uma vez por sessão');
assert.match(index, /sessionStorage\.getItem\(splashKey\)/, 'voltar não deve repetir a abertura');
assert.match(index, /window\.addEventListener\('pageshow',[\s\S]*overlay\.style\.display = 'none'/, 'voltar deve remover o overlay de inicialização');
assert.match(index, /aria-label="Fechar detalhes do jogo"/, 'detalhes do jogo devem ter botão de fechar acessível');
assert.match(index, /id="game-info-modal"[\s\S]*onclick="closeGameModal\(\)"/, 'tocar fora da capa deve fechar os detalhes');
assert.match(index, /#game-info-modal \.modal-content-box \{ height:min\(94dvh,760px\); max-height:94dvh; \}/, 'modal mobile deve permanecer dentro da tela');
assert.match(index, /#game-info-modal \.game-info-body \{[^}]*overflow-y:auto/, 'somente o conteúdo do modal deve rolar');
assert.match(index, /const compactDetails = matchMedia\('\(max-width:768px\), \(pointer:coarse\)'\)\.matches/);
assert.match(index, /if \(compactDetails\) descContainer\.innerHTML = escapeHTML\(fullText\)/, 'descrição mobile deve aparecer sem animação contínua');

console.log('history navigation/profile: 21 checks passed');
