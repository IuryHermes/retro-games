import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const systems = ['nes', 'snes', 'n64', 'gba', 'megadrive', 'ps1'];
const cores = { nes:'nes', snes:'snes', n64:'n64', gba:'gba', megadrive:'segaMD', ps1:'psx' };
const platformLabels = { nes:'NES', snes:'SNES', n64:'Nintendo 64', gba:'GBA', megadrive:'Mega Drive', ps1:'PS1' };
const r2 = 'https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/';
const site = 'https://neoterminalroom.com.br';
const normalizeGameName = value => String(value || 'Jogo').replace(/\bII\b/gi, '2').replace(/\bFirered\b/gi, 'FireRed');
const slugify = value => String(value || 'jogo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'jogo';
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

await rm(join(root, 'jogos'), { recursive:true, force:true });
const sitemap = [];
let generated = 0;
for (const system of systems) {
  const raw = JSON.parse(await readFile(join(root, 'systems', system, 'games.json'), 'utf8'));
  const unique = [...new Map(raw.map(game => [String(game.rom || '').toLowerCase(), game])).values()].filter(game => game.rom && game.nome);
  const usedSlugs = new Set();
  for (const game of unique) {
    const gameName = normalizeGameName(game.nome);
    const base = slugify(gameName);
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
    usedSlugs.add(slug);
    const canonical = `${site}/jogos/${system}/${slug}/`;
    const rom = `${r2}systems/${system}/${game.rom}`;
    const player = `/player-universal.html?${new URLSearchParams({ game:rom, core:cores[system], title:gameName, system, embedded:'1' })}`;
    const coverName = String(game.capa || '').split('/').pop();
    const cover = coverName ? `${r2}systems/${system}/capas/${encodeURIComponent(coverName)}` : `${site}/assets/imagens-videos/logo-discord.gif`;
    const description = String(game.descricao || `Jogue ${gameName} online no NeoTerminalRoom.`).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
    const languageText = `${gameName} ${game.rom} ${description}`;
    const alreadyLocalizedName = /pt[-_ ]?br|traduz|dublad|portugu[eê]s/i.test(gameName);
    const isLocalized = /pt[-_ ]?br|traduz|dublad|portugu[eê]s/i.test(languageText);
    const seoTitle = `Jogar ${gameName}${isLocalized && !alreadyLocalizedName ? ' Traduzido PT-BR' : ''} Online - ${platformLabels[system]}`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escape(seoTitle)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(seoTitle)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escape(cover)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(seoTitle)}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'VideoGame',name:gameName,description,image:cover,gamePlatform:platformLabels[system],url:canonical,inLanguage:'pt-BR'})}</script><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#000;overflow:hidden}.seo{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}iframe{display:block}</style></head><body><main class="seo"><h1>${escape(seoTitle)}</h1><p>${escape(description)}</p><a href="${escape(player)}">Jogar ${escape(gameName)}</a></main><iframe src="${escape(player)}" title="Jogar ${escape(gameName)}" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe></body></html>`;
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
