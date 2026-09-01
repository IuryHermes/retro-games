import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const metadataFile = process.argv[2] || 'C:/IA/launchbox-metadata/Metadata.xml';
const platforms = {
  atari2600:new Set(['Atari 2600']),
  nes:new Set(['Nintendo Entertainment System']),
  snes:new Set(['Super Nintendo Entertainment System']),
  n64:new Set(['Nintendo 64']),
  gba:new Set(['Nintendo Game Boy Advance']),
  megadrive:new Set(['Sega Genesis']),
  ps1:new Set(['Sony Playstation']),
  neogeo:new Set(['SNK Neo Geo AES','SNK Neo Geo MVS'])
};
const platformToSystem = new Map(Object.entries(platforms).flatMap(([system,names]) => [...names].map(name => [name,system])));
const lookup = new Map(Object.keys(platforms).map(system => [system,new Map()]));

const decode = value => value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const field = (xml, name) => decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]?.trim() || '');
const normalize = value => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[™®©]/g,'').replace(/\b(?:the|a)\b/gi,' ')
  .replace(/\biiiii\b/gi,'5').replace(/\biv\b/gi,'4').replace(/\biii\b/gi,'3').replace(/\bii\b/gi,'2')
  .replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();

let buffer = '';
for await (const chunk of createReadStream(metadataFile, { encoding:'utf8', highWaterMark:1024*1024 })) {
  buffer += chunk;
  let end;
  while ((end = buffer.indexOf('</Game>')) >= 0) {
    const start = buffer.lastIndexOf('<Game>', end);
    const game = start >= 0 ? buffer.slice(start, end + 7) : '';
    buffer = buffer.slice(end + 7);
    if (!game) continue;
    const system = platformToSystem.get(field(game,'Platform'));
    if (!system) continue;
    const name = normalize(field(game,'Name'));
    const maxPlayers = Number.parseInt(field(game,'MaxPlayers'),10) || 0;
    const cooperative = field(game,'Cooperative').toLowerCase() === 'true';
    if (!name || (maxPlayers < 2 && !cooperative)) continue;
    const players = Math.max(2, maxPlayers || 2);
    lookup.get(system).set(name, Math.max(players, lookup.get(system).get(name) || 0));
  }
  if (buffer.length > 4*1024*1024) buffer = buffer.slice(-2*1024*1024);
}

let total = 0;
for (const system of Object.keys(platforms)) {
  const file = join(root,'systems',system,'games.json');
  const games = JSON.parse(await readFile(file,'utf8'));
  let matched = 0;
  for (const game of games) {
    const players = lookup.get(system).get(normalize(game.nome));
    if (players > 1) {
      game.multiplayer = true;
      game.maxPlayers = players;
      matched += 1;
    } else {
      delete game.multiplayer;
      delete game.maxPlayers;
    }
  }
  await writeFile(file, `${JSON.stringify(games,null,2)}\n`);
  total += matched;
  console.log(`${system}: ${matched}/${games.length}`);
}
console.log(`total multiplayer confirmado pelo LaunchBox: ${total}`);
