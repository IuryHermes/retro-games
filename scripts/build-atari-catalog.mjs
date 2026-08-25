import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1');
const romRoot = process.argv[2] || 'C:\\Users\\vndx404\\Desktop\\atari';
const thumbRoot = process.argv[3] || 'C:\\IA\\atari-thumbnails';
const out = join(root, '.atari-staging');
const system = join(root, 'systems', 'atari2600');

// Seleção editorial: clássicos conhecidos, sem protótipos, hacks ou duplicatas PAL.
const wanted = `
Adventure|Adventure
Air-Sea Battle|Air-Sea Battle
Alien|Alien
Amidar|Amidar
Armor Ambush|Armor Ambush
Asteroids|Asteroids
Atlantis|Atlantis
Barnstorming|Barnstorming
Battlezone|Battlezone
Beamrider|Beamrider
Berzerk|Berzerk
Blackjack|Blackjack
Blueprint|Blueprint
Bowling|Bowling
Boxing|Boxing
Breakout|Breakout
Bridge|Bridge
Buck Rogers - Planet of Zoom|Buck Rogers
Bump 'n' Jump|Bump 'n' Jump
Burgertime|BurgerTime
California Games|California Games
Canyon Bomber|Canyon Bomber
Carnival|Carnival
Centipede|Centipede
Chopper Command|Chopper Command
Circus Atari|Circus Atari
Combat|Combat
Commando|Commando
Cosmic Ark|Cosmic Ark
Crackpots|Crackpots
Crystal Castles|Crystal Castles
Dark Cavern|Dark Cavern
Defender|Defender
Defender II|Defender II
Demon Attack|Demon Attack
Demons to Diamonds|Demons to Diamonds
Desert Falcon|Desert Falcon
Dig Dug|Dig Dug
Dodge 'Em|Dodge 'Em
Donkey Kong|Donkey Kong
Donkey Kong Junior|Donkey Kong Junior
Double Dragon|Double Dragon
Dragonfire|Dragonfire
Dragster|Dragster
Enduro|Enduro
E.T. - The Extra-Terrestrial|E.T. - The Extra-Terrestrial
Fathom|Fathom
Fast Food|Fast Food
Fatal Run|Fatal Run
Fishing Derby|Fishing Derby
Football|Football
Freeway|Freeway
Frogger|Frogger
Frogger II - ThreeeDeep!|Frogger II
Front Line|Front Line
Frostbite|Frostbite
Galaxian|Galaxian
Golf|Golf
Gorf|Gorf
Gravitar|Gravitar
H.E.R.O.|H.E.R.O.
Haunted House|Haunted House
Home Run|Home Run
Ice Hockey|Ice Hockey
Ikari Warriors|Ikari Warriors
Indy 500|Indy 500
Joust|Joust
Jungle Hunt|Jungle Hunt
Kaboom!|Kaboom!
Kangaroo|Kangaroo
Keystone Kapers|Keystone Kapers
King Kong|King Kong
Klax|Klax
Kung-Fu Master|Kung-Fu Master
Laser Blast|Laser Blast
Lock 'n' Chase|Lock 'n' Chase
Mario Bros.|Mario Bros.
Maze Craze|Maze Craze
Megamania|Megamania
Midnight Magic|Midnight Magic
Millipede|Millipede
Miner 2049er|Miner 2049er
Missile Command|Missile Command
Montezuma's Revenge|Montezuma's Revenge
Moon Patrol|Moon Patrol
Mouse Trap|Mouse Trap
Ms. Pac-Man|Ms. Pac-Man
Night Driver|Night Driver
Oink!|Oink!
Omega Race|Omega Race
Outlaw|Outlaw
Pac-Man|Pac-Man
Phoenix|Phoenix
Pitfall!|Pitfall!
Pitfall II - Lost Caverns|Pitfall II
Pole Position|Pole Position
Popeye|Popeye
Pressure Cooker|Pressure Cooker
Q*bert|Q_bert
Q*bert's Qubes|Q_bert's Qubes
Raiders of the Lost Ark|Raiders of the Lost Ark
Reactor|Reactor
RealSports Baseball|RealSports Baseball
RealSports Boxing|RealSports Boxing
RealSports Football|RealSports Football
RealSports Soccer|RealSports Soccer
RealSports Tennis|RealSports Tennis
River Raid|River Raid
River Raid II|River Raid II
Robot Tank|Robot Tank
Seaquest|Seaquest
Secret Quest|Secret Quest
Skiing|Skiing
Sky Diver|Sky Diver
Sky Jinks|Sky Jinks
Solar Fox|Solar Fox
Solaris|Solaris
Space Attack|Space Attack
Space Invaders|Space Invaders
Space Shuttle|Space Shuttle
Spider Fighter|Spider Fighter
Spider-Man|Spider-Man
Stampede|Stampede
Star Raiders|Star Raiders
Star Wars - The Arcade Game|Star Wars - The Arcade Game
Star Wars - The Empire Strikes Back|Star Wars - The Empire Strikes Back
Starmaster|Starmaster
Strategy X|Strategy X
Street Racer|Street Racer
Super Breakout|Super Breakout
Super Cobra|Super Cobra
Superman|Superman
Surround|Surround
SwordQuest - EarthWorld|SwordQuest - EarthWorld
SwordQuest - FireWorld|SwordQuest - FireWorld
Tapper|Tapper
Tennis|Tennis
Track & Field|Track & Field
Turmoil|Turmoil
Tutankham|Tutankham
Vanguard|Vanguard
Video Checkers|Video Checkers
Video Chess|Video Chess
Video Olympics|Video Olympics
Warlords|Warlords
Wizard of Wor|Wizard of Wor
Yars' Revenge|Yars' Revenge
Zaxxon|Zaxxon
`.trim().split('\n').map(line => line.split('|'));

const walk = async dir => {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes:true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(path)); else found.push(path);
  }
  return found;
};
const norm = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_*]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = value => norm(value).replace(/ /g, '-');
const roms = (await walk(romRoot)).filter(file => extname(file).toLowerCase() === '.bin');
const boxes = (await readdir(join(thumbRoot, 'Named_Boxarts'))).filter(name => name.endsWith('.png'));
const snaps = (await readdir(join(thumbRoot, 'Named_Snaps'))).filter(name => name.endsWith('.png'));

const scoreRom = (file, query) => {
  const name = basename(file, '.bin');
  const n = norm(name); const q = norm(query);
  if (!(n === q || n.startsWith(`${q} `))) return -999;
  let score = n === q ? 100 : 50;
  if (/\(usa\)|~\.bin$/i.test(file)) score += 20;
  if (/pal|secam|prototype|hack|beta|demo|fixed|unknown|32 in 1/i.test(name)) score -= 80;
  if (/HC ROMS/i.test(file)) score += 4;
  return score - name.length / 1000;
};
const pickRom = query => roms.map(file => [scoreRom(file, query), file]).sort((a,b) => b[0]-a[0])[0];
const pickImage = (files, query) => {
  const q = norm(query);
  return files.map(name => {
    const stem = norm(basename(name, '.png'));
    let score = stem === q ? 100 : stem.startsWith(`${q} `) ? 60 : -999;
    if (/\(usa\)/i.test(name)) score += 20;
    if (/pal|prototype|hack|beta|demo/i.test(name)) score -= 50;
    return [score - name.length/1000, name];
  }).sort((a,b) => b[0]-a[0])[0];
};

await mkdir(join(out, 'roms'), { recursive:true });
await mkdir(join(out, 'capas'), { recursive:true });
await mkdir(join(out, 'previews'), { recursive:true });
await mkdir(system, { recursive:true });
const games = []; const missing = [];
for (const [title, lookup] of wanted) {
  const rom = pickRom(lookup); const box = pickImage(boxes, title); const snap = pickImage(snaps, title);
  if (!rom || rom[0] < 0 || !box || box[0] < 0 || !snap || snap[0] < 0) { missing.push({ title, rom:rom?.[0], box:box?.[0], snap:snap?.[0] }); continue; }
  const id = slug(title); const romName = `${id}.bin`; const coverName = `${id}.png`; const previewName = `${id}.gif`;
  await copyFile(rom[1], join(out, 'roms', romName));
  await copyFile(join(thumbRoot, 'Named_Boxarts', box[1]), join(out, 'capas', coverName));
  const png = await readFile(join(thumbRoot, 'Named_Snaps', snap[1]));
  await writeFile(join(out, 'previews', `${id}.png`), png);
  games.push({ nome:title, rom:`roms/${romName}`, capa:coverName, preview:previewName, nota:'8.0', descricao:`Jogue ${title} online no Atari 2600 com salvamento automático no NeoTerminalRoom.` });
}
await writeFile(join(system, 'games.json'), `${JSON.stringify(games, null, 2)}\n`);
await writeFile(join(out, 'report.json'), `${JSON.stringify({ selected:games.length, missing }, null, 2)}\n`);
console.log(JSON.stringify({ selected:games.length, missing:missing.length, out }, null, 2));
