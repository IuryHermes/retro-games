(function () {
    'use strict';

    const API = 'https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev';
    const TOKEN_KEY = 'neo_club_access';
    const PENDING_HISTORY_KEY = 'neo_pending_history';
    const INTERVAL_MS = 60000;
    const IMAGE_INTERVAL_MS = 10 * 60000;
    let token = sessionStorage.getItem(TOKEN_KEY) || '';
    let gameId = '';
    let gameName = '';
    let gameSystem = '';
    let lastHash = '';
    let saving = false;
    let automaticEnabled = false;
    let timer = 0;
    let initialAutosaveTimer = 0;
    let autosavePending = false;
    let autosaveImagePending = false;
    let lastAutosaveImageAt = 0;
    const recoveryMode = new URLSearchParams(location.search).get('recovery') === '1';

    function startRecovery() {
        const url = new URL(location.href);
        url.searchParams.set('recovery', '1');
        location.replace(url.href);
    }

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

    function localSaveDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('neo-local-saves', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('states');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function localSaveGet() {
        const database = await localSaveDatabase();
        return new Promise((resolve, reject) => {
            const request = database.transaction('states').objectStore('states').get(gameId);
            request.onsuccess = () => resolve(stateBytes(request.result));
            request.onerror = () => reject(request.error);
        }).finally(() => database.close());
    }

    async function localSavePut(bytes) {
        const database = await localSaveDatabase();
        return new Promise((resolve, reject) => {
            const request = database.transaction('states', 'readwrite').objectStore('states').put(bytes, gameId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        }).finally(() => database.close());
    }

    async function flushPendingHistory() {
        if (!token) return false;
        let pending;
        try { pending = JSON.parse(sessionStorage.getItem(PENDING_HISTORY_KEY) || 'null'); }
        catch (_) { sessionStorage.removeItem(PENDING_HISTORY_KEY); return false; }
        if (!pending?.id) return false;
        try {
            const response = await fetch(`${API}/account/history`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(pending),
                cache: 'no-store'
            });
            if (!response.ok) throw new Error(`History HTTP ${response.status}`);
            const queued = JSON.parse(sessionStorage.getItem(PENDING_HISTORY_KEY) || 'null');
            if (queued?.id === pending.id) sessionStorage.removeItem(PENDING_HISTORY_KEY);
            return true;
        } catch (error) {
            console.warn('Neo history retry:', error);
            return false;
        }
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
        if (!bytes || !bytes.byteLength || saving) return false;
        const hash = await digest(bytes);
        if (slot === 'auto' && hash === lastHash) return true;
        saving = true;
        try {
            if (!token && slot === 'auto') {
                await localSavePut(bytes);
                lastHash = hash; setStatus('Autosave salvo neste aparelho'); return true;
            }
            if (!token) return false;
            const response = await fetch(endpoint(slot), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/octet-stream', 'X-Save-Name': name || '', 'X-Game-Name': encodeURIComponent(gameName), 'X-Game-System': gameSystem },
                body: bytes
            });
            if (response.status === 401) sessionStorage.removeItem(TOKEN_KEY);
            if (slot === 'auto' && response.status === 409) {
                automaticEnabled = false;
                setStatus('Limite de autosaves atingido');
                return false;
            }
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

    async function uploadAutosaveImage() {
        const manager = window.EJS_emulator && window.EJS_emulator.gameManager;
        if (!token || !manager || typeof manager.screenshot !== 'function') return false;
        try {
            const image = stateBytes(await manager.screenshot());
            if (!image?.byteLength) return false;
            const response = await fetch(`${API}/club/save-image?game=${encodeURIComponent(gameId)}&token=${encodeURIComponent(token)}`, {
                method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: image
            });
            return response.ok;
        } catch (error) {
            console.warn('Neo autosave image:', error);
            return false;
        }
    }

    function scheduleAutosaveImage() {
        const now = Date.now();
        if (autosaveImagePending || now - lastAutosaveImageAt < IMAGE_INTERVAL_MS) return;
        autosaveImagePending = true;
        const run = async () => {
            try {
                if (await uploadAutosaveImage()) lastAutosaveImageAt = Date.now();
            } finally {
                autosaveImagePending = false;
            }
        };
        // The save state remains every minute. Only the decorative hero image
        // is captured separately and at most once every ten minutes.
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => { void run(); }, { timeout: 10000 });
        } else {
            setTimeout(() => { void run(); }, 1500);
        }
    }

    async function autosave() {
        if (!automaticEnabled || autosavePending) return;
        autosavePending = true;
        try {
            const state = await currentState();
            if (state && await upload('auto', state, 'Autosave')) scheduleAutosaveImage();
        } finally {
            autosavePending = false;
        }
    }

    function scheduleAutosave() {
        if (!automaticEnabled || autosavePending) return;
        const run = () => { void autosave(); };
        // Keep the one-minute cadence while placing the expensive snapshot
        // between frames whenever the browser exposes an idle window.
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(run, { timeout: 4000 });
        } else {
            setTimeout(run, 0);
        }
    }

    async function automaticChoice() {
        // Autosave means continue automatically. A broken state can still be
        // bypassed safely through the recovery action, which never deletes it.
        return true;
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
        element._clearTimer = setTimeout(() => { element.textContent = token ? 'Nuvem conectada' : 'Autosave neste aparelho'; }, 2500);
    }

    async function sessionInfo() {
        if (!token) return null;
        const response = await fetch(`${API}/club/session`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (!response.ok) return null;
        return response.json();
    }

    function createControls(session) {
        const panel = document.createElement('div');
        panel.id = 'neo-cloud-panel';
        const planLimit = session ? session.manualSaveLimit : 0;
        const autoText = session ? (session.automaticGameLimit === null ? 'autosaves ilimitados' : `${session.automaticGamesUsed}/${session.automaticGameLimit} jogos com autosave`) : '';
        const planText = session ? `${planLimit === null ? 'Slots manuais ilimitados' : `${planLimit} slots manuais`} · ${autoText}` : 'Autosave protegido neste aparelho';
        panel.innerHTML = `<button id="neo-cloud-toggle" type="button">☁ SAVES</button><div id="neo-cloud-menu"><div id="neo-cloud-status">${planText}</div><div class="neo-cloud-grid"></div></div>`;
        document.body.appendChild(panel);
        const grid = panel.querySelector('.neo-cloud-grid');
        let visibleSlots = planLimit === null ? 7 : planLimit;
        const appendSlot = number => {
            const slot = `manual-${number}`;
            const save = document.createElement('button'); save.type = 'button'; save.textContent = `Salvar ${number}`;
            save.onclick = async () => { const state = await currentState(); state ? upload(slot, state, `Slot ${number}`) : setStatus('Jogo ainda carregando'); };
            const load = document.createElement('button'); load.type = 'button'; load.textContent = `Carregar ${number}`; load.onclick = () => loadSlot(slot);
            grid.append(save, load);
        };
        for (let number = 1; number <= visibleSlots; number++) appendSlot(number);
        if (planLimit === null) {
            const more = document.createElement('button'); more.type = 'button'; more.textContent = '+ NOVO SLOT'; more.style.gridColumn = '1 / -1';
            more.onclick = () => { visibleSlots += 1; appendSlot(visibleSlots); grid.appendChild(more); };
            grid.appendChild(more);
        }
        panel.querySelector('#neo-cloud-toggle').onclick = () => panel.classList.toggle('open');
        const recovery = document.createElement('button');
        recovery.type = 'button';
        recovery.textContent = recoveryMode ? 'SESSÃO SEGURA ATIVA' : 'JOGO TRAVOU? RECUPERAR';
        recovery.style.cssText = 'width:100%;margin-top:8px;border-color:#e9b949;color:#ffe29a';
        recovery.disabled = recoveryMode;
        recovery.onclick = () => {
            if (confirm('O jogo será reiniciado sem carregar o autosave. Seu progresso anterior ficará guardado e não será apagado. Continuar?')) startRecovery();
        };
        panel.querySelector('#neo-cloud-menu').appendChild(recovery);
        if (recoveryMode && token) {
            const previous = document.createElement('button');
            previous.type = 'button'; previous.textContent = 'CARREGAR CHECKPOINT ANTERIOR';
            previous.style.cssText = 'width:100%;margin-top:8px;border-color:#e9b949;color:#ffe29a';
            previous.onclick = () => loadSlot('previous');
            panel.querySelector('#neo-cloud-menu').appendChild(previous);
        }
    }

    async function prepare(options) {
        rememberToken();
        gameId = stableGameId(options.game, options.core);
        // Save states are snapshots of a specific emulator-core layout. The
        // August 2026 N64 renderer migration and the PS1 multidisc migration
        // changed that layout, so never inject their legacy snapshots into the
        // current cores. Old objects remain untouched for support/recovery.
        if (options.core === 'n64') gameId = `${gameId}-core2`;
        if (options.system === 'ps1' && options.multidisc) gameId = `${gameId}-disc2`;
        gameName = String(options.name || gameId).slice(0, 100);
        gameSystem = String(options.system || options.core || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
        await flushPendingHistory();
        let session = null;
        try { session = await sessionInfo(); } catch (_) {}
        if (token && !session) { sessionStorage.removeItem(TOKEN_KEY); token = ''; }
        createControls(session);
        window.EJS_gameID = Array.from(gameId).reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 7);
        automaticEnabled = Boolean(!recoveryMode && (!token || (session && (session.automaticGameLimit === null || session.automaticGamesUsed < session.automaticGameLimit))));
        if (!token && !recoveryMode) {
            try {
                const automatic = await localSaveGet();
                if (automatic) {
                    const blobUrl = URL.createObjectURL(new Blob([automatic], { type: 'application/octet-stream' }));
                    window.EJS_loadStateURL = blobUrl; window.EJS_loadStateOnStart = true;
                    lastHash = await digest(automatic);
                }
            } catch (error) { console.warn('Neo local autosave load:', error); }
        }
        if (token && !recoveryMode) {
            try {
                const automatic = await download('auto');
                if (automatic) {
                    if (await automaticChoice(session)) {
                        automaticEnabled = true;
                        const blobUrl = URL.createObjectURL(new Blob([automatic], { type: 'application/octet-stream' }));
                        window.EJS_loadStateURL = blobUrl;
                        window.EJS_loadStateOnStart = true;
                        lastHash = await digest(automatic);
                    } else automaticEnabled = false;
                }
            } catch (error) { console.warn('Neo autosave load:', error); }
        }
        if (recoveryMode) {
            automaticEnabled = false;
            setStatus('Sessão segura: autosave anterior preservado');
        }
        window.EJS_onSaveState = event => {
            const state = Array.isArray(event) ? event[1] : event && (event.state || event.save);
            if (state) upload('manual-1', state, 'Slot 1');
        };
        const previousStart = window.EJS_onGameStart;
        window.EJS_onGameStart = function () {
            if (typeof previousStart === 'function') previousStart.apply(this, arguments);
            clearInterval(timer);
            clearTimeout(initialAutosaveTimer);
            if (automaticEnabled) {
                // Register a newly played game promptly in the account library.
                // Previously it appeared only after a full minute of gameplay.
                initialAutosaveTimer = setTimeout(scheduleAutosave, 10000);
                timer = setInterval(scheduleAutosave, INTERVAL_MS);
            }
        };
        addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && automaticEnabled) void autosave();
        });
        addEventListener('pagehide', () => { clearTimeout(initialAutosaveTimer); clearInterval(timer); });
    }

    window.NeoCloudSaves = { prepare, autosave, loadSlot };
})();
