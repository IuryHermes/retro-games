import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const systems = ['nes', 'snes', 'n64', 'gba', 'megadrive', 'ps1', 'atari2600'];
const cores = { nes:'nes', snes:'snes', n64:'n64', gba:'gba', megadrive:'segaMD', ps1:'psx', atari2600:'atari2600' };
const platformLabels = { nes:'NES', snes:'SNES', n64:'Nintendo 64', gba:'GBA', megadrive:'Mega Drive', ps1:'PS1', atari2600:'Atari 2600' };
const r2 = 'https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/';
const site = 'https://neoterminalroom.com.br';
const romanGameNumbers = { XV:'15', XIV:'14', XIII:'13', XII:'12', XI:'11', IX:'9', VIII:'8', VII:'7', VI:'6', IV:'4', III:'3', II:'2' };
const normalizeGameName = (value, system = '') => String(value || 'Jogo')
  .replace(/\b(?:XV|XIV|XIII|XII|XI|IX|VIII|VII|VI|IV|III|II)\b/gi, numeral => system === 'ps1' ? romanGameNumbers[numeral.toUpperCase()] : (numeral.toUpperCase() === 'II' ? '2' : numeral))
  .replace(/\bI(?=\s*&\s*2\b)/gi, '1')
  .replace(/\bFirered\b/gi, 'FireRed');
const slugify = value => String(value || 'jogo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'jogo';
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

await rm(join(root, 'jogos'), { recursive:true, force:true });
const sitemap = [];
let generated = 0;
for (const system of systems) {
  const raw = JSON.parse(await readFile(join(root, 'systems', system, 'games.json'), 'utf8'));
  const isRawPs1Disc = game => system === 'ps1' && /([._\-\s](cd|disc|disco)\s*0*[1-9])/i.test(String(game.rom || ''));
  const unique = [...new Map(raw.map(game => [String(game.rom || '').toLowerCase(), game])).values()].filter(game => game.rom && game.nome && !isRawPs1Disc(game));
  const usedSlugs = new Set();
  for (const game of unique) {
    const gameName = normalizeGameName(game.nome, system);
    const base = slugify(gameName);
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
    usedSlugs.add(slug);
    const canonical = `${site}/jogos/${system}/${slug}/`;
    const multidisc = Array.isArray(game.discs) && game.discs.length > 1;
    // Boot directly from Disc 1. Browser PCSX-ReARMed does not reliably accept
    // M3Us whose later large CHDs are intentionally loaded on demand.
    const bootRom = multidisc ? game.discs[0] : game.rom;
    const assetBase = system === 'atari2600' ? `${site}/` : r2;
    const rom = `${assetBase}systems/${system}/${bootRom}`;
    const playerParams = { game:rom, core:cores[system], title:gameName, system, embedded:'1' };
    if (multidisc) playerParams.discs = JSON.stringify(game.discs.map(disc => `${assetBase}systems/${system}/${disc}`));
    const player = `/player-universal.html?${new URLSearchParams(playerParams)}`;
    const coverName = String(game.capa || '').split('/').pop();
    const cover = coverName ? `${assetBase}systems/${system}/capas/${encodeURIComponent(coverName)}` : `${site}/assets/imagens-videos/logo-discord.gif`;
    const description = String(game.descricao || `Jogue ${gameName} online no NeoTerminalRoom.`).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
    const languageText = `${gameName} ${game.rom} ${description}`;
    const alreadyLocalizedName = /pt[-_ ]?br|traduz|dublad|portugu[eê]s/i.test(gameName);
    const isLocalized = /pt[-_ ]?br|traduz|dublad|portugu[eê]s/i.test(languageText);
    const seoTitle = `Jogar ${gameName}${isLocalized && !alreadyLocalizedName ? ' Traduzido PT-BR' : ''} Online - ${platformLabels[system]}`;
    const structuredData = JSON.stringify({'@context':'https://schema.org','@type':'VideoGame',name:gameName,description,image:cover,gamePlatform:platformLabels[system],url:canonical,inLanguage:'pt-BR'});
    const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escape(seoTitle)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:title" content="${escape(seoTitle)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escape(cover)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(seoTitle)}">
<script type="application/ld+json">${structuredData}</script><script src="/privacy-consent-v2.js" defer></script><script src="/analytics-consent.js" defer></script>
<style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#050806;color:#eaffef;font-family:Arial,sans-serif}body.playing{overflow:hidden}.game-landing{min-height:100dvh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 70% 20%,#12391f 0,transparent 38%),#050806}.game-card{width:min(980px,100%);display:grid;grid-template-columns:minmax(220px,360px) 1fr;gap:30px;align-items:center;padding:28px;border:1px solid #245c36;border-radius:16px;background:#09110c;box-shadow:0 22px 70px #000a}.cover{display:block;width:100%;max-height:68vh;object-fit:contain;border-radius:10px;background:#000}.eyebrow{color:#55ff88;font:bold 12px monospace;text-transform:uppercase}.content h1{margin:10px 0 16px;font-size:clamp(25px,4vw,48px);line-height:1.08}.content p{color:#c6d4c9;font-size:clamp(15px,2vw,18px);line-height:1.7}.play,.back{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-weight:800;border-radius:8px}.play{min-height:54px;margin-top:12px;padding:14px 24px;background:#20df62;color:#001b09;box-shadow:0 0 24px #20df6255}.back{margin-left:10px;padding:14px;color:#9fffb9}.play:focus-visible,.back:focus-visible{outline:3px solid #fff;outline-offset:3px}iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#000;display:none}body.playing iframe{display:block}body.playing .game-landing{display:none}@media(max-width:700px){.game-landing{padding:14px}.game-card{grid-template-columns:1fr;padding:18px;gap:16px}.cover{max-height:42vh}.content h1{font-size:clamp(23px,8vw,35px)}.play{width:100%}.back{display:flex;margin:8px 0 0}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style></head>
<body><main class="game-landing"><article class="game-card"><img class="cover" src="${escape(cover)}" alt="Capa de ${escape(gameName)}" width="600" height="600" fetchpriority="high"><div class="content"><div class="eyebrow">${escape(platformLabels[system])} · JOGO RETRÔ ONLINE</div><h1>${escape(seoTitle)}</h1><p>${escape(description)}</p><a class="play" id="play-game" href="${escape(player)}">▶ JOGAR AGORA</a><a class="back" href="/">Ver biblioteca</a></div></article></main><iframe id="game-player" title="Jogar ${escape(gameName)}" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>
<script>(()=>{const player=${JSON.stringify(player)};const game=${JSON.stringify(gameName)};const system=${JSON.stringify(system)};let started=false;function start(event){event?.preventDefault();if(started)return;started=true;document.body.classList.add('playing');const frame=document.getElementById('game-player');frame.src=player;window.neoTrack?.('game_start',{game_name:game,game_system:system,source:'game_landing'});frame.focus()}document.getElementById('play-game').addEventListener('click',start);if(new URLSearchParams(location.search).get('autoplay')==='1')window.addEventListener('DOMContentLoaded',start,{once:true})})()</script></body></html>`;
    const directory = join(root, 'jogos', system, slug); await mkdir(directory, { recursive:true }); await writeFile(join(directory, 'index.html'), html);
    sitemap.push(`<url><loc>${canonical}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`); generated++;
  }
}
await mkdir(join(root,'jogos'),{recursive:true});
await writeFile(join(root,'jogos','index.html'), '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Jogos online | NeoTerminalRoom</title><link rel="canonical" href="https://neoterminalroom.com.br/jogos/"><meta http-equiv="refresh" content="0;url=/"></head><body><a href="/">Ver catálogo de jogos</a></body></html>');
await writeFile(join(root,'sitemap-games.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.join('')}</urlset>`);
await writeFile(join(root,'sitemap-static.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url><url><loc>${site}/social.html</loc><changefreq>daily</changefreq><priority>0.8</priority></url><url><loc>${site}/ofertas.html</loc><changefreq>daily</changefreq><priority>0.7</priority></url></urlset>`);
await writeFile(join(root,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${site}/sitemap-static.xml</loc></sitemap><sitemap><loc>${site}/sitemap-games.xml</loc></sitemap></sitemapindex>`);
console.log(`generated ${generated} game pages`);
