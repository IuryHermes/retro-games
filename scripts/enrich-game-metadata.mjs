import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const source = JSON.parse(await readFile(join(root, '.catalog-metadata', 'launchbox.json'), 'utf8'));
const systems = {
  nes:'Nintendo Entertainment System', snes:'Super Nintendo Entertainment System', n64:'Nintendo 64',
  gba:['Nintendo Game Boy Advance','Game Boy Advance'], megadrive:'Sega Genesis', ps1:'Sony Playstation', atari2600:'Atari 2600'
};
const labels = { nes:'NES', snes:'Super Nintendo', n64:'Nintendo 64', gba:'Game Boy Advance', megadrive:'Mega Drive', ps1:'PlayStation 1', atari2600:'Atari 2600' };
const roman = { xv:'15',xiv:'14',xiii:'13',xii:'12',xi:'11',ix:'9',viii:'8',vii:'7',vi:'6',iv:'4',iii:'3',ii:'2' };
const aliases = {
  nes:{'hudson s adventure island':'adventure island','hudson s adventure island 2':'adventure island 2','legend of zelda link s adventure':'zelda 2 adventure of link','ms pac man':'ms pac-man','super mario bros usa':'super mario bros 2'},
  snes:{'street fighter 2 turbo hyper fighting':'street fighter 2 turbo','spider man venom separation anxiety':'venom spider-man separation anxiety','spider man and x men':'spider-man x-men arcade s revenge','super aleste':'space megaforce','trials of mana':'seiken densetsu 3','final fantasy 3':'final fantasy 6','final fantasy 4':'final fantasy 2'},
  n64:{'donald duck goin quackers':'donald duck quack attack'},
  gba:{'minish cap':'legend of zelda minish cap','spongebob and friends battle for bikini bottom':'spongebob squarepants battle for bikini bottom'},
  megadrive:{'lenda de thor o sucessor da luz':'beyond oasis','story of thor':'beyond oasis','phantasy star end of millennium':'phantasy star 4','donald duck maui mallard':'maui mallard in cold shadow','yu yu hakusho sunset fighters':'yu yu hakusho makyo toitsusen'},
  ps1:{
    'bug s life':'disney-pixar a bug s life','a i t d 2024 ch1n com br':'alone in dark new nightmare','alone in dark':'alone in dark new nightmare',
    'amerzone explorer s legacy':'amerzone explorer s legacy','asterix guerra gallica':'asterix gallic war','asterix gallic war':'asterix gallic war',
    'chrono cross':'chrono cross','crash bandicoot crash bash':'crash bash','crash team racing':'ctr crash team racing','dracula ressurreicao':'dracula resurrection',
    'driver':'driver you are wheelman','driver 2':'driver 2 wheelman is back','final fantasy 7':'final fantasy 7','final fantasy 8':'final fantasy 8','final fantasy 9':'final fantasy 9',
    'metal gear solid portugues':'metal gear solid','metal gear solid':'metal gear solid','toy story 2':'disney-pixar s toy story 2 buzz lightyear to rescue'
  },
  atari2600:{'defender 2':'stargate','maze craze':'maze craze game of cops n robbers','space shuttle':'space shuttle journey into space'}
};
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\b(xv|xiv|xiii|xii|xi|ix|viii|vii|vi|iv|iii|ii)\b/g, token => roman[token])
  .replace(/\b(the|a|an)\b/g, ' ').replace(/\b(pt[- ]?br|traduzido|dublado|playstation 1|m3u|usa|europe|japan|world|em portugues|portugu s|ch1n com br)\b/g, ' ')
  .replace(/\b(?:cd|disc|disco)\s*[1-9]\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const levenshtein = (a,b) => { const row=Array.from({length:b.length+1},(_,i)=>i); for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}} return row[b.length]; };
const similarity = (a,b) => 1 - levenshtein(a,b) / Math.max(a.length,b.length,1);
const numericConflict = (a,b) => { const left=a.match(/\b\d+\b/g)||[],right=b.match(/\b\d+\b/g)||[]; return (left.length||right.length) && left.join(',')!==right.join(','); };
const platformRows = platform => source.filter(row => (Array.isArray(platform) ? platform : [platform]).includes(row.platform));

const genrePt = value => String(value || '').split(/[,;]/).map(item => item.trim()).filter(Boolean).map(item => ({
  'Action':'ação','Adventure':'aventura','Platform':'plataforma','Role-Playing':'RPG','Racing':'corrida','Sports':'esportes','Shooter':'tiro','Puzzle':'quebra-cabeça','Strategy':'estratégia','Simulation':'simulação','Fighting':'luta','Music':'música','Party':'festa','Educational':'educativo'
}[item] || item.toLowerCase())).join(', ');

const genreCopy = genres => {
  const value = normalize(genres);
  if (/role playing|rpg/.test(value)) return 'A experiência combina exploração, progressão de personagens, gerenciamento de recursos e combates orientados por estratégia.';
  if (/platform/.test(value)) return 'A jogabilidade se concentra em percorrer fases, dominar saltos, evitar perigos e descobrir rotas ou itens escondidos.';
  if (/fighting/.test(value)) return 'O foco está em confrontos diretos, leitura do adversário, domínio de golpes e precisão no tempo de ataque e defesa.';
  if (/racing/.test(value)) return 'A proposta gira em torno de corridas, domínio dos circuitos, controle de velocidade e busca por tempos ou posições melhores.';
  if (/shooter|shoot em up/.test(value)) return 'A ação exige movimentação constante, mira, reação rápida e uso eficiente de armas ou melhorias contra ondas de inimigos.';
  if (/puzzle/.test(value)) return 'O desafio privilegia raciocínio, reconhecimento de padrões e planejamento para resolver situações progressivamente mais complexas.';
  if (/sport/.test(value)) return 'O jogo adapta regras e fundamentos esportivos para partidas rápidas, com ênfase em posicionamento, tempo de comando e competição.';
  if (/strategy/.test(value)) return 'A experiência valoriza planejamento, administração de recursos e decisões táticas que produzem consequências ao longo da partida.';
  if (/adventure/.test(value)) return 'A aventura combina exploração, objetivos sequenciais, descoberta de caminhos e interação com personagens ou elementos do cenário.';
  if (/action/.test(value)) return 'A jogabilidade prioriza ação imediata, reflexos, movimentação precisa e domínio gradual dos padrões de fases e adversários.';
  return 'A experiência preserva a estrutura e as limitações técnicas características de sua plataforma original.';
};
const cleanYear = value => String(value || '').match(/(?:19|20)\d{2}/)?.[0] || '';
const buildDescription = (game,row,system) => {
  const facts=[]; const genres=genrePt(row?.genres||'');
  facts.push(`${game.nome} é um jogo${genres ? ` de ${genres}` : ''}${row?.year ? ` lançado em ${cleanYear(row.year)}` : ''} para ${labels[system]}.`);
  if(row?.developer || row?.publisher) facts.push(`${row.developer ? `Desenvolvido por ${row.developer}` : 'Desenvolvedor não documentado'}${row.publisher ? ` e publicado por ${row.publisher}` : ''}.`);
  facts.push(genreCopy(row?.genres || ''));
  if(Number(row?.maxPlayers)>0) facts.push(`Oferece suporte para até ${row.maxPlayers} jogador${Number(row.maxPlayers)>1?'es':''}${String(row.cooperative).toLowerCase()==='true'?', incluindo modo cooperativo':''}.`);
  if(row?.esrb && !/not rated|unknown/i.test(row.esrb)) facts.push(`Classificação indicativa original: ${row.esrb}.`);
  if(Number(row?.rating)>0 && Number(row?.ratingCount)>0) facts.push(`A nota é ${(row.rating*2).toFixed(1)}/10, conversão da média comunitária de ${row.rating.toFixed(2)}/5 no LaunchBox, baseada em ${row.ratingCount} ${row.ratingCount===1?'avaliação':'avaliações'}.`);
  else facts.push('Ainda não há quantidade suficiente de avaliações públicas confiáveis para atribuir uma nota numérica sem inventar dados.');
  return facts.join(' ');
};

const report={};
for(const [system,platform] of Object.entries(systems)){
  const rows=platformRows(platform); const exact=new Map();
  for(const row of rows){const key=normalize(row.name); if(!key) continue; const current=exact.get(key); if(!current || row.ratingCount>current.ratingCount) exact.set(key,row);}
  const games=JSON.parse(await readFile(join(root,'systems',system,'games.json'),'utf8'));
  let exactCount=0,fuzzyCount=0,missingCount=0; const missingNames=[];
  const output=games.map(game=>{
    const candidates=[game.nome, String(game.rom||'').split('/').pop().replace(/\.[^.]+$/,'')].map(normalize).map(key=>normalize(aliases[system]?.[key]||key)).filter(Boolean);
    let row=candidates.map(key=>exact.get(key)).find(Boolean); let confidence=row?1:0;
    if(!row){
      let best=null;
      for(const candidate of candidates){ if(candidate.length<5) continue; for(const item of rows){const key=normalize(item.name); if(!key || key[0]!==candidate[0] || numericConflict(candidate,key)) continue; const score=similarity(candidate,key); if(!best||score>best.score||(score===best.score&&item.ratingCount>best.row.ratingCount)) best={row:item,score};}}
      if(best && best.score>=0.88){row=best.row;confidence=best.score;}
    }
    if(!row){missingCount++;missingNames.push(game.nome);return {...game,nota:'S/N',popularidade:0,descricao:buildDescription(game,null,system),metadataFonte:'sem correspondência confiável'};}
    confidence===1?exactCount++:fuzzyCount++;
    const rating=Number(row.rating)||0,count=Number(row.ratingCount)||0;
    const weighted=((rating*count)+(3.5*12))/(count+12);
    const popularity=Number((weighted*20+Math.log10(count+1)*12).toFixed(3));
    return {...game,nota:rating&&count?(rating*2).toFixed(1):'S/N',popularidade:popularity,descricao:buildDescription(game,row,system),metadataFonte:'LaunchBox Games Database',metadataId:row.databaseId,avaliacoes:count,ano:cleanYear(row.year),genero:row.genres,desenvolvedora:row.developer,publicadora:row.publisher};
  });
  report[system]={total:games.length,exact:exactCount,fuzzy:fuzzyCount,missing:missingCount,coverage:Number(((exactCount+fuzzyCount)/games.length*100).toFixed(1)),missingNames};
  if(apply) await writeFile(join(root,'systems',system,'games.json'),`${JSON.stringify(output,null,2)}\n`);
}
await mkdir(join(root,'.catalog-metadata'),{recursive:true});
await writeFile(join(root,'.catalog-metadata','match-report.json'),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));
