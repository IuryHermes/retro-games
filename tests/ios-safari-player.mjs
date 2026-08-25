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
assert.match(universal, /EJS_controlScheme = controlSchemes/, 'each system must select its native virtual controller scheme');
assert.match(universal, /text:'△'[\s\S]*text:'□'[\s\S]*text:'○'[\s\S]*text:'×'/, 'PS1 must expose PlayStation face-button symbols');
assert.match(universal, /EJS_emulator\?\.menu\?\.close/, 'the gray EmulatorJS menu must close after automatic boot');
assert.match(universal, /window\.EJS_Buttons = \{ diskButton: \{ visible:/, 'the native disk menu must use the supported configuration name');
assert.doesNotMatch(universal, /window\.EJS_buttons\s*=/, 'the obsolete lowercase button option must not be used');
assert.match(universal, /button\.disabled = ps1DiscBusy \|\| index === current/, 'the inserted disc must not be selectable again');
assert.match(universal, /neo-active-emulator/, 'a new emulator tab must retire older memory-heavy instances');
assert.match(universal, /multidisc: ps1DiscUrls\.length > 1/, 'cloud saves must know when PS1 migrated away from M3U boot');

console.log('iOS Safari player: 23 checks passed');
