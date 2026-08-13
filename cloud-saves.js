(function () {
    'use strict';

    const API = 'https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev';
    const TOKEN_KEY = 'neo_club_access';
    const INTERVAL_MS = 60000;
    let token = sessionStorage.getItem(TOKEN_KEY) || '';
    let gameId = '';
    let lastHash = '';
    let saving = false;
    let timer = 0;

    function rememberToken() {
        const hash = new URLSearchParams(location.hash.slice(1));
        const received = hash.get('club_token') || hash.get('token');
        if (!received) return;
        sessionStorage.setItem(TOKEN_KEY, received);
        token = received;
        history.replaceState(null, '', location.pathname + location.search);
    }

    function stableGameId(gameUrl, core) {
        let path = gameUrl;
        try { path = new URL(gameUrl, location.href).pathname; } catch (_) {}
        const clean = `${core || 'game'}-${path.split('/').pop() || 'game'}`
            .toLowerCase().replace(/\.(zip|7z|chd|bin|cue|gba|gbc|gb|nes|sfc|smc|z64|n64|v64|md|gen)$/i, '')
            .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
        return clean || 'game';
    }

    function endpoint(slot) {
        return `${API}/club/save?game=${encodeURIComponent(gameId)}&slot=${encodeURIComponent(slot)}&token=${encodeURIComponent(token)}`;
    }

    async function digest(bytes) {
        const hash = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(hash)).map(value => value.toString(16).padStart(2, '0')).join('');
    }

    function stateBytes(value) {
        if (value instanceof Uint8Array) return value;
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        return null;
    }

    async function upload(slot, state, name) {
        const bytes = stateBytes(state);
        if (!token || !bytes || !bytes.byteLength || saving) return false;
        const hash = await digest(bytes);
        if (slot === 'auto' && hash === lastHash) return true;
        saving = true;
        try {
            const response = await fetch(endpoint(slot), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/octet-stream', 'X-Save-Name': name || '' },
                body: bytes
            });
            if (response.status === 401) sessionStorage.removeItem(TOKEN_KEY);
            if (!response.ok) throw new Error(`Cloud save HTTP ${response.status}`);
            if (slot === 'auto') lastHash = hash;
            setStatus(slot === 'auto' ? 'Autosave salvo' : 'Slot salvo');
            return true;
        } catch (error) {
            console.warn('Neo cloud save:', error);
            setStatus('Falha ao salvar');
            return false;
        } finally { saving = false; }
    }

    async function download(slot) {
        if (!token) return null;
        const response = await fetch(endpoint(slot), { cache: 'no-store' });
        if (response.status === 404) return null;
        if (response.status === 401) sessionStorage.removeItem(TOKEN_KEY);
        if (!response.ok) throw new Error(`Cloud load HTTP ${response.status}`);
        return new Uint8Array(await response.arrayBuffer());
    }

    async function currentState() {
        const manager = window.EJS_emulator && window.EJS_emulator.gameManager;
        if (!manager || typeof manager.getState !== 'function') return null;
        return stateBytes(await manager.getState());
    }

    async function autosave() {
        const state = await currentState();
        if (state) await upload('auto', state, 'Autosave');
    }

    async function loadSlot(slot) {
        try {
            const state = await download(slot);
            if (!state) return setStatus('Slot vazio');
            const manager = window.EJS_emulator && window.EJS_emulator.gameManager;
            if (!manager || typeof manager.loadState !== 'function') return setStatus('Reabra o jogo para carregar');
            await manager.loadState(state);
            setStatus('Save carregado');
        } catch (error) { console.warn('Neo cloud load:', error); setStatus('Falha ao carregar'); }
    }

    function setStatus(message) {
        const element = document.getElementById('neo-cloud-status');
        if (!element) return;
        element.textContent = message;
        clearTimeout(element._clearTimer);
        element._clearTimer = setTimeout(() => { element.textContent = token ? 'Nuvem conectada' : 'Entre no Clube para salvar'; }, 2500);
    }

    function createControls() {
        const panel = document.createElement('div');
        panel.id = 'neo-cloud-panel';
        panel.innerHTML = `<button id="neo-cloud-toggle" type="button">☁ SAVES</button><div id="neo-cloud-menu"><div id="neo-cloud-status">${token ? 'Nuvem conectada' : 'Entre no Clube para salvar'}</div><div class="neo-cloud-grid"></div></div>`;
        document.body.appendChild(panel);
        const grid = panel.querySelector('.neo-cloud-grid');
        for (let number = 1; number <= 5; number++) {
            const slot = `manual-${number}`;
            const save = document.createElement('button'); save.type = 'button'; save.textContent = `Salvar ${number}`;
            save.onclick = async () => { const state = await currentState(); state ? upload(slot, state, `Slot ${number}`) : setStatus('Jogo ainda carregando'); };
            const load = document.createElement('button'); load.type = 'button'; load.textContent = `Carregar ${number}`; load.onclick = () => loadSlot(slot);
            grid.append(save, load);
        }
        panel.querySelector('#neo-cloud-toggle').onclick = () => panel.classList.toggle('open');
    }

    async function prepare(options) {
        rememberToken();
        gameId = stableGameId(options.game, options.core);
        createControls();
        window.EJS_gameID = Array.from(gameId).reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 7);
        if (token) {
            try {
                const automatic = await download('auto');
                if (automatic) {
                    const blobUrl = URL.createObjectURL(new Blob([automatic], { type: 'application/octet-stream' }));
                    window.EJS_loadStateURL = blobUrl;
                    lastHash = await digest(automatic);
                }
            } catch (error) { console.warn('Neo autosave load:', error); }
        }
        window.EJS_onSaveState = event => {
            const state = Array.isArray(event) ? event[1] : event && (event.state || event.save);
            if (state) upload('manual-1', state, 'Slot 1');
        };
        const previousStart = window.EJS_onGameStart;
        window.EJS_onGameStart = function () {
            if (typeof previousStart === 'function') previousStart.apply(this, arguments);
            clearInterval(timer);
            if (token) timer = setInterval(autosave, INTERVAL_MS);
        };
        addEventListener('pagehide', () => { clearInterval(timer); });
    }

    window.NeoCloudSaves = { prepare, autosave, loadSlot };
})();
