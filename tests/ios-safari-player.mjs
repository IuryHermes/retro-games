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
assert.match(universal, /EJS_externalFiles = \{ \[ps1DiscPath\(ps1DiscUrls\[0\]\)\]: ps1DiscUrls\[0\] \}/, 'multi-disc PS1 games must preload only disc 1');
assert.match(universal, /params\.get\('discs'\)/, 'multi-disc metadata must come from the game route');
assert.match(universal, /manager\.FS\.writeFile/, 'the requested next disc must be loaded into the running emulator filesystem');
assert.match(universal, /manager\.setCurrentDisk\(index\)/, 'disc selection must use the emulator core without restarting the console');
assert.match(universal, /getCurrentDisk/, 'disc changes must be confirmed by the emulator core');
assert.match(universal, /window\.EJS_biosUrl = ''/, 'PS1 must use HLE instead of the invalid 4 MiB BIOS object');
assert.doesNotMatch(universal, /EJS_biosUrl = 'https:[^']+scph5501\.bin'/, 'the invalid renamed BIOS must never be loaded');
assert.match(universal, /getElementById\('game'\)\.appendChild\(panel\)/, 'disc controls must remain inside the emulator in fullscreen');

console.log('iOS Safari player: 15 checks passed');
