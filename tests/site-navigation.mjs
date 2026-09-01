import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, normalize, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const mainPages = ['index.html','coletaneas.html','ofertas.html','social.html','apoie.html','multiplayer-room.html','player-universal.html','politica-de-privacidade.html','politica-de-cookies.html','emulator-closed.html'];
await Promise.all(mainPages.map(page => access(join(root, page))));

async function gamePages(directory) {
  const found = [];
  for (const system of await readdir(directory, { withFileTypes:true })) {
    if (!system.isDirectory()) continue;
    for (const game of await readdir(join(directory, system.name), { withFileTypes:true })) {
      if (game.isDirectory()) found.push(join(directory, system.name, game.name, 'index.html'));
    }
  }
  return found;
}

const pages = [...mainPages.map(page => join(root, page)), ...await gamePages(join(root, 'jogos'))];
const missing = [];
let multiplayerLandings = 0;
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  if (/JOGAR ONLINE <small>[^<]*CADASTRO GRÁTIS/.test(html)) multiplayerLandings += 1;
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const raw = match[1];
    if (!raw || /^(?:https?:|mailto:|#|javascript:|\$\{)/.test(raw)) continue;
    const clean = raw.split(/[?#]/)[0];
    if (!clean || /\.(?:css|gif|png|jpg|jpeg|webp|svg|ico)$/i.test(clean)) continue;
    let target = clean.startsWith('/') ? join(root, clean.slice(1)) : normalize(join(dirname(file), clean));
    if (clean.endsWith('/')) target = join(target, 'index.html');
    else if (!/\.[a-z0-9]+$/i.test(clean)) target = join(target, 'index.html');
    try { await access(target); } catch { missing.push(`${relative(root,file)} -> ${raw}`); }
  }
}

assert.deepEqual(missing, [], `links internos sem destino:\n${missing.join('\n')}`);
assert.ok(multiplayerLandings > 1100, `poucas páginas oferecem sala online: ${multiplayerLandings}`);
const home = await readFile(join(root, 'index.html'), 'utf8');
assert.match(home, /Jogos locais continuam livres, sem cadastro/);
assert.match(home, /neo_multiplayer_resume/);
assert.match(home, /authParams\.get\('multiplayer'\) === '1'/);
console.log(`navegação completa: ${pages.length} páginas, ${multiplayerLandings} entradas multiplayer e nenhum destino interno ausente`);
