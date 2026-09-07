(() => {
    const key = 'neo_account_preview_v1';
    const buttons = [...document.querySelectorAll('.account-button')];
    let preview = null;
    let phase = 'restoring';
    const read = name => { try { return sessionStorage.getItem(name); } catch (_) { return null; } };
    const remove = () => { try { sessionStorage.removeItem(key); } catch (_) {} };
    function tokenIdentity(token) {
        try {
            const parts = String(token || '').split('.');
            const payload = JSON.parse(atob(parts[parts.length === 3 ? 1 : 0].replace(/-/g, '+').replace(/_/g, '/')));
            return String(parts.length === 3 ? payload.sub || '' : payload.accountId || '');
        } catch (_) { return ''; }
    }
    try {
        const saved = JSON.parse(read(key) || 'null');
        const token = new URLSearchParams(location.hash.slice(1)).get('account_token') || read('neo_account_access');
        if (saved?.uid && saved.uid === tokenIdentity(token) && typeof saved.name === 'string' && Date.now() - saved.savedAt < 12 * 60 * 60 * 1000) preview = saved;
        else remove();
    } catch (_) { remove(); }
    function render() {
        for (const button of buttons) {
            const name = preview?.name || (phase === 'restoring' ? 'RECUPERANDO SESSÃO...' : phase === 'error' ? 'TENTAR NOVAMENTE' : phase === 'incomplete' ? 'COMPLETAR PERFIL' : 'LOGIN / CADASTRO');
            button.querySelector('.account-name').textContent = name;
            const avatar = /^avatar-(0[1-9]|[1-3][0-9]|40)$/.test(preview?.avatar || '') ? preview.avatar : 'avatar-01';
            button.querySelector('.account-avatar').src = preview ? `assets/avatars/${avatar}.png` : 'assets/imagens-videos/logo-discord.gif?v=2';
            const hint = button.querySelector('.account-hint');
            if (hint) hint.textContent = phase === 'restoring' ? 'Recuperando sua sessão...' : phase === 'error' ? 'Conexão indisponível. Tente novamente.' : preview ? 'perfil, avatar e saves' : '3 saves grátis por jogo';
            button.disabled = phase === 'restoring';
            button.setAttribute('aria-busy', String(phase === 'restoring'));
            button.setAttribute('aria-label', phase === 'restoring' ? 'Recuperando sua sessão' : phase === 'error' ? 'Tentar recuperar a sessão novamente' : preview ? `Abrir perfil de ${preview.name}` : 'Entrar ou criar cadastro');
        }
    }
    window.NeoAccountSessionUI = {
        get phase() { return phase; },
        tokenIdentity,
        restore(uid) {
            if (preview && preview.uid !== uid) { preview = null; remove(); }
            phase = 'restoring'; render();
        },
        show(profile) {
            // This stores display data only. API authorization still requires a verified token.
            preview = { uid: String(profile.uid || ''), name: String(profile.name || '').slice(0, 20), avatar: profile.avatar, savedAt: Date.now() };
            try { sessionStorage.setItem(key, JSON.stringify(preview)); } catch (_) {}
            phase = 'ready'; render();
        },
        clear(hasAccount = false) { preview = null; remove(); phase = hasAccount ? 'incomplete' : 'guest'; render(); },
        unavailable() { phase = 'error'; render(); }
    };
    render();
})();
