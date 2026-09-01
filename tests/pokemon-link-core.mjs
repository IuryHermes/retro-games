import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const id = process.argv[2] || 'pokemon-fire-red';
const games = {
  'pokemon-fire-red':['systems/gba/roms/pokemon-fire-red.gba','rfu'],
  'pokemon-leaf-green':['systems/gba/roms/pokemon-leaf-green-version.gba','rfu'],
  'pokemon-ruby':['systems/gba/roms/pokemon-ruby.gba','cable'],
  'pokemon-sapphire':['systems/gba/roms/pokemon-sapphire-version.gba','cable'],
  'pokemon-emerald':['systems/gba/roms/Pokemon_Emerald_PTBR.gba','rfu']
};
if (!games[id]) throw new Error(`Jogo desconhecido: ${id}`);
const source = fs.readFileSync(path.join(root,'pokemon-link/gpsp.js'),'utf8');
const require = createRequire(import.meta.url);
const createNeoGpsp = new Function('require','__dirname',`${source}\nreturn createNeoGpsp;`)(require, path.join(root,'pokemon-link'));
const core = await createNeoGpsp({ wasmBinary:fs.readFileSync(path.join(root,'pokemon-link/gpsp.wasm')) });
const [romPath, mode] = games[id];
const localRom = path.resolve(root, '..', 'pokemon-test-roms', path.basename(romPath));
let romBytes;
if (fs.existsSync(localRom)) romBytes = fs.readFileSync(localRom);
else {
  const romResponse = await fetch(`https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/${romPath}`);
  if (!romResponse.ok) throw new Error(`${id}: ROM indisponível (${romResponse.status})`);
  romBytes = new Uint8Array(await romResponse.arrayBuffer());
}
core.FS.writeFile('/game.gba', romBytes);
if (!core.ccall('neo_init','number',['string','string'],['/game.gba',mode])) throw new Error(`${id}: falha ao carregar ROM`);
if (process.argv.includes('--battle-save')) {
  const save = fs.readFileSync(path.join(root,'pokemon-link/saves/pokemon-fire-red-battle-ready.sav'));
  if (save.byteLength !== core._neo_save_size()) throw new Error(`${id}: tamanho do save incompatível`);
  core.HEAPU8.set(save, core._neo_save_ptr());
}
for (let frame=0; frame<180; frame++) core._neo_run();
const result = { id, width:core._neo_frame_width(), height:core._neo_frame_height(), audioFrames:core._neo_audio_frames(), saveSize:core._neo_save_size() };
if (result.width !== 240 || result.height !== 160 || !result.audioFrames || !result.saveSize) throw new Error(`${id}: saída inválida ${JSON.stringify(result)}`);
console.log(JSON.stringify(result));
