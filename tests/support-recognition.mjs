import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [home, club, worker] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../apoie.html', import.meta.url), 'utf8'),
  readFile(new URL('../worker/src/index.js', import.meta.url), 'utf8')
]);
const [social, socialScript, badgeScript, badgeStyle] = await Promise.all([
  readFile(new URL('../social.html', import.meta.url), 'utf8'),
  readFile(new URL('../social.js', import.meta.url), 'utf8'),
  readFile(new URL('../club-badges.js', import.meta.url), 'utf8'),
  readFile(new URL('../club-badges.css', import.meta.url), 'utf8')
]);

assert.match(home, /Discord para receber também cargo e canais/);
assert.match(home, /sup-show-hall/);
assert.match(home, /sup-show-value/);
assert.match(home, /Authorization:`Bearer \$\{accountToken\}`/);
assert.match(home, /recognition\.badges/);
assert.match(club, /O Discord é opcional/);
assert.match(worker, /accountUid:account\.uid/);
assert.match(worker, /activeSupportPlan/);
assert.match(worker, /FUNDADOR/);
assert.match(worker, /record\.discordId \? "falha_ao_liberar" : "nao_conectado"/);
assert.match(club, /support-thanks-title/);
assert.match(club, /loadSupportThanks/);
assert.match(club, /session\.plan==='registered'/);
assert.match(club, /setTimeout\(\(\)=>void loadSupportThanks/);
assert.match(club, /support-thanks-badges/);
assert.match(club, /support-last-game/);
assert.match(club, /support-share/);
assert.match(club, /hall\.supportGoal\.percentage/);
assert.match(club, /pagamento pode estar aprovado/);
assert.match(club, /\['aprovado','pendente','falhou'\]\.includes/);
assert.match(worker, /recognition: applyBadgeGrants\(recognitionFor\(candidate\.uid\), candidate\.badgeGrants\)/);
assert.match(worker, /recognition: applyBadgeGrants\(recognitionFor\(account\.uid\), profile\.badgeGrants\)/);
assert.match(worker, /badge-grants-update/);
assert.match(worker, /applyBadgeGrants/);
assert.match(worker, /uid: account\.uid, nome: name, avatar/);
assert.match(home, /NeoClubBadges\.avatar/);
assert.match(home, /profile-badges-tab/);
assert.match(home, /loadBadgeCollection/);
assert.match(home, /progressNow \/ progressMax/);
assert.match(home, /7 SELOS VIS/);
assert.match(club, /NeoClubBadges\.create/);
assert.match(social, /club-badges\.css/);
assert.match(socialScript, /avatarWithBadges/);
assert.match(socialScript, /refreshGlobalMessageBadges/);
assert.match(badgeScript, /GUARDIÃO/);
assert.match(badgeStyle, /club-badges-v2\.png/);

console.log('account-native visual support recognition: 36 checks passed');
