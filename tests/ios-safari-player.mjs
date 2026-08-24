import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const [home, universal, legacyPs1] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../player-universal.html', import.meta.url), 'utf8'),
  readFile(new URL('../player-ps1.html', import.meta.url), 'utf8')
]);

assert.equal(home.includes("? 'player-ps1.html' : 'player-universal.html'"), false, 'catalog must not route PS1 to the legacy threaded player');
assert.match(legacyPs1, /location\.replace\(`player-universal\.html/, 'old PS1 links must redirect to the compatible player');
assert.match(universal, /EJS_threads = core === 'n64'[\s\S]*crossOriginIsolated[\s\S]*SharedArrayBuffer/, 'threads must require browser isolation support');
assert.match(universal, /Promise\.race\(\[/, 'cloud startup must have a timeout');
assert.match(universal, /loaderScript\.onerror/, 'loader download failures must be visible');
assert.match(universal, /id="compat-error"/, 'player must provide a visible compatibility error');
assert.match(universal, /name="viewport"/, 'player must set the mobile viewport');
assert.match(universal, /EJS_externalFiles/, 'multi-disc PS1 games must preload their CHD files into the emulator filesystem');
assert.match(universal, /params\.get\('discs'\)/, 'multi-disc metadata must come from the game route');

console.log('iOS Safari player: 9 checks passed');
