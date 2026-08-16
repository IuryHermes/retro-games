import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = ['index.html', 'apoie.html', 'antecipado.html', 'social.html', 'multiplayer-room.html', 'player-universal.html', 'player-ps1.html'];
const consent = await readFile(new URL('../privacy-consent.js', import.meta.url), 'utf8');
const privacy = await readFile(new URL('../politica-de-privacidade.html', import.meta.url), 'utf8');
const cookies = await readFile(new URL('../politica-de-cookies.html', import.meta.url), 'utf8');

for (const page of pages) assert.match(await readFile(new URL(`../${page}`, import.meta.url), 'utf8'), /privacy-consent\.js/);
assert.match(consent, /neo_privacy_consent_v1/);
assert.match(consent, /analytics: false, marketing: false/);
assert.match(consent, /Somente necessários/);
assert.match(consent, /Aceitar opcionais/);
assert.match(consent, /Salvar preferências/);
assert.match(consent, /neo:consent-changed/);
assert.match(privacy, /Direitos do titular/);
assert.match(privacy, /Crianças e adolescentes/);
assert.match(cookies, /IndexedDB/);
assert.match(cookies, /Atualmente não existe ferramenta de analytics ativa/);

console.log(`privacy consent: ${pages.length + 10} checks passed`);
