import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const player = await readFile(new URL('../player-universal.html', import.meta.url), 'utf8');
const cloudSaves = await readFile(new URL('../cloud-saves.js', import.meta.url), 'utf8');

assert.match(player, /src="coi-serviceworker\.js"/);
const coiWorker = await readFile(new URL('../coi-serviceworker.js', import.meta.url), 'utf8');
assert.match(coiWorker, /scope: "\/player-universal\.html"/);
assert.match(player, /window\.crossOriginIsolated/);
assert.match(player, /typeof window\.SharedArrayBuffer === 'function'/);
assert.doesNotMatch(player, /localStorage\.removeItem\(key\)/);
assert.match(cloudSaves, /const INTERVAL_MS = 60000/);
assert.match(cloudSaves, /setInterval\(scheduleAutosave, INTERVAL_MS\)/);
assert.match(cloudSaves, /requestIdleCallback\(run, \{ timeout: 4000 \}\)/);
assert.match(cloudSaves, /autosavePending/);
assert.match(cloudSaves, /document\.visibilityState === 'hidden'/);

console.log('n64 performance/autosave: 10 checks passed');
