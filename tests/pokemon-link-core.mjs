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
if (process.argv.includes('--screenshot')) {
  const press=(mask,frames=1)=>{core._neo_set_input(mask);for(let i=0;i<frames;i++)core._neo_run();core._neo_set_input(0);for(let i=0;i<90;i++)core._neo_run();};
  for(let i=0;i<420;i++)core._neo_run();
  press(1<<3); press(1<<8); press(1<<8); press(1<<8); press(1<<8); press(1<<0);
  const width=core._neo_frame_width(),height=core._neo_frame_height(),pitch=core._neo_frame_pitch(),ptr=core._neo_frame_ptr();
  const rowSize=Math.ceil(width*3/4)*4,pixels=Buffer.alloc(rowSize*height),heap=core.HEAPU8;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const at=ptr+y*pitch+x*2,p=heap[at]|heap[at+1]<<8,dst=(height-1-y)*rowSize+x*3;pixels[dst]=(p&31)*255/31;pixels[dst+1]=((p>>5)&63)*255/63;pixels[dst+2]=((p>>11)&31)*255/31;}
  const header=Buffer.alloc(54);header.write('BM');header.writeUInt32LE(54+pixels.length,2);header.writeUInt32LE(54,10);header.writeUInt32LE(40,14);header.writeInt32LE(width,18);header.writeInt32LE(height,22);header.writeUInt16LE(1,26);header.writeUInt16LE(24,28);header.writeUInt32LE(pixels.length,34);
  fs.writeFileSync(path.join(root,'pokemon-link-save-screen.bmp'),Buffer.concat([header,pixels]));
}
const result = { id, width:core._neo_frame_width(), height:core._neo_frame_height(), audioFrames:core._neo_audio_frames(), saveSize:core._neo_save_size() };
if (result.width !== 240 || result.height !== 160 || !result.audioFrames || !result.saveSize) throw new Error(`${id}: saída inválida ${JSON.stringify(result)}`);
console.log(JSON.stringify(result));
