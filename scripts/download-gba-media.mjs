import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1');
const output = join(root, '.gba-media-staging');
const sourceRoot = 'https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Game_Boy_Advance/master';

const games = [
  ['crash-bandicoot-2-n-tranced', 'Crash Bandicoot 2 - N-Tranced (USA)'],
  ['donkey-kong-country', 'Donkey Kong Country (USA)'],
  ['donkey-kong-country-3', 'Donkey Kong Country 3 (USA)'],
  ['final-fantasy-1-2', 'Final Fantasy I _ II - Dawn of Souls (USA)'],
  ['final-fantasy-vi-advance', 'Final Fantasy VI Advance (USA)'],
  ['gekido-kintaros-revenge', "Gekido Advance - Kintaro's Revenge (USA)"],
  ['grand-theft-auto-advance', 'Grand Theft Auto Advance (USA)'],
  ['harvest-moon-friends', 'Harvest Moon - Friends of Mineral Town (USA)'],
  ['harvest-moon-more-friends', 'Harvest Moon - More Friends of Mineral Town (USA)'],
  ['need-for-speed-most-wanted', 'Need for Speed - Most Wanted (USA, Europe) (En,Fr,De,It)'],
  ['pokemon-fire-red', 'Pokemon - FireRed Version (USA, Europe)'],
  ['pokemon-ruby', 'Pokemon - Ruby Version (USA, Europe)'],
  ['super-mario-advance-2', 'Super Mario Advance 2 - Super Mario World (USA, Australia)'],
  ['zelda-minish-cap', 'Legend of Zelda, The - The Minish Cap (USA)'],
  ['yu-yu-hakusho-spirit-detective', 'Yu Yu Hakusho - Ghostfiles - Spirit Detective (USA)'],
  ['yu-yu-hakusho-tournament-tactics', 'Yu Yu Hakusho - Ghostfiles - Tournament Tactics (USA, Europe)'],
  ['spongebob-attack-of-the-toybots', 'SpongeBob and Friends - Attack of the Toybots (Europe) (En,De)'],
  ['spongebob-supersponge', 'SpongeBob SquarePants - SuperSponge (USA, Europe)'],
];

const urlFor = (directory, title) => `${sourceRoot}/${directory}/${encodeURIComponent(`${title}.png`)}`;
const download = async (url, destination) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`Arquivo suspeito (${bytes.length} bytes): ${url}`);
  await writeFile(destination, bytes);
};

await mkdir(join(output, 'capas'), { recursive: true });
await mkdir(join(output, 'previews'), { recursive: true });
for (const [slug, title] of games) {
  await download(urlFor('Named_Boxarts', title), join(output, 'capas', `${slug}.png`));
  await download(urlFor('Named_Snaps', title), join(output, 'previews', `${slug}.png`));
  process.stdout.write(`OK ${slug}\n`);
}
