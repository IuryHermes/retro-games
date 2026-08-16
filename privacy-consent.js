(function () {
    'use strict';

    const KEY = 'neo_privacy_consent_v1';
    const VERSION = 1;
    const read = () => {
        try {
            const value = JSON.parse(localStorage.getItem(KEY) || 'null');
            return value?.version === VERSION ? value : null;
        } catch (_) { return null; }
    };
    const has = category => category === 'necessary' || Boolean(read()?.[category]);
    const save = choices => {
        const value = { version: VERSION, necessary: true, analytics: Boolean(choices.analytics), marketing: Boolean(choices.marketing), updatedAt: new Date().toISOString() };
        localStorage.setItem(KEY, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('neo:consent-changed', { detail: value }));
        return value;
    };
    window.NeoPrivacy = { has, preferences: read, open: () => openSettings() };

    const style = document.createElement('style');
    style.textContent = `
      #neo-consent{position:fixed;z-index:2147483646;left:16px;right:16px;bottom:16px;margin:auto;max-width:980px;padding:17px;background:#07100a;color:#f3fff6;border:1px solid #18c957;border-radius:10px;box-shadow:0 12px 45px #000b;font:13px/1.5 Arial,sans-serif}
      #neo-consent strong{display:block;color:#62ff94;font:700 14px Arial,sans-serif;margin-bottom:4px}#neo-consent p{margin:0 0 12px}#neo-consent a,#neo-privacy-modal a{color:#62ff94}
      .neo-consent-actions{display:flex;gap:8px;flex-wrap:wrap}.neo-consent-btn{min-height:38px;padding:8px 13px;border:1px solid #18c957;border-radius:5px;background:#101712;color:#fff;font-weight:700;cursor:pointer}.neo-consent-primary{background:#18c957;color:#001c08}.neo-consent-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
      #neo-privacy-settings{position:fixed;left:14px;bottom:14px;z-index:2147483000;border:1px solid #18c957;border-radius:20px;background:#07100ae8;color:#62ff94;padding:7px 11px;font:700 10px monospace;cursor:pointer}
      #neo-privacy-modal{position:fixed;inset:0;z-index:2147483647;background:#000c;display:none;align-items:center;justify-content:center;padding:16px;font:13px/1.5 Arial,sans-serif;color:#f3fff6}
      #neo-privacy-modal.open{display:flex}.neo-privacy-card{width:min(560px,96vw);max-height:88vh;overflow:auto;background:#07100a;border:2px solid #18c957;border-radius:10px;padding:20px;box-shadow:0 15px 55px #000}.neo-privacy-card h2{margin:0 0 8px;color:#62ff94}.neo-privacy-option{display:grid;grid-template-columns:1fr auto;gap:12px;padding:13px 0;border-top:1px solid #28472f}.neo-privacy-option strong{display:block}.neo-privacy-option small{display:block;color:#bed1c2;margin-top:3px}.neo-privacy-option input{width:22px;height:22px;accent-color:#18c957}.neo-privacy-links{margin:12px 0}
      @media(max-width:600px){#neo-consent{left:8px;right:8px;bottom:76px;padding:13px;font-size:12px}.neo-consent-actions{display:grid;grid-template-columns:1fr}#neo-privacy-settings{bottom:74px}}
    `;
    document.head.appendChild(style);

    let modal;
    function closeSettings() { modal?.classList.remove('open'); }
    function openSettings() {
        if (!modal) return;
        const current = read() || { analytics: false, marketing: false };
        modal.querySelector('#neo-consent-analytics').checked = Boolean(current.analytics);
        modal.querySelector('#neo-consent-marketing').checked = Boolean(current.marketing);
        modal.classList.add('open');
        modal.querySelector('h2').focus();
    }
    function buildModal() {
        modal = document.createElement('div'); modal.id = 'neo-privacy-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'neo-privacy-title');
        modal.innerHTML = `<section class="neo-privacy-card"><h2 id="neo-privacy-title" tabindex="-1">PREFERÊNCIAS DE PRIVACIDADE</h2><p>Você decide quais tecnologias opcionais podem ser usadas. As necessárias permanecem ativas para o site funcionar.</p>
          <label class="neo-privacy-option"><span><strong>Necessários</strong><small>Login, segurança, tema, saves, emulador, chat e multiplayer.</small></span><input type="checkbox" checked disabled aria-label="Armazenamento necessário sempre ativo"></label>
          <label class="neo-privacy-option"><span><strong>Análise de desempenho</strong><small>Medição agregada de uso e erros. Atualmente não há ferramenta de analytics ativa.</small></span><input id="neo-consent-analytics" type="checkbox"></label>
          <label class="neo-privacy-option"><span><strong>Publicidade e personalização</strong><small>Anúncios personalizados ou rastreamento entre sites. Atualmente não são utilizados.</small></span><input id="neo-consent-marketing" type="checkbox"></label>
          <div class="neo-privacy-links"><a href="politica-de-privacidade.html">Política de Privacidade</a> · <a href="politica-de-cookies.html">Política de Cookies</a></div>
          <div class="neo-consent-actions"><button class="neo-consent-btn" data-close>Cancelar</button><button class="neo-consent-btn neo-consent-primary" data-save>Salvar preferências</button></div></section>`;
        modal.querySelector('[data-close]').onclick = closeSettings;
        modal.querySelector('[data-save]').onclick = () => { save({ analytics:modal.querySelector('#neo-consent-analytics').checked, marketing:modal.querySelector('#neo-consent-marketing').checked }); closeSettings(); removeBanner(); showSettingsButton(); };
        modal.onclick = event => { if (event.target === modal) closeSettings(); };
        document.body.appendChild(modal);
    }
    function removeBanner() { document.getElementById('neo-consent')?.remove(); }
    function showSettingsButton() {
        if (document.getElementById('neo-privacy-settings')) return;
        const button = document.createElement('button'); button.id = 'neo-privacy-settings'; button.type = 'button'; button.textContent = 'PRIVACIDADE'; button.onclick = openSettings; document.body.appendChild(button);
    }
    function buildBanner() {
        const banner = document.createElement('aside'); banner.id = 'neo-consent'; banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-label', 'Preferências de privacidade');
        banner.innerHTML = `<strong>PRIVACIDADE E ARMAZENAMENTO</strong><p>Usamos armazenamento necessário para login, saves, configurações, chat e multiplayer. Tecnologias opcionais só serão ativadas com sua escolha. <a href="politica-de-cookies.html">Saiba mais</a>.</p><div class="neo-consent-actions"><button class="neo-consent-btn neo-consent-primary" data-necessary>Somente necessários</button><button class="neo-consent-btn" data-settings>Configurar</button><button class="neo-consent-btn neo-consent-primary" data-accept>Aceitar opcionais</button></div>`;
        banner.querySelector('[data-necessary]').onclick = () => { save({ analytics:false, marketing:false }); removeBanner(); showSettingsButton(); };
        banner.querySelector('[data-accept]').onclick = () => { save({ analytics:true, marketing:true }); removeBanner(); showSettingsButton(); };
        banner.querySelector('[data-settings]').onclick = openSettings;
        document.body.appendChild(banner);
    }
    function init() { buildModal(); if (read()) showSettingsButton(); else buildBanner(); }
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once:true }) : init();
})();
