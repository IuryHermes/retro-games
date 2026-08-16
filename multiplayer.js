(function () {
    'use strict';

    const API = 'https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev';
    const TOKEN_KEY = 'neo_club_access';
    const peers = new Map();
    let socket = null;
    let room = null;
    let ticket = '';
    let clientId = '';
    let mediaStream = null;
    let iceServersPromise = null;
    let iceServersExpiresAt = 0;

    const token = () => sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('neo_account_access') || '';
    const params = new URLSearchParams(location.search);
    const gameName = params.get('title') || 'Jogo atual';
    const system = params.get('system') || window.EJS_core || 'game';
    const gameId = (() => {
        const game = params.get('game') || gameName;
        let file = game;
        try { file = new URL(game, location.href).pathname.split('/').pop() || game; } catch (_) {}
        return `${system}-${file}`.toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9._-]+/g, '-').slice(0, 120);
    })();

    function request(path, options = {}) {
        const access = token();
        if (!access) return Promise.reject(new Error('Entre na sua conta antes de jogar online.'));
        return fetch(`${API}${path}`, { ...options, headers: { Authorization: `Bearer ${access}`, ...(options.body ? { 'Content-Type':'application/json' } : {}), ...options.headers } }).then(async response => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.erro || 'Não foi possível acessar o multiplayer.');
            return data;
        });
    }

    function iceServers() {
        if (!iceServersPromise || Date.now() >= iceServersExpiresAt) {
            iceServersExpiresAt = Date.now() + 3.5 * 60 * 60 * 1000;
            iceServersPromise = request('/multiplayer/ice-servers').then(data => data.iceServers).catch(() => [{ urls:['stun:stun.cloudflare.com:3478'] }]);
        }
        return iceServersPromise;
    }

    async function collectMedia() {
        if (mediaStream) return mediaStream;
        const emulatorCanvas = window.EJS_emulator?.canvas || window.EJS_emulator?.gameManager?.Module?.canvas;
        const canvases = Array.from(document.querySelectorAll('#game canvas, canvas')).filter(candidate => candidate.width > 0 && candidate.height > 0);
        const canvas = emulatorCanvas?.captureStream ? emulatorCanvas : canvases.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
        if (!canvas?.captureStream) throw new Error('O vídeo do emulador ainda não está pronto. Tente novamente após o jogo iniciar.');
        for (let attempt = 0; attempt < 30; attempt++) {
            const audioState = window.EJS_emulator?.Module?.AL?.currentCtx;
            if (audioState?.audioCtx && audioState.sources && Object.keys(audioState.sources).length) break;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        let nativeStream = null;
        try { nativeStream = window.EJS_emulator?.collectScreenRecordingMediaTracks?.(canvas, 30) || null; }
        catch (error) { console.warn('Neo multiplayer native media:', error); }
        mediaStream = nativeStream?.getVideoTracks?.().length ? nativeStream : canvas.captureStream(30);
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (!videoTrack) throw new Error('Não foi possível capturar a imagem do jogo. Aguarde o Mario Kart aparecer e tente novamente.');
        if (typeof videoTrack.requestFrame === 'function') videoTrack.requestFrame();
        try {
            const audioState = window.EJS_emulator?.Module?.AL?.currentCtx;
            const context = audioState?.audioCtx;
            const sources = audioState?.sources;
            if (!mediaStream.getAudioTracks().length && context && sources) {
                const destination = context.createMediaStreamDestination();
                const nodes = sources instanceof Map ? Array.from(sources.values()) : Object.values(sources);
                for (const item of nodes.flat ? nodes.flat(Infinity) : nodes) {
                    const node = item?.node || item?.gain || item;
                    if (node?.connect) try { node.connect(destination); } catch (_) {}
                }
                destination.stream.getAudioTracks().forEach(track => mediaStream.addTrack(track));
            }
        } catch (error) { console.warn('Neo multiplayer audio:', error); }
        console.info('Neo multiplayer media:', { videoTracks:mediaStream.getVideoTracks().length, audioTracks:mediaStream.getAudioTracks().length });
        return mediaStream;
    }

    function send(payload) {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
    }

    function applyInput(seat, index, value) {
        if (!Number.isInteger(seat) || seat < 2 || seat > 4 || !Number.isInteger(index) || index < 0 || index > 15 || ![0, 1].includes(value)) return;
        const manager = window.EJS_emulator?.gameManager;
        if (manager?.simulateInput) manager.simulateInput(seat - 1, index, value);
    }

    async function ensurePeer(person) {
        if (!person.approved || person.host || peers.has(person.clientId)) return;
        const stream = await collectMedia();
        const pc = new RTCPeerConnection({ iceServers:await iceServers() });
        const channel = pc.createDataChannel('neo-controls', { ordered:false, maxRetransmits:0 });
        channel.onmessage = event => {
            try { const input = JSON.parse(event.data); applyInput(person.seat, Number(input.index), Number(input.value)); } catch (_) {}
        };
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        pc.onicecandidate = event => { if (event.candidate) send({ type:'signal', to:person.clientId, data:{ candidate:event.candidate } }); };
        pc.onconnectionstatechange = () => { if (['failed','closed','disconnected'].includes(pc.connectionState)) { pc.close(); peers.delete(person.clientId); } };
        peers.set(person.clientId, { pc, channel, candidates:[] });
        const offer = await pc.createOffer({ offerToReceiveAudio:false, offerToReceiveVideo:false });
        await pc.setLocalDescription(offer);
        send({ type:'signal', to:person.clientId, data:{ description:pc.localDescription } });
    }

    async function handleSignal(message) {
        const peer = peers.get(message.from);
        if (!peer) return;
        if (message.data?.description) {
            await peer.pc.setRemoteDescription(message.data.description);
            for (const candidate of peer.candidates.splice(0)) await peer.pc.addIceCandidate(candidate).catch(() => {});
        }
        if (message.data?.candidate) {
            if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(message.data.candidate).catch(() => {});
            else peer.candidates.push(message.data.candidate);
        }
    }

    function renderState(state) {
        room = state.room;
        const list = document.getElementById('neo-multi-players');
        const count = document.getElementById('neo-multi-count');
        if (!list) return;
        count.textContent = `${state.participants.length}/${room.maxPlayers} online`;
        list.replaceChildren();
        state.participants.forEach(person => {
            const row = document.createElement('div'); row.className = 'neo-multi-person';
            const label = document.createElement('span'); label.textContent = `${person.host ? '👑 ' : ''}${person.name} · ${person.seat ? `CONTROLE ${person.seat}` : 'AGUARDANDO'}`;
            row.appendChild(label);
            if (!person.host) {
                const actions = document.createElement('span');
                for (let seat = 2; seat <= room.maxPlayers; seat++) {
                    const button = document.createElement('button'); button.type = 'button'; button.textContent = String(seat); button.title = `Atribuir controle ${seat}`; button.onclick = () => send({ type:'assign', clientId:person.clientId, seat }); actions.appendChild(button);
                }
                const kick = document.createElement('button'); kick.type = 'button'; kick.textContent = '×'; kick.title = 'Remover jogador'; kick.onclick = () => send({ type:'kick', clientId:person.clientId }); actions.appendChild(kick); row.appendChild(actions);
                void ensurePeer(person).catch(error => setStatus(error.message));
            }
            list.appendChild(row);
        });
    }

    function connect() {
        const wsUrl = `${API.replace('https:', 'wss:')}/multiplayer/rooms/${room.id}/ws?ticket=${encodeURIComponent(ticket)}`;
        socket = new WebSocket(wsUrl);
        socket.onmessage = event => {
            const message = JSON.parse(event.data);
            if (message.type === 'welcome') clientId = message.clientId;
            if (message.type === 'state') renderState(message);
            if (message.type === 'signal') void handleSignal(message).catch(error => console.warn('Neo multiplayer signal:', error));
            if (message.type === 'input') applyInput(Number(message.seat), Number(message.index), Number(message.value));
        };
        socket.onclose = event => { setStatus(event.code === 1000 ? 'Sala encerrada.' : 'Conexão multiplayer encerrada.'); peers.forEach(peer => peer.pc.close()); peers.clear(); };
    }

    function setStatus(message) {
        const status = document.getElementById('neo-multi-status');
        if (status) status.textContent = message;
    }

    async function createRoom() {
        const button = document.getElementById('neo-multi-create');
        button.disabled = true; setStatus('Abrindo sala segura...');
        try {
            await collectMedia();
            const maxPlayers = Number(document.getElementById('neo-multi-max').value);
            const isPublic = document.getElementById('neo-multi-public').checked;
            const data = await request('/multiplayer/rooms', { method:'POST', body:JSON.stringify({ gameId, title:gameName, system, maxPlayers, isPublic }) });
            room = data.room; ticket = data.ticket; connect();
            document.getElementById('neo-multi-create-box').hidden = true;
            document.getElementById('neo-multi-room').hidden = false;
            const link = `${location.origin}/multiplayer-room.html?room=${encodeURIComponent(room.id)}`;
            document.getElementById('neo-multi-link').value = link;
            setStatus(isPublic ? 'Sala pública aberta. Aguarde jogadores.' : 'Sala privada aberta. Compartilhe o convite.');
            void loadOnlinePlayers();
        } catch (error) { setStatus(error.message); button.disabled = false; }
    }

    async function loadOnlinePlayers() {
        const list = document.getElementById('neo-multi-online-list');
        if (!list || !room) return;
        list.textContent = 'Consultando jogadores online...';
        try {
            await request('/social/heartbeat', { method:'POST', body:JSON.stringify({ page:'game' }) });
            const data = await request('/social/players');
            list.replaceChildren();
            const onlinePlayers = (data.players || []).filter(player => player.online);
            if (!onlinePlayers.length) { list.textContent = 'Nenhum outro jogador online agora.'; return; }
            onlinePlayers.forEach(player => {
                const row = document.createElement('div'); row.className = 'neo-multi-person';
                const name = document.createElement('span'); name.textContent = player.name;
                const invite = document.createElement('button'); invite.type = 'button'; invite.textContent = 'CONVIDAR';
                invite.onclick = async () => { invite.disabled = true; try { await request('/social/invite', { method:'POST', body:JSON.stringify({ toUid:player.uid, roomId:room.id }) }); invite.textContent = 'ENVIADO ✓'; } catch (error) { invite.disabled = false; setStatus(error.message); } };
                row.append(name, invite); list.appendChild(row);
            });
        } catch (error) { list.textContent = error.message; }
    }

    function dockOnlineButton(panel) {
        const toggle = panel.querySelector('#neo-multi-toggle');
        const attach = () => {
            const menu = document.querySelector('.ejs_menu_bar');
            if (!menu || toggle.parentElement === menu) return Boolean(menu);
            toggle.classList.add('ejs_menu_button'); menu.appendChild(toggle); return true;
        };
        if (!attach()) {
            const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
            observer.observe(document.documentElement, { childList:true, subtree:true });
            setTimeout(() => observer.disconnect(), 30000);
        }
    }

    let socialSince = Date.now() - 60000;
    async function socialPulse() {
        if (!token()) return;
        try {
            await request('/social/heartbeat', { method:'POST', body:JSON.stringify({ page:'game' }) });
            const data = await request(`/social/events?since=${socialSince}`);
            for (const event of data.events || []) {
                socialSince = Math.max(socialSince, event.createdAt);
                const notice = document.createElement('div');
                notice.style.cssText = 'position:fixed;right:12px;bottom:70px;z-index:10000000;max-width:330px;padding:13px;background:#061109;color:#fff;border:1px solid #00cc44;font:12px monospace';
                notice.textContent = event.type === 'invite' ? `${event.fromName} convidou você para ${event.title}. ` : `Mensagem de ${event.fromName}: ${event.preview}`;
                if (event.type === 'invite') { const link = document.createElement('a'); link.href = `multiplayer-room.html?room=${encodeURIComponent(event.roomId)}`; link.textContent = 'ENTRAR'; link.style.color = '#55ff88'; notice.appendChild(link); }
                document.body.appendChild(notice); setTimeout(() => notice.remove(), 15000);
            }
        } catch (_) {}
    }

    function createPanel() {
        const style = document.createElement('style');
        style.textContent = '#neo-multiplayer-panel{position:fixed;right:8px;top:8px;z-index:9999999;color:#dfffe8;font:12px monospace}#neo-multi-toggle,#neo-multi-menu button,#neo-multi-menu select{border:1px solid #00cc44;background:#061109;color:#55ff88;padding:8px;cursor:pointer}#neo-multi-toggle.ejs_menu_button{position:static;width:auto;height:auto;min-width:46px;border:0;background:transparent;padding:0 8px;font-size:11px}#neo-multi-menu{display:none;width:min(350px,92vw);max-height:80dvh;overflow:auto;margin-top:5px;padding:10px;border:1px solid #00cc44;background:rgba(0,0,0,.96);box-shadow:0 0 22px rgba(0,204,68,.25)}#neo-multiplayer-panel.open #neo-multi-menu{display:block}#neo-multi-status{color:#a9cdb2;line-height:1.45;margin:8px 0}#neo-multi-create-box{display:grid;gap:8px}#neo-multi-create-box label{display:flex;align-items:center;justify-content:space-between;gap:10px}#neo-multi-room input{width:100%;margin:7px 0;background:#111;border:1px solid #555;color:#fff;padding:7px}.neo-multi-person{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #253129}.neo-multi-person button{padding:4px 7px;margin-left:3px}#neo-multi-online-list{max-height:180px;overflow:auto;border-top:1px solid #253129;margin-top:8px}#neo-multi-close{width:100%;margin-top:9px;border-color:#ff4f61!important;color:#ff6b7b!important}';
        style.textContent += '#neo-multi-toggle img{width:30px;height:30px;display:block;object-fit:contain}';
        document.head.appendChild(style);
        const panel = document.createElement('section'); panel.id = 'neo-multiplayer-panel';
        panel.innerHTML = `<button id="neo-multi-toggle" type="button">🌐 JOGAR ONLINE</button><div id="neo-multi-menu"><strong>MULTIPLAYER</strong><div id="neo-multi-status">Abra uma sala e transforme visitantes em controles remotos.</div><div id="neo-multi-create-box"><label>Jogadores <select id="neo-multi-max"><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label><label><input id="neo-multi-public" type="checkbox" checked> Sala pública</label><button id="neo-multi-create" type="button">ABRIR SALA</button></div><div id="neo-multi-room" hidden><div id="neo-multi-count"></div><input id="neo-multi-link" readonly><button id="neo-multi-copy" type="button">COPIAR CONVITE</button><strong>CONVIDAR JOGADORES ONLINE</strong><div id="neo-multi-online-list"></div><div id="neo-multi-players"></div><button id="neo-multi-close" type="button">ENCERRAR SALA</button></div></div>`;
        document.body.appendChild(panel);
        panel.querySelector('#neo-multi-toggle').innerHTML = '<img src="assets/imagens-videos/imagens do menu/online.png" alt=""><span>JOGAR ONLINE</span>';
        panel.querySelector('#neo-multi-toggle').onclick = () => panel.classList.toggle('open');
        panel.querySelector('#neo-multi-create').onclick = createRoom;
        panel.querySelector('#neo-multi-copy').onclick = async () => { await navigator.clipboard.writeText(panel.querySelector('#neo-multi-link').value); setStatus('Convite copiado.'); };
        panel.querySelector('#neo-multi-close').onclick = () => { send({ type:'close' }); socket?.close(); };
        if (system === 'n64') panel.querySelector('#neo-multi-max').value = '4';
        dockOnlineButton(panel);
        void socialPulse(); setInterval(socialPulse, 15000);
    }

    addEventListener('DOMContentLoaded', createPanel, { once:true });
})();
