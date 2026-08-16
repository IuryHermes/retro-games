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

console.log('history navigation retry: 6 checks passed');
