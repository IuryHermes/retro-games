(function () {
  'use strict';
  const links = [
    ['/', 'Biblioteca', 'home'],
    ['/coletaneas.html', 'Coletâneas', 'collections'],
    ['/social.html', 'Comunidade', 'social'],
    ['/ofertas.html', 'Achados', 'offers'],
    ['/apoie.html', 'Clube', 'club'],
    ['/?multiplayer=1', 'Jogar online', 'multiplayer'],
    ['/?cadastro=1', 'Entrar', 'account']
  ];
  const current = () => {
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/social.html')) return 'social';
    if (path.endsWith('/ofertas.html')) return 'offers';
    if (path.endsWith('/apoie.html')) return 'club';
    if (path.endsWith('/coletaneas.html')) return 'collections';
    return 'home';
  };
  class NeoSiteHeader extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode:'open' });
      const section = this.getAttribute('section') || '';
      const active = current();
      root.innerHTML = `<style>
        :host{display:block;position:sticky;top:0;z-index:10000;color:#effff2;font:13px/1.2 Inter,Arial,sans-serif}
        header{display:flex;align-items:center;gap:18px;min-height:60px;padding:max(9px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) 9px max(14px,env(safe-area-inset-left));border-bottom:1px solid rgba(54,239,120,.3);background:rgba(2,8,4,.94);backdrop-filter:blur(16px)}
        .brand{display:flex;align-items:center;gap:9px;flex:0 0 auto;color:#fff;text-decoration:none;font-weight:800;letter-spacing:.05em}.logo{display:grid;place-items:center;width:32px;height:32px;border:1px solid #36ef78;border-radius:8px;background:#36ef7814;color:#55ff88}.section{color:#9eafa4;font-size:11px}
        nav{display:flex;align-items:center;gap:5px;margin-left:auto;overflow-x:auto;scrollbar-width:none}nav::-webkit-scrollbar{display:none}nav a{flex:none;min-height:42px;display:flex;align-items:center;padding:0 11px;border:1px solid transparent;border-radius:8px;color:#dfffe7;text-decoration:none;font-weight:700}nav a:hover,nav a:focus-visible,nav a[aria-current="page"]{border-color:#36ef7866;background:#36ef7818;color:#8dffaf;outline:none}.online{border-color:#36ef7866!important}
        @media(max-width:760px){header{display:block}.brand{margin-bottom:8px}.section{display:none}nav{margin:0;width:100%}nav a{min-height:44px;padding:0 10px}}
        @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
      </style><header><a class="brand" href="/"><span class="logo" aria-hidden="true">N</span><span>NEOTERMINALROOM${section ? `<small class="section"> / ${section.toUpperCase()}</small>` : ''}</span></a><nav aria-label="Navegação principal">${links.map(([href,label,key]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}${key === 'multiplayer' ? ' class="online"' : ''}>${label}</a>`).join('')}</nav></header>`;
    }
  }
  if (!customElements.get('neo-site-header')) customElements.define('neo-site-header', NeoSiteHeader);
})();
