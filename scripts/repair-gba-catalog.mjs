import { readFile, writeFile } from 'node:fs/promises';

const catalogUrl = new URL('../systems/gba/games.json', import.meta.url);
let games = JSON.parse(await readFile(catalogUrl, 'utf8'));

const englishDuplicates = new Set([
  'roms/final-fantasy-i-ii-dawn-of-souls.gba',
  'roms/lady-sia.gba',
  'roms/pokemon-fire-red-version.gba',
  'roms/spongebob-squarepants-supersponge.gba',
  'roms/the-legend-of-zelda-the-minish-cap.gba',
]);
games = games.filter(game => !englishDuplicates.has(game.rom));

const fixes = {
  'roms/crash-bandicoot-2-n-tranced.gba': { nome: 'Crash Bandicoot 2: N-Tranced', media: 'crash-bandicoot-2-n-tranced' },
  'roms/donkey-kong-country.gba': { media: 'donkey-kong-country' },
  'roms/donkey-kong-country-3.gba': { nome: "Donkey Kong Country 3: Dixie Kong's Double Trouble!", media: 'donkey-kong-country-3' },
  'roms/final-fantasy-i-ii-dawn-of-souls-br.gba': { nome: 'Final Fantasy I & II: Dawn of Souls', media: 'final-fantasy-1-2' },
  'roms/final-fantasy-vi-advance.gba': { nome: 'Final Fantasy VI Advance', media: 'final-fantasy-vi-advance' },
  'roms/gekido-advance-kintaro-s-revenge.gba': { nome: "Gekido Advance: Kintaro's Revenge", media: 'gekido-kintaros-revenge' },
  'roms/grand-theft-auto-advance.gba': {
    nome: 'Grand Theft Auto Advance', media: 'grand-theft-auto-advance', nota: '7.4', popularidade: 101.327,
    metadataFonte: 'LaunchBox Games Database', metadataId: '3784', avaliacoes: 128, ano: '2004', genero: 'Action',
    desenvolvedora: 'Digital Eclipse Software', publicadora: 'Rockstar Games',
    descricao: 'Grand Theft Auto Advance é um jogo de ação lançado em 2004 para Game Boy Advance. Desenvolvido pela Digital Eclipse Software e publicado pela Rockstar Games, apresenta uma história de vingança em Liberty City vista de cima, com missões, perseguições policiais e exploração urbana. É para 1 jogador, recebeu classificação M - Mature e tem nota 7.4/10, conversão da média comunitária de 3.69/5 no LaunchBox, baseada em 128 avaliações.'
  },
  'roms/harvest-moon-friends-of-mineral-town.gba': { media: 'harvest-moon-friends' },
  'roms/harvest-moon-mfomt.gba': {
    nome: 'Harvest Moon: More Friends of Mineral Town', media: 'harvest-moon-more-friends', nota: '7.6', popularidade: 94.204,
    metadataFonte: 'LaunchBox Games Database', metadataId: '3468', avaliacoes: 52, ano: '2003', genero: 'Life Simulation; Role-Playing',
    desenvolvedora: 'Marvelous Interactive', publicadora: 'Natsume',
    descricao: 'Harvest Moon: More Friends of Mineral Town é uma simulação de fazenda com elementos de RPG lançada em 2003 para Game Boy Advance. Nesta versão distinta de Friends of Mineral Town, a protagonista deixa a cidade para administrar a fazenda, cultivar, cuidar dos animais, formar relacionamentos e constituir família. É para 1 jogador e tem nota 7.6/10, conversão da média comunitária de 3.79/5 no LaunchBox, baseada em 52 avaliações.'
  },
  'roms/lady-sia-br.gba': { nome: 'Lady Sia' },
  'roms/need-for-speed-most-wanted.gba': { media: 'need-for-speed-most-wanted' },
  'roms/pokemon-dark-fire.gba': { nome: 'Pokémon DarkFire', replaceName: true },
  'roms/pokemon-fire-red.gba': {
    nome: 'Pokémon FireRed', media: 'pokemon-fire-red', nota: '9.0', popularidade: 122.059,
    metadataFonte: 'LaunchBox Games Database', metadataId: '3490', avaliacoes: 538, ano: '2004', genero: 'Adventure; Role-Playing',
    desenvolvedora: 'Game Freak', publicadora: 'Nintendo',
    descricao: 'Pokémon FireRed é um RPG de aventura lançado originalmente em 2004 para Game Boy Advance. Desenvolvido pela Game Freak e publicado pela Nintendo, recria a jornada pela região de Kanto com batalhas, captura, treinamento e evolução de Pokémon. Esta edição do catálogo está em português brasileiro. A versão original oferece suporte para até 4 jogadores, recebeu classificação E - Everyone e tem nota 9.0/10, conversão da média comunitária de 4.49/5 no LaunchBox, baseada em 538 avaliações.'
  },
  'roms/pokemon-my-ass.gba': { nome: 'Pokémon My Ass', replaceName: true },
  'roms/pokemon-new-hoenn.gba': { nome: 'Pokémon New Hoenn', replaceName: true },
  'roms/pokemon-ruby.gba': { nome: 'Pokémon Ruby Version', media: 'pokemon-ruby' },
  'roms/spongebob-and-friends-attack-of-the-toybots.gba': {
    nome: 'SpongeBob and Friends: Attack of the Toybots', media: 'spongebob-attack-of-the-toybots', nota: '6.3', popularidade: 84.512,
    metadataFonte: 'LaunchBox Games Database', metadataId: '24947', avaliacoes: 17, ano: '2007', genero: 'Adventure; Platform',
    desenvolvedora: 'Natsume', publicadora: 'THQ',
    descricao: 'SpongeBob and Friends: Attack of the Toybots é um jogo de aventura e plataforma lançado em 2007 para Game Boy Advance. SpongeBob se une a personagens da Nickelodeon para impedir o exército de brinquedos robóticos do Professor Calamitous. Desenvolvido pela Natsume e publicado pela THQ, é para 1 jogador, tem classificação E - Everyone e nota 6.3/10, conversão da média comunitária de 3.14/5 no LaunchBox, baseada em 17 avaliações.'
  },
  'roms/spongebob-squarepants-supersponge-br.gba': { nome: 'SpongeBob SquarePants: SuperSponge', media: 'spongebob-supersponge' },
  'roms/super-mario-advance-2-super-mario-world.gba': { media: 'super-mario-advance-2' },
  'roms/the-minish-cap.gba': { nome: 'The Legend of Zelda: The Minish Cap', media: 'zelda-minish-cap' },
  'roms/yu-yu-hakusho-ghostfiles-spirit-detective.gba': { nome: 'Yu Yu Hakusho: Ghostfiles - Spirit Detective', media: 'yu-yu-hakusho-spirit-detective' },
  'roms/yu-yu-hakusho-ghostfiles-tournament-tactics.gba': { nome: 'Yu Yu Hakusho: Ghostfiles - Tournament Tactics', media: 'yu-yu-hakusho-tournament-tactics' },
};

for (const game of games) {
  const fix = fixes[game.rom];
  if (!fix) continue;
  const oldName = game.nome;
  Object.assign(game, Object.fromEntries(Object.entries(fix).filter(([key]) => !['media', 'replaceName'].includes(key))));
  if (fix.media) {
    game.capa = `${fix.media}.png`;
    game.preview = `${fix.media}.gif`;
  }
  if (fix.nome && !fix.descricao) game.descricao = game.descricao.replaceAll(oldName, fix.nome);
}

await writeFile(catalogUrl, `${JSON.stringify(games, null, 2)}\n`);
console.log(`Catálogo GBA corrigido: ${englishDuplicates.size} duplicatas em inglês removidas e ${Object.keys(fixes).length} ROMs verificadas.`);
