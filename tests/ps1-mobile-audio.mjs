import assert from 'node:assert/strict';
import fs from 'node:fs';

const player = fs.readFileSync(new URL('../player-universal.html', import.meta.url), 'utf8');
const profile = fs.readFileSync(new URL('../ps1-mobile-audio.js', import.meta.url), 'utf8');
const saves = fs.readFileSync(new URL('../cloud-saves.js', import.meta.url), 'utf8');

assert.match(player, /ps1-mobile-audio\.js\?v=1/);
assert.match(player, /mobilePs1AudioProfile[\s\S]*"vsync": true[\s\S]*"audio_latency": "128"/);
assert.match(profile, /audio_latency = 128/);
assert.match(profile, /video_vsync = true/);
assert.match(profile, /Android\|iPhone\|iPad\|iPod/);
assert.match(profile, /core === 'psx'/);
assert.match(saves, /MOBILE_PS1_PROFILE \? 3 \* 60000 : 60000/);
assert.match(saves, /MOBILE_PS1_PROFILE \? 30000 : 10000/);

console.log('PS1 mobile audio profile: 8 checks passed');
