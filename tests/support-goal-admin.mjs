import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [admin, club, worker] = await Promise.all([
  readFile(new URL('../ops/admin-console/public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../apoie.html', import.meta.url), 'utf8'),
  readFile(new URL('../worker/src/index.js', import.meta.url), 'utf8')
]);

assert.match(admin, /'Meta mensal'/);
assert.match(admin, /support-goal-get/);
assert.match(admin, /support-goal-set/);
assert.match(admin, /support-goal-clear/);
assert.match(admin, /VOLTAR AO AUTOMÁTICO/);
assert.match(worker, /support\/goals\/\$\{month\}\.json/);
assert.match(worker, /goal >= 1|goal < 1/);
assert.match(worker, /await audit\(action, month/);
assert.match(club, /!goal\.automatic/);
assert.match(club, /Meta definida para este mês pela administração/);
assert.match(admin, /'Resultados'/);
assert.match(admin, /support-achievement-upsert/);
assert.match(admin, /support-achievement-delete/);
assert.match(worker, /support\/achievements\//);
assert.match(club, /O que a comunidade tornou possível/);
assert.match(club, /results-grid/);

console.log('support goal and results admin: 16 checks passed');
