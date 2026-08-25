import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const games = JSON.parse(await readFile(new URL('../systems/ps1/games.json', import.meta.url), 'utf8'));
const multidisc = games.filter(game => /\.m3u$/i.test(game.rom));

if (multidisc.length < 15) throw new Error(`expected at least 15 multidisc collections, found ${multidisc.length}`);
for (const game of multidisc) {
  if (!Array.isArray(game.discs) || game.discs.length < 2) throw new Error(`${game.nome} has no ordered disc list`);
  const playlistPath = new URL(`../ops/ps1-playlists/${basename(game.rom)}`, import.meta.url);
  const lines = (await readFile(playlistPath, 'utf8')).trim().split(/\r?\n/);
  const expected = game.discs.map((disc, index) => `/${basename(disc)}|Disco ${index + 1}`);
  if (lines.join('\n') !== expected.join('\n')) throw new Error(`${game.nome} playlist differs from catalog metadata`);
}

console.log(`PS1 multidisc: ${multidisc.length} collections validated`);
