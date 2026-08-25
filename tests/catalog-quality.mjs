import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const systems=['nes','snes','n64','gba','megadrive','ps1','atari2600'];
let total=0, rated=0, sourced=0;
for(const system of systems){
  const games=JSON.parse(await readFile(`systems/${system}/games.json`,'utf8'));
  total+=games.length;
  for(const game of games){
    assert.ok(String(game.descricao||'').length>=150, `${system}/${game.nome} needs a useful description`);
    assert.ok(game.nota==='S/N' || (Number(game.nota)>=0 && Number(game.nota)<=10), `${system}/${game.nome} has an invalid rating`);
    assert.equal(typeof game.popularidade,'number',`${system}/${game.nome} needs a popularity score`);
    assert.ok(game.metadataFonte,`${system}/${game.nome} must disclose its metadata status`);
    if(game.nota!=='S/N') rated++;
    if(game.metadataFonte==='LaunchBox Games Database') sourced++;
  }
}
assert.ok(rated/total>.7,'most games should have a sourced public rating');
assert.ok(sourced/total>.8,'metadata match coverage should stay above 80%');

const index=await readFile('index.html','utf8');
assert.match(index,/dataset\.popularity/);
assert.match(index,/featuredFamilies\.has\(familyKey\)/);
assert.match(index,/localeCompare\(b\.dataset\.gameName, 'pt-BR'/);
assert.match(index,/max-height:calc\(100dvh - 40px\); overflow-y:auto/);
assert.match(index,/SEM NOTA PÚBLICA/);
console.log(`catalog quality: ${total} games, ${rated} rated, ${sourced} sourced`);
