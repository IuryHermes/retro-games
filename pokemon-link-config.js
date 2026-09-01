(function () {
    const entries = [
        { match:/pokemon-fire-red\.gba$/i, id:'pokemon-fire-red', title:'Pokémon FireRed', mode:'rfu', room:'No Centro Pokémon, suba ao 2º andar e use o balcão central da Union Room.' },
        { match:/pokemon-leaf-green-version\.gba$/i, id:'pokemon-leaf-green', title:'Pokémon LeafGreen', mode:'rfu', room:'No Centro Pokémon, suba ao 2º andar e use o balcão central da Union Room.' },
        { match:/pokemon-ruby\.gba$/i, id:'pokemon-ruby', title:'Pokémon Ruby', mode:'cable', room:'No Centro Pokémon, suba ao 2º andar e entre no Cable Club.' },
        { match:/pokemon-sapphire-version\.gba$/i, id:'pokemon-sapphire', title:'Pokémon Sapphire', mode:'cable', room:'No Centro Pokémon, suba ao 2º andar e entre no Cable Club.' },
        { match:/pokemon_emerald_ptbr\.gba$/i, id:'pokemon-emerald', title:'Pokémon Emerald', mode:'rfu', room:'No Centro Pokémon, suba ao 2º andar e use o balcão central da Union Room.' }
    ];
    window.NeoPokemonLink = {
        entries,
        find(game) { return entries.find(entry => entry.match.test(String(game?.rom || game || ''))) || null; },
        byId(id) { return entries.find(entry => entry.id === id) || null; }
    };
})();
