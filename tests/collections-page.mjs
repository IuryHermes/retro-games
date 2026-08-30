import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';

const root = join(import.meta.dirname, '..');
const html = await readFile(join(root, 'coletaneas.html'), 'utf8');
const start = html.lastIndexOf('<script>') + '<script>'.length;
const end = html.lastIndexOf('</script>');
if (start < '<script>'.length || end <= start) throw new Error('script principal ausente');
new vm.Script(html.slice(start, end));

const definitions = [
  /\b(the king of fighters|kof)\b/i,
  /\b(mario|yoshi|luigi|wario)\b/i,
  /\b(zelda|ocarina of time|majora.?s mask)\b/i,
  /\bmetal gear\b/i,
  /\bsonic\b/i,
  /\bfinal fantasy\b/i
];
const systems = ['nes', 'snes', 'n64', 'gba', 'megadrive', 'ps1', 'atari2600', 'neogeo'];
const games = (await Promise.all(systems.map(async system => {
  const data = JSON.parse(await readFile(join(root, 'systems', system, 'games.json'), 'utf8'));
  return data.map(game => ({ ...game, system }));
}))).flat();
const counts = definitions.map(pattern => games.filter(game => pattern.test(String(game.nome || ''))).length);
if (counts.some(count => count === 0)) throw new Error(`coletânea vazia inesperada: ${counts.join(',')}`);

await access(join(root, 'assets', 'imagens-videos', 'imagens do menu', 'coletaneas.svg'));
if (counts[0] !== 10 || !html.includes('The King of Fighters')) throw new Error(`coletânea KOF incompleta: ${counts[0]}`);
if (!html.includes('filterCollection') || !html.includes('location.hash')) throw new Error('filtro por coletânea ausente');
console.log(`coletâneas validadas; jogos por série: ${counts.join(', ')}`);
