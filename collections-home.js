(() => {
  'use strict';
  const R2 = 'https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/';
  const systems = [
    ['nes','NINTENDINHO'],['snes','SUPER NINTENDO'],['n64','NINTENDO 64'],['gba','GAME BOY ADVANCE'],
    ['megadrive','MEGA DRIVE'],['ps1','PLAYSTATION 1'],['atari2600','ATARI 2600'],['neogeo','NEO GEO']
  ];
  const definitions = [
    ['kof','THE KING OF FIGHTERS',/\b(the king of fighters|kof)\b/i],
    ['mario','SUPER MARIO',/\b(mario|yoshi|luigi|wario)\b/i],
    ['zelda','THE LEGEND OF ZELDA',/\b(zelda|ocarina of time|majora.?s mask)\b/i],
    ['metal-gear','METAL GEAR',/\bmetal gear\b/i],
    ['sonic','SONIC',/\bsonic\b/i],
    ['final-fantasy','FINAL FANTASY',/\bfinal fantasy\b/i],
    ['mega-man','MEGA MAN',/\b(mega man|rockman)\b/i],
    ['mortal-kombat','MORTAL KOMBAT',/\bmortal kombat\b/i],
    ['castlevania','CASTLEVANIA',/\b(castlevania|akumajou dracula)\b/i],
    ['pokemon','POKÉMON',/\bpok[eé]mon\b/i],
    ['donkey-kong','DONKEY KONG',/\bdonkey kong\b/i],
    ['street-fighter','STREET FIGHTER',/\bstreet fighter\b/i],
    ['dragon-ball','DRAGON BALL',/\bdragon ball\b/i],
    ['contra','CONTRA',/\bcontra\b/i],
    ['resident-evil','RESIDENT EVIL',/\b(resident evil|biohazard)\b/i],
    ['crash-bandicoot','CRASH BANDICOOT',/\bcrash bandicoot\b/i],
    ['bomberman','BOMBERMAN',/\bbomberman\b/i],
    ['metroid','METROID',/\bmetroid\b/i],
    ['tekken','TEKKEN',/\btekken\b/i],
    ['tomb-raider','TOMB RAIDER',/\btomb raider\b/i],
    ['pac-man','PAC-MAN',/\b(pac-man|pac man|ms\. pac)\b/i]
  ].map(([id,title,match]) => ({id,title,match}));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const slug = value => String(value || 'jogo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'jogo';
  const coverUrl = game => {
    const value = String(game.capa || '').trim();
    if (/^https:\/\//i.test(value)) return value;
    const name = value.split('/').pop();
    if (!name) return 'assets/imagens-videos/logo-discord.gif';
    return game.sysId === 'atari2600' ? `systems/atari2600/capas/${encodeURIComponent(name)}` : `${R2}systems/${game.sysId}/capas/${encodeURIComponent(name)}`;
  };
  let catalogPromise;
  const loadCatalog = () => catalogPromise ||= Promise.allSettled(systems.map(async ([sysId,sysName]) => {
    const response = await fetch(`systems/${sysId}/games.json?v=20260830-collections2`);
    if (!response.ok) throw new Error(`${sysId}: HTTP ${response.status}`);
    const raw = await response.json();
    const unique = [...new Map(raw.map(game => [String(game.rom || '').toLowerCase(), game])).values()]
      .filter(game => game.rom && game.nome && !(sysId === 'ps1' && /([._\-\s](cd|disc|disco)\s*0*[1-9])/i.test(String(game.rom))));
    const used = new Set();
    return unique.map(game => {
      const base = slug(game.nome); let route = base, suffix = 2;
      while (used.has(route)) route = `${base}-${suffix++}`;
      used.add(route);
      return {...game, sysId, sysName, sysPath:`systems/${sysId}/`, nomeOriginal:game.nome, playUrl:`/jogos/${sysId}/${route}/`};
    });
  })).then(results => {
    const groups = results.filter(result => result.status === 'fulfilled').map(result => result.value);
    if (!groups.length) throw new Error('Nenhum catálogo pôde ser carregado');
    return groups.flat();
  });
  const createCard = game => {
    const card = document.createElement('div'); card.className = 'game-card selectable-item';
    card.innerHTML = `<div class="card-media"><img src="${coverUrl(game)}" class="static-thumb" loading="lazy" alt="Capa de ${esc(game.nome)}"></div><div class="card-title"><span>${esc(game.nome)}</span></div>`;
    card.querySelector('img').onerror = event => { event.currentTarget.onerror = null; event.currentTarget.src = 'assets/imagens-videos/logo-discord.gif'; };
    card.onclick = () => typeof window.openGameModal === 'function' ? window.openGameModal(game, game.playUrl) : (location.href = game.playUrl);
    return card;
  };
  const createShelf = (definition, games, grid) => {
    const section = document.createElement('section'); section.className = 'row-wrapper';
    section.innerHTML = `<div class="row-header"><span class="row-title-text">${esc(definition.title)} · ${games.length} JOGOS</span></div>`;
    const container = document.createElement('div'); container.className = 'row-container';
    const carousel = document.createElement('div'); carousel.className = `game-carousel${grid ? ' grid-view' : ''}`;
    games.forEach(game => carousel.append(createCard(game)));
    if (grid) container.append(carousel);
    else {
      const left = document.createElement('button'); left.className = 'scroll-btn left-btn'; left.textContent = '❮'; left.onclick = () => carousel.scrollBy({left:-520,behavior:'smooth'});
      const right = document.createElement('button'); right.className = 'scroll-btn right-btn'; right.textContent = '❯'; right.onclick = () => carousel.scrollBy({left:520,behavior:'smooth'});
      container.append(left,carousel,right);
    }
    section.append(container); return section;
  };
  const init = async () => {
    const row = document.getElementById('collections-row');
    const panel = document.getElementById('collections-expanded');
    const showAll = document.getElementById('collections-show-all');
    if (!row || !panel || !showAll) return;
    let catalog = [];
    let suppressClickUntil = 0;
    const render = async selectedId => {
      panel.hidden = false;
      panel.innerHTML = '<p class="loading-text">ORGANIZANDO COLETÂNEA...</p>';
      panel.scrollIntoView({behavior:'smooth',block:'start'});
      try {
        catalog = catalog.length ? catalog : await loadCatalog();
        const selected = selectedId ? definitions.filter(item => item.id === selectedId) : definitions;
        panel.replaceChildren();
        const heading = document.createElement('div'); heading.className = 'collections-expanded-title';
        heading.innerHTML = `<span>${selectedId ? esc(selected[0]?.title || 'COLETÂNEA') : 'TODAS AS COLETÂNEAS'}</span>`;
        const close = document.createElement('button'); close.type = 'button'; close.className = 'collections-close'; close.textContent = 'FECHAR ×'; close.onclick = () => { panel.hidden = true; panel.replaceChildren(); };
        heading.append(close); panel.append(heading);
        selected.forEach(definition => {
          const games = catalog.filter(game => definition.match.test(game.nome)).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR',{numeric:true}));
          if (games.length) panel.append(createShelf(definition,games,Boolean(selectedId)));
        });
      } catch (error) {
        console.error('Falha ao abrir coletânea:', error);
        panel.innerHTML = '<p class="loading-text">NÃO FOI POSSÍVEL ABRIR. TENTE NOVAMENTE.</p>';
      }
    };
    row.onclick = event => {
      if (event.detail !== 0) return;
      const tile = event.target.closest('[data-collection]');
      if (tile && performance.now() >= suppressClickUntil) render(tile.dataset.collection);
    };
    showAll.onclick = () => render('');
    try {
      catalog = await loadCatalog();
      row.replaceChildren();
      definitions.forEach(definition => {
        const games = catalog.filter(game => definition.match.test(game.nome));
        if (!games.length) return;
        const tile = document.createElement('button'); tile.type = 'button'; tile.className = `collection-tile${definition.id === 'kof' ? ' kof' : ''}`; tile.dataset.collection = definition.id;
        const artwork = definition.id === 'kof' ? 'assets/imagens-videos/colecoes/the-king-of-fighters-v2.png' : coverUrl(games[0]);
        tile.style.setProperty('--collection-image', `url("${artwork}")`);
        tile.innerHTML = `<span class="collection-tile-copy"><strong>${esc(definition.title)}</strong><small>${games.length} jogos disponíveis</small></span>`;
        row.append(tile);
      });
      let startX = 0, startScroll = 0, dragging = false, pressedTile = null;
      row.onpointerdown = event => { startX = event.clientX; startScroll = row.scrollLeft; dragging = false; pressedTile = event.target.closest('[data-collection]'); row.classList.add('dragging'); };
      row.onpointermove = event => { if (!row.classList.contains('dragging')) return; const delta = event.clientX - startX; if (Math.abs(delta) > 7) dragging = true; row.scrollLeft = startScroll - delta; };
      const stop = () => {
        row.classList.remove('dragging');
        if (dragging) suppressClickUntil = performance.now() + 250;
        else if (pressedTile) render(pressedTile.dataset.collection);
        pressedTile = null;
      };
      row.onpointerup = stop; row.onpointercancel = stop;
      document.querySelector('.collection-scroll.prev').onclick = () => row.scrollBy({left:-520,behavior:'smooth'});
      document.querySelector('.collection-scroll.next').onclick = () => row.scrollBy({left:520,behavior:'smooth'});
    } catch (error) {
      console.error('Falha ao montar coletâneas:', error);
      row.innerHTML = '<span class="loading-text">Não foi possível carregar as coletâneas. Atualize a página.</span>';
    }
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',init,{once:true}) : init();
})();
