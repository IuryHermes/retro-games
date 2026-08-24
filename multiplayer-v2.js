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
    let audioCaptureDestination = null;
    let audioCaptureContext = null;
    let audioCaptureTimer = 0;
    let iceServersPromise = null;
    let iceServersExpiresAt = 0;
    const seenParticipants = new Set();
    let toastTimer = 0;
    let autoStartTimer = 0;
    let matchStarted = false;

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

    function audioState() {
        return window.EJS_emulator?.Module?.AL?.currentCtx || window.EJS_emulator?.gameManager?.Module?.AL?.currentCtx || null;
    }

    function refreshAudioCapture() {
        const state = audioState();
        const context = state?.audioCtx;
        if (!context || !state?.sources) return null;
        if (!audioCaptureDestination || audioCaptureContext !== context) {
            audioCaptureContext = context;
            audioCaptureDestination = context.createMediaStreamDestination();
            const replacementTrack = audioCaptureDestination.stream.getAudioTracks()[0];
            if (replacementTrack && mediaStream?.getAudioTracks().length) {
                for (const oldTrack of mediaStream.getAudioTracks()) mediaStream.removeTrack(oldTrack);
                mediaStream.addTrack(replacementTrack);
                for (const peer of peers.values()) {
                    const sender = peer.pc.getSenders().find(candidate => candidate.track?.kind === 'audio');
                    if (sender) void sender.replaceTrack(replacementTrack).catch(error => console.warn('Neo multiplayer audio replace:', error));
                }
            }
        }
        const sources = state.sources instanceof Map ? Array.from(state.sources.values()) : Object.values(state.sources);
        for (const item of sources.flat ? sources.flat(Infinity) : sources) {
            const node = item?.gain || item?.node || item;
            if (node?.connect) {
                try { node.disconnect(audioCaptureDestination); } catch (_) {}
                try { node.connect(audioCaptureDestination); } catch (_) {}
            }
        }
        return audioCaptureDestination.stream.getAudioTracks()[0] || null;
    }

    async function prepareAudioCapture() {
        for (let attempt = 0; attempt < 50; attempt++) {
            const track = refreshAudioCapture();
            if (track?.readyState === 'live') {
                if (!audioCaptureTimer) audioCaptureTimer = setInterval(refreshAudioCapture, 200);
                return track;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    }

    async function collectMedia() {
        if (mediaStream) return mediaStream;
        const emulatorCanvas = window.EJS_emulator?.canvas || window.EJS_emulator?.gameManager?.Module?.canvas;
        const canvases = Array.from(document.querySelectorAll('#game canvas, canvas')).filter(candidate => candidate.width > 0 && candidate.height > 0);
        const canvas = emulatorCanvas?.captureStream ? emulatorCanvas : canvases.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
        if (!canvas?.captureStream) throw new Error('O vídeo do emulador ainda não está pronto. Tente novamente após o jogo iniciar.');
        const audioTrack = await prepareAudioCapture();
        let nativeStream = null;
        try { nativeStream = window.EJS_emulator?.collectScreenRecordingMediaTracks?.(canvas, 30) || null; }
        catch (error) { console.warn('Neo multiplayer native media:', error); }
        mediaStream = nativeStream?.getVideoTracks?.().length ? nativeStream : canvas.captureStream(30);
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (!videoTrack) throw new Error('Não foi possível capturar a imagem do jogo. Aguarde o Mario Kart aparecer e tente novamente.');
        if (typeof videoTrack.requestFrame === 'function') videoTrack.requestFrame();
        for (const oldTrack of mediaStream.getAudioTracks()) mediaStream.removeTrack(oldTrack);
        if (audioTrack) mediaStream.addTrack(audioTrack);
        else console.warn('Neo multiplayer audio: o contexto do emulador ainda não estava disponível.');
        console.info('Neo multiplayer media:', { videoTracks:mediaStream.getVideoTracks().length, audioTracks:mediaStream.getAudioTracks().length });
        return mediaStream;
    }

    function send(payload) {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
    }

    function showToast(message, duration = 3000) {
        let notice = document.getElementById('neo-multi-toast');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'neo-multi-toast';
            notice.setAttribute('role', 'status');
            notice.setAttribute('aria-live', 'polite');
            document.body.appendChild(notice);
        }
        clearTimeout(toastTimer);
        notice.textContent = message;
        notice.classList.add('visible');
        toastTimer = setTimeout(() => notice.classList.remove('visible'), duration);
    }

    function applyInput(seat, index, value) {
        const digital = index >= 0 && index <= 15 && [0, 1].includes(value);
        const analog = index >= 16 && index <= 23 && Number.isInteger(value) && value >= 0 && value <= 0x7fff;
        if (!Number.isInteger(seat) || seat < 2 || seat > 4 || !Number.isInteger(index) || (!digital && !analog)) return;
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
        const lobbyState = document.getElementById('neo-multi-lobby-state');
        const sessionButton = document.getElementById('neo-multi-session');
        if (!list) return;
        count.textContent = `${state.participants.length}/${room.maxPlayers} online`;
        const guests = state.participants.filter(person => !person.host);
        if (lobbyState && !matchStarted) lobbyState.innerHTML = guests.length === 0
            ? '<strong>AGUARDANDO JOGADOR 2</strong><span class="neo-wait-dots" aria-hidden="true"><i></i><i></i><i></i></span><small>A partida ficará pronta assim que o jogador convidado entrar na sala.</small>'
            : `<strong>✓ ${guests[0].name.toUpperCase()} ENTROU NA SALA!</strong><small>Controle ${guests[0].seat} atribuído automaticamente. A partida vai começar agora.</small>`;
        if (sessionButton) sessionButton.textContent = `🟢 ONLINE ${state.participants.length}/${room.maxPlayers}`;
        list.replaceChildren();
        state.participants.forEach(person => {
            if (!person.host && !seenParticipants.has(person.clientId)) {
                showToast(`✓ ${person.name} entrou na sala! Controle ${person.seat} atribuído automaticamente.`, 5000);
            }
            seenParticipants.add(person.clientId);
            const row = document.createElement('div'); row.className = 'neo-multi-person';
            const label = document.createElement('span'); label.textContent = `${person.host ? '👑 ' : '✓ '}${person.name}`;
            row.appendChild(label);
            if (!person.host) {
                const actions = document.createElement('span');
                const kick = document.createElement('button'); kick.type = 'button'; kick.textContent = '×'; kick.title = 'Remover jogador'; kick.onclick = () => send({ type:'kick', clientId:person.clientId }); actions.appendChild(kick); row.appendChild(actions);
                void ensurePeer(person).catch(error => setStatus(error.message));
            }
            list.appendChild(row);
        });
        if (guests.length && !matchStarted && !autoStartTimer) {
            autoStartTimer = setTimeout(() => {
                autoStartTimer = 0;
                matchStarted = true;
                const panel = document.getElementById('neo-multiplayer-panel');
                panel?.classList.remove('lobby', 'open');
                panel?.classList.add('playing');
                showToast(`PARTIDA INICIADA — ${guests[0].name} está no controle ${guests[0].seat}.`, 5000);
            }, 2200);
        }
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
        socket.onclose = event => { resetRoomUi(event.code === 1000 ? 'Sala encerrada.' : 'Conexão multiplayer encerrada.'); };
    }

    function setStatus(message) {
        const status = document.getElementById('neo-multi-status');
        if (status) status.textContent = message;
    }

    function renderInviteQr(link) {
        const target = document.getElementById('neo-multi-qr-code');
        if (!target) return;
        target.replaceChildren();
        const draw = () => {
            target.replaceChildren();
            new window.QRCode(target, { text:link, width:156, height:156, colorDark:'#061109', colorLight:'#ffffff', correctLevel:window.QRCode.CorrectLevel.M });
        };
        if (window.QRCode) { draw(); return; }
        target.textContent = 'Gerando QR Code...';
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = draw;
        script.onerror = () => { target.textContent = 'Use o botão COPIAR CONVITE.'; };
        document.head.appendChild(script);
    }

    function resetRoomUi(message = 'Sala encerrada.') {
        peers.forEach(peer => peer.pc.close());
        peers.clear();
        seenParticipants.clear();
        if (autoStartTimer) { clearTimeout(autoStartTimer); autoStartTimer = 0; }
        matchStarted = false;
        if (audioCaptureTimer) { clearInterval(audioCaptureTimer); audioCaptureTimer = 0; }
        if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null; audioCaptureDestination = null; audioCaptureContext = null;
        socket = null; room = null; ticket = ''; clientId = '';
        const roomBox = document.getElementById('neo-multi-room');
        if (roomBox) roomBox.hidden = true;
        const panel = document.getElementById('neo-multiplayer-panel');
        panel?.classList.remove('open', 'lobby', 'playing');
        const sessionButton = document.getElementById('neo-multi-session');
        if (sessionButton) sessionButton.textContent = '🟢 ONLINE';
        document.getElementById('neo-multi-players')?.replaceChildren();
        const link = document.getElementById('neo-multi-link');
        if (link) link.value = '';
        document.getElementById('neo-multi-qr-code')?.replaceChildren();
        setStatus(message);
    }

    function closeRoom() {
        const activeSocket = socket;
        const closeButton = document.getElementById('neo-multi-close');
        if (closeButton) closeButton.disabled = true;
        setStatus('Encerrando sala...');
        if (activeSocket?.readyState === WebSocket.OPEN) {
            activeSocket.send(JSON.stringify({ type:'close' }));
            setTimeout(() => {
                if (activeSocket.readyState === WebSocket.OPEN || activeSocket.readyState === WebSocket.CONNECTING) activeSocket.close(1000, 'Sala encerrada');
            }, 180);
        }
        resetRoomUi('Sala encerrada. Você pode abrir outra quando quiser.');
        document.getElementById('neo-multiplayer-panel')?.classList.remove('open');
        showToast('Sessão online encerrada.', 2500);
    }

    async function createRoom() {
        setStatus('Abrindo sala segura...');
        try {
            await collectMedia();
            const maxPlayers = system === 'n64' ? 4 : 2;
            const isPublic = true;
            const data = await request('/multiplayer/rooms', { method:'POST', body:JSON.stringify({ gameId, title:gameName, system, maxPlayers, isPublic }) });
            room = data.room; ticket = data.ticket; connect();
            document.getElementById('neo-multi-room').hidden = false;
            document.getElementById('neo-multiplayer-panel')?.classList.add('open', 'lobby');
            const link = `${location.origin}/multiplayer-room.html?room=${encodeURIComponent(room.id)}`;
            document.getElementById('neo-multi-link').value = link;
            renderInviteQr(link);
            setStatus(isPublic ? 'Sala pública aberta. Aguarde jogadores.' : 'Sala privada aberta. Compartilhe o convite.');
            void loadOnlinePlayers();
        } catch (error) {
            setStatus(`${error.message} Recarregue o jogo para tentar novamente.`);
        }
    }

    async function autoCreateRoom() {
        const panel = document.getElementById('neo-multiplayer-panel');
        const roomBox = document.getElementById('neo-multi-room');
        roomBox.hidden = false;
        panel.classList.add('open', 'lobby');
        document.getElementById('neo-multi-lobby-state').innerHTML = '<strong>PREPARANDO SALA ONLINE</strong><span class="neo-wait-dots" aria-hidden="true"><i></i><i></i><i></i></span><small>O lobby abrirá automaticamente assim que o jogo estiver pronto.</small>';
        setStatus('Iniciando o jogo e preparando o lobby...');
        for (let attempt = 0; attempt < 90; attempt++) {
            const canvas = window.EJS_emulator?.canvas || window.EJS_emulator?.gameManager?.Module?.canvas || Array.from(document.querySelectorAll('#game canvas, canvas')).find(candidate => candidate.width > 0 && candidate.height > 0);
            if (canvas?.captureStream) { await createRoom(); return; }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        setStatus('O jogo demorou para iniciar. Recarregue a página para tentar novamente.');
    }

    function invitationText() {
        return `Venha jogar ${gameName} comigo no NeoTerminalRoom!`;
    }

    async function shareInvite(platform) {
        const link = document.getElementById('neo-multi-link')?.value;
        if (!link) return;
        const text = invitationText();
        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, '_blank', 'noopener,noreferrer');
            return;
        }
        if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank', 'noopener,noreferrer');
            return;
        }
        if (navigator.share) {
            try { await navigator.share({ title:`Jogar ${gameName} online`, text, url:link }); } catch (error) { if (error.name !== 'AbortError') throw error; }
            return;
        }
        await navigator.clipboard.writeText(`${text} ${link}`);
        showToast(`Convite copiado. Cole no ${platform === 'discord' ? 'Discord' : platform === 'instagram' ? 'Instagram' : 'aplicativo desejado'}.`);
        if (platform === 'discord') window.open('https://discord.com/app', '_blank', 'noopener,noreferrer');
        if (platform === 'instagram') window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
    }

    async function loadOnlinePlayers() {
        const list = document.getElementById('neo-multi-online-list');
        if (!list || !room) return;
        list.textContent = 'Consultando jogadores online...';
        try {
            await request('/social/heartbeat', { method:'POST', body:JSON.stringify({ page:'game', roomId:room?.id || '', roomTitle:room?.title || gameName }) });
            const data = await request('/social/players');
            list.replaceChildren();
            const onlinePlayers = (data.players || []).filter(player => player.online);
            if (!onlinePlayers.length) { list.textContent = 'Nenhum outro jogador online agora.'; return; }
            onlinePlayers.forEach(player => {
                const row = document.createElement('div'); row.className = 'neo-multi-person';
                const name = document.createElement('span'); name.textContent = player.name;
                const invite = document.createElement('button'); invite.type = 'button'; invite.textContent = 'CONVIDAR';
                invite.onclick = async () => { invite.disabled = true; try { await request('/social/invite', { method:'POST', body:JSON.stringify({ toUid:player.uid, roomId:room.id }) }); row.remove(); showToast('Seu convite foi enviado com sucesso.', 3000); document.getElementById('neo-multiplayer-panel')?.classList.remove('open'); } catch (error) { invite.disabled = false; setStatus(error.message); } };
                row.append(name, invite); list.appendChild(row);
            });
        } catch (error) { list.textContent = error.message; }
    }

    let socialSince = Date.now() - 60000;
    function systemNotification(event) {
        if (!("Notification" in window) || Notification.permission !== 'granted' || event.type !== 'invite') return;
        new Notification('Convite para jogar online', { body:`${event.fromName} convidou você para ${event.title}.`, icon:`assets/avatars/${event.fromAvatar || 'avatar-01'}.png`, tag:`neo-invite-${event.roomId}` });
    }
    async function socialPulse() {
        if (!token()) return;
        try {
            await request('/social/heartbeat', { method:'POST', body:JSON.stringify({ page:'game', roomId:room?.id || '', roomTitle:room?.title || gameName }) });
            const data = await request(`/social/events?since=${socialSince}`);
            for (const event of data.events || []) {
                socialSince = Math.max(socialSince, event.createdAt);
                const notice = document.createElement('div');
                notice.style.cssText = 'position:fixed;right:12px;bottom:70px;z-index:10000000;max-width:330px;padding:13px;background:#061109;color:#fff;border:1px solid #00cc44;font:12px monospace';
                notice.textContent = event.type === 'invite' ? `${event.fromName} convidou você para ${event.title}. ` : `Mensagem de ${event.fromName}: ${event.preview}`;
                if (event.type === 'invite') { const link = document.createElement('a'); link.href = `multiplayer-room.html?room=${encodeURIComponent(event.roomId)}`; link.textContent = 'ENTRAR'; link.style.color = '#55ff88'; notice.appendChild(link); }
                document.body.appendChild(notice); setTimeout(() => notice.remove(), 15000);
                systemNotification(event);
            }
        } catch (_) {}
    }

    function createPanel() {
        const style = document.createElement('style');
        style.textContent = '#neo-multiplayer-panel{position:fixed;right:8px;top:8px;z-index:9999999;color:#dfffe8;font:12px monospace}#neo-multi-menu button,#neo-multi-menu select{border:1px solid #00cc44;background:#061109;color:#55ff88;padding:8px;cursor:pointer}#neo-multi-menu{display:none;width:min(350px,92vw);max-height:80dvh;overflow:auto;padding:10px;border:1px solid #00cc44;background:rgba(0,0,0,.96);box-shadow:0 0 22px rgba(0,204,68,.25)}#neo-multiplayer-panel.open #neo-multi-menu{display:block}#neo-multi-status{color:#a9cdb2;line-height:1.45;margin:8px 0}#neo-multi-rewards{margin:8px 0;padding:9px;border:1px solid #ffd166;border-radius:5px;background:#171407;color:#dfffe8;line-height:1.45}#neo-multi-rewards strong{display:block;color:#ffd166}#neo-live-participate{display:block;width:100%;margin:8px 0 5px;border-color:#5865f2!important;background:#5865f2!important;color:#fff!important;font-weight:bold}#neo-live-confirmation{display:block;color:#ffdca0;font-size:11px}#neo-live-confirmation.confirmed{color:#55ff88}#neo-multi-create-box{display:grid;gap:8px}#neo-multi-create-box label{display:flex;align-items:center;justify-content:space-between;gap:10px}#neo-multi-room input{width:100%;margin:7px 0;background:#111;border:1px solid #555;color:#fff;padding:7px}.neo-multi-person{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #253129}.neo-multi-person button{padding:4px 7px;margin-left:3px}#neo-multi-online-list{max-height:180px;overflow:auto;border-top:1px solid #253129;margin-top:8px}#neo-multi-share{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:7px 0 12px}#neo-multi-share button{margin:0}#neo-multi-close{width:100%;margin-top:9px;border-color:#ff4f61!important;color:#ff6b7b!important}#neo-multi-toast{position:fixed;left:50%;top:18px;z-index:10000001;max-width:min(90vw,520px);padding:13px 18px;transform:translate(-50%,-150%);opacity:0;border:1px solid #00cc44;border-radius:6px;background:#061109;color:#fff;box-shadow:0 0 24px rgba(0,204,68,.35);font:600 13px monospace;text-align:center;transition:.22s ease;pointer-events:none}#neo-multi-toast.visible{transform:translate(-50%,0);opacity:1}#neo-referral-link{display:block;margin-top:8px;color:#55ff88;font-weight:bold}@media(max-width:768px),(pointer:coarse){#neo-multiplayer-panel{top:auto;right:max(8px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom))}#neo-multi-menu{margin:0}}';
        style.textContent += '#neo-multi-session{display:none;border:1px solid #00cc44;background:#061109;color:#55ff88;padding:9px;font:700 12px monospace;cursor:pointer;box-shadow:0 0 18px rgba(0,204,68,.35)}#neo-multiplayer-panel.playing #neo-multi-session{display:block}#neo-multiplayer-panel.lobby{inset:0;display:grid;place-items:center;background:rgba(0,0,0,.86);backdrop-filter:blur(5px)}#neo-multiplayer-panel.lobby #neo-multi-menu{display:block;width:min(620px,92vw);max-height:90dvh;padding:clamp(16px,4vw,30px)}#neo-multi-lobby-title{color:#55ff88;font-size:clamp(18px,4vw,28px);font-weight:900;letter-spacing:.08em;text-align:center;margin-bottom:7px}#neo-multi-lobby-state{position:relative;overflow:hidden;padding:18px 14px;margin:12px 0;border:1px solid #35ef70;border-radius:8px;background:linear-gradient(110deg,#07160c,#0e2a17,#07160c);background-size:220% 100%;color:#fff;text-align:center;box-shadow:0 0 0 rgba(53,239,112,0);animation:neoLobbyGlow 1.8s ease-in-out infinite,neoLobbyFlow 3s linear infinite}#neo-multi-lobby-state strong{display:inline-block;color:#70ff9b;font-size:clamp(16px,4vw,23px);letter-spacing:.07em;animation:neoLobbyFloat 1.4s ease-in-out infinite}#neo-multi-lobby-state small{display:block;margin-top:10px;color:#e9fff0;font-size:12px;line-height:1.55}.neo-wait-dots{display:inline-flex;gap:5px;margin-left:9px;vertical-align:middle}.neo-wait-dots i{width:7px;height:7px;border-radius:50%;background:#70ff9b;animation:neoWaitDot 1.2s ease-in-out infinite}.neo-wait-dots i:nth-child(2){animation-delay:.16s}.neo-wait-dots i:nth-child(3){animation-delay:.32s}#neo-multi-invite-qr{display:flex;align-items:center;justify-content:center;gap:14px;margin:10px 0;padding:10px;border:1px dashed #35ef70;border-radius:8px;background:#fff;color:#061109;text-align:left}#neo-multi-qr-code{width:156px;min-width:156px;height:156px;display:grid;place-items:center;text-align:center}#neo-multi-qr-code img,#neo-multi-qr-code canvas{display:block!important;width:156px!important;height:156px!important}#neo-multi-qr-copy strong{display:block;font-size:14px;margin-bottom:6px}#neo-multi-qr-copy small{display:block;max-width:180px;line-height:1.45}@keyframes neoWaitDot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-7px);opacity:1}}@keyframes neoLobbyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes neoLobbyGlow{0%,100%{box-shadow:0 0 8px rgba(53,239,112,.2)}50%{box-shadow:0 0 25px rgba(53,239,112,.58)}}@keyframes neoLobbyFlow{to{background-position:-220% 0}}#neo-multi-start{width:100%;margin:12px 0 3px;font-weight:900;font-size:14px}#neo-multi-start:disabled{opacity:.42;cursor:not-allowed}@media(prefers-reduced-motion:reduce){#neo-multi-lobby-state,#neo-multi-lobby-state strong,.neo-wait-dots i{animation:none}}@media(max-width:520px){#neo-multi-invite-qr{flex-direction:column;text-align:center}#neo-multi-qr-copy small{max-width:260px}}@media(max-width:768px),(pointer:coarse){#neo-multiplayer-panel.lobby{top:0;right:0;bottom:0}}';
        style.textContent += '#neo-multi-qr-code canvas{display:none!important}#neo-multi-qr-code img{display:block!important;width:156px!important;height:156px!important;max-width:100%}';
        document.head.appendChild(style);
        const panel = document.createElement('section'); panel.id = 'neo-multiplayer-panel';
        panel.innerHTML = `<div id="neo-multi-menu"><strong>PARTIDA ONLINE</strong><div id="neo-multi-status">Preparando o lobby...</div><div id="neo-multi-room" hidden><div id="neo-multi-count"></div><input id="neo-multi-link" readonly><button id="neo-multi-copy" type="button">COPIAR CONVITE</button><div id="neo-multi-share"><button type="button" data-share="whatsapp">WHATSAPP</button><button type="button" data-share="discord">DISCORD</button><button type="button" data-share="instagram">INSTAGRAM</button><button type="button" data-share="facebook">FACEBOOK</button><button type="button" data-share="outros">OUTROS APPS</button></div><strong>CONVIDAR JOGADORES ONLINE</strong><div id="neo-multi-online-list"></div><div id="neo-multi-players"></div><button id="neo-multi-close" type="button">ENCERRAR SALA</button></div></div>`;
        panel.insertAdjacentHTML('afterbegin', '<button id="neo-multi-session" type="button">🟢 ONLINE</button>');
        const roomBox = panel.querySelector('#neo-multi-room');
        roomBox.insertAdjacentHTML('afterbegin', '<div id="neo-multi-lobby-title">LOBBY DA PARTIDA</div><div id="neo-multi-lobby-state"><strong>AGUARDANDO JOGADOR 2</strong><span class="neo-wait-dots" aria-hidden="true"><i></i><i></i><i></i></span><small>A partida ficará pronta assim que o jogador convidado entrar na sala.</small></div>');
        panel.querySelector('#neo-multi-link').insertAdjacentHTML('beforebegin', '<div id="neo-multi-invite-qr"><div id="neo-multi-qr-code" aria-label="QR Code do convite"></div><div id="neo-multi-qr-copy"><strong>ENTRAR PELO CELULAR</strong><small>Aponte a câmera do smartphone para este código e abra o convite.</small></div></div>');
        document.body.appendChild(panel);
        panel.querySelector('#neo-multi-copy').onclick = async () => { await navigator.clipboard.writeText(panel.querySelector('#neo-multi-link').value); setStatus('Convite copiado.'); };
        panel.querySelectorAll('[data-share]').forEach(button => { button.onclick = () => void shareInvite(button.dataset.share).catch(error => setStatus(error.message)); });
        panel.querySelector('#neo-multi-close').onclick = closeRoom;
        panel.querySelector('#neo-multi-session').onclick = () => panel.classList.toggle('open');
        document.addEventListener('pointerdown', event => {
            if (!panel.classList.contains('open')) return;
            const path = event.composedPath();
            if (!path.includes(panel) && !room) panel.classList.remove('open');
        }, true);
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && !room) panel.classList.remove('open'); });
        try {
            const pending = JSON.parse(sessionStorage.getItem('neo_multiplayer_create_pending') || 'null');
            sessionStorage.removeItem('neo_multiplayer_create_pending');
            if (pending?.expiresAt > Date.now()) void autoCreateRoom();
        } catch (_) { sessionStorage.removeItem('neo_multiplayer_create_pending'); }
        void socialPulse(); setInterval(socialPulse, 15000);
    }

    addEventListener('DOMContentLoaded', createPanel, { once:true });
})();
