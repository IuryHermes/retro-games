import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const html = await readFile(join(root, 'index.html'), 'utf8');
const controller = await readFile(join(root, 'collections-home.js'), 'utf8');
const moduleStart = html.indexOf('<script type="module">') + '<script type="module">'.length;
const moduleEnd = html.indexOf('</script>', moduleStart);
if (moduleStart < '<script type="module">'.length || moduleEnd < moduleStart) throw new Error('script principal ausente');
const source = html.slice(moduleStart, moduleEnd).replace(/^\s*import\s+.*?;\s*$/gm, '');
new Function(source);
new Function(controller);

for (const marker of ['id="collections-row"', 'id="collections-show-all"', 'id="collections-expanded"', 'collections-home.js', '>VER TODOS</button>']) {
  if (!html.includes(marker)) throw new Error(`interação de coletâneas ausente: ${marker}`);
}
if (!/\.collection-tile \{[^}]*flex:0 0 clamp\(180px,19vw,260px\)/.test(html)) throw new Error('coletâneas ainda estão desproporcionais no desktop');
if (!/flex-basis:clamp\(112px,31vw,132px\)/.test(html)) throw new Error('coletâneas ainda estão gigantes no celular');
for (const marker of ['mortal-kombat', 'mega-man', 'showAll.onclick', 'row.onpointermove', 'panel.scrollIntoView']) {
  if (!controller.includes(marker)) throw new Error(`controlador de coletâneas incompleto: ${marker}`);
}
for (const marker of ["event.pointerType === 'touch'", 'touch-action:pan-y', '-webkit-overflow-scrolling:touch', "addEventListener('touchmove'", 'passive:false', 'pressedTile', 'v=20260901-9']) {
  if (!(controller + html).includes(marker)) throw new Error(`rolagem móvel nativa ausente: ${marker}`);
}
if (!html.includes('object-fit:fill')) throw new Error('capas ainda deixam faixas vazias na caixa');
if (/collection-tile[^>]+href=/i.test(html)) throw new Error('coletânea ainda navega para outra página');
console.log('coletâneas da Home validadas: arrastar, selecionar e mostrar todas sem navegação');
