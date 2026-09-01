(function () {
  'use strict';
  const API = 'https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev';
  const R2 = 'https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/';
  const ROMS = {
    'pokemon-fire-red':R2+'systems/gba/roms/pokemon-fire-red.gba',
    'pokemon-leaf-green':R2+'systems/gba/roms/pokemon-leaf-green-version.gba',
    'pokemon-ruby':R2+'systems/gba/roms/pokemon-ruby.gba',
    'pokemon-sapphire':R2+'systems/gba/roms/pokemon-sapphire-version.gba',
    'pokemon-emerald':R2+'systems/gba/roms/Pokemon_Emerald_PTBR.gba'
  };
  const params = new URLSearchParams(location.search);
  const roomId = (params.get('room') || '').toLowerCase();
  let config = window.NeoPokemonLink.byId(params.get('game'));
  let core, socket, room, ticket, clientId, peer, channel, running = false, localNetId = 0;
  let inputMask = 0, audioContext, audioTime = 0, lastSave = 0;
  const screen = document.getElementById('screen'), ctx = screen.getContext('2d', { alpha:false });
  const connection = document.getElementById('connection'), action = document.getElementById('create-room');
  const testSaveButton = document.getElementById('test-save');
  const token = () => sessionStorage.getItem('neo_club_access') || sessionStorage.getItem('neo_account_access') || '';
  const request = async (path, options={}) => {
    const response = await fetch(API + path, { ...options, headers:{ Authorization:`Bearer ${token()}`, ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || 'Não foi possível acessar a sala.');
    return data;
  };
  function loginRequired() {
    document.getElementById('auth-warning').hidden = false;
    action.hidden = true;
    const destination = `pokemon-link-player.html?${roomId ? `room=${roomId}` : `game=${config?.id || ''}`}`;
    document.getElementById('login-link').href = `index.html?cadastro=1&return=${encodeURIComponent(destination)}`;
  }
  function updateInfo() {
    if (!config) return;
    document.title = `${config.title} - Batalha Online`;
    document.getElementById('game-title').textContent = config.title;
    document.getElementById('instructions').textContent = config.room;
  }
  function saveDb(mode, bytes) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open('neo-pokemon-link', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('saves');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('saves', mode === 'read' ? 'readonly' : 'readwrite');
        const req = mode === 'read' ? tx.objectStore('saves').get(config.id) : tx.objectStore('saves').put(bytes, config.id);
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      };
    });
  }
  async function startCore() {
    if (running) return;
    action.disabled = true; action.textContent = 'CARREGANDO JOGO...';
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint:'interactive', sampleRate:48000 });
    await audioContext.resume();
    core = await window.createNeoGpsp({ locateFile:file => `pokemon-link/${file}` });
    const rom = new Uint8Array(await (await fetch(ROMS[config.id])).arrayBuffer());
    core.FS.writeFile('/game.gba', rom);
    if (!core.ccall('neo_init', 'number', ['string','string'], ['/game.gba', config.mode === 'cable' ? 'cable' : 'rfu'])) throw new Error('Esta ROM não pôde ser iniciada no modo de batalha.');
    const stored = await saveDb('read').catch(() => null);
    const saveSize = core._neo_save_size(), savePtr = core._neo_save_ptr();
    if (stored && stored.byteLength === saveSize) core.HEAPU8.set(new Uint8Array(stored), savePtr);
    running = true;
    document.getElementById('loading').hidden = true;
    requestAnimationFrame(frameLoop);
  }
  function drawFrame() {
    const width = core._neo_frame_width(), height = core._neo_frame_height(), pitch = core._neo_frame_pitch();
    const ptr = core._neo_frame_ptr(); if (!ptr || !width || !height) return;
    if (screen.width !== width || screen.height !== height) { screen.width=width; screen.height=height; }
    const image = ctx.createImageData(width, height), out=image.data, src=core.HEAPU8;
    for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
      const at=ptr+y*pitch+x*2, pixel=src[at]|(src[at+1]<<8), dst=(y*width+x)*4;
      out[dst]=((pixel>>11)&31)*255/31; out[dst+1]=((pixel>>5)&63)*255/63; out[dst+2]=(pixel&31)*255/31; out[dst+3]=255;
    }
    ctx.putImageData(image,0,0);
  }
  function playAudio() {
    const frames=core._neo_audio_frames(); if (!frames || audioContext.state !== 'running') return;
    const ptr=core._neo_audio_ptr()>>1, data=core.HEAP16, buffer=audioContext.createBuffer(2,frames,32768);
    const left=buffer.getChannelData(0), right=buffer.getChannelData(1);
    for(let i=0;i<frames;i++){left[i]=data[ptr+i*2]/32768;right[i]=data[ptr+i*2+1]/32768;}
    const source=audioContext.createBufferSource(); source.buffer=buffer; source.connect(audioContext.destination);
    audioTime=Math.max(audioTime,audioContext.currentTime+.015); source.start(audioTime); audioTime+=frames/32768;
  }
  function persistSave() {
    const size=core._neo_save_size(), ptr=core._neo_save_ptr(); if(!size||!ptr)return;
    void saveDb('write', core.HEAPU8.slice(ptr,ptr+size).buffer).catch(()=>{});
  }
  function frameLoop(now) {
    if (!running) return;
    core._neo_set_input(inputMask); core._neo_run(); drawFrame(); playAudio();
    if (now-lastSave>5000){lastSave=now;persistSave();}
    requestAnimationFrame(frameLoop);
  }
  async function iceServers() { try{return (await request('/multiplayer/ice-servers')).iceServers;}catch(_){return [{urls:'stun:stun.cloudflare.com:3478'}];} }
  function sendSignal(to,data){if(socket?.readyState===1)socket.send(JSON.stringify({type:'signal',to,data}));}
  function bindChannel(value) {
    channel=value; channel.binaryType='arraybuffer';
    channel.onopen=()=>{core._neo_net_start(localNetId);connection.textContent='CONECTADO';connection.classList.add('online');document.getElementById('room-status').textContent='Conexão pronta. Agora entrem no local indicado dentro do jogo.';};
    channel.onmessage=event=>{const bytes=new Uint8Array(event.data),ptr=core._malloc(bytes.length);core.HEAPU8.set(bytes,ptr);core._neo_queue_packet(ptr,bytes.length,localNetId?0:1);core._free(ptr);};
    channel.onclose=()=>{connection.textContent='DESCONECTADO';connection.classList.remove('online');core?._neo_net_stop();};
    core.neoPokemonSend=bytes=>{if(channel?.readyState==='open')channel.send(bytes);};
  }
  async function hostPeer(person) {
    if(peer||!person||person.host)return;
    peer=new RTCPeerConnection({iceServers:await iceServers()}); bindChannel(peer.createDataChannel('pokemon-link',{ordered:true}));
    peer.onicecandidate=e=>e.candidate&&sendSignal(person.clientId,{candidate:e.candidate});
    const offer=await peer.createOffer();await peer.setLocalDescription(offer);sendSignal(person.clientId,{description:peer.localDescription});
  }
  async function guestSignal(message) {
    if(!peer){peer=new RTCPeerConnection({iceServers:await iceServers()});peer.ondatachannel=e=>bindChannel(e.channel);peer.onicecandidate=e=>e.candidate&&sendSignal(message.from,{candidate:e.candidate});}
    if(message.data?.description){await peer.setRemoteDescription(message.data.description);const answer=await peer.createAnswer();await peer.setLocalDescription(answer);sendSignal(message.from,{description:peer.localDescription});}
    if(message.data?.candidate)await peer.addIceCandidate(message.data.candidate).catch(()=>{});
  }
  async function hostSignal(message){if(message.data?.description)await peer.setRemoteDescription(message.data.description);if(message.data?.candidate)await peer.addIceCandidate(message.data.candidate).catch(()=>{});}
  function connectSocket(){
    socket=new WebSocket(`${API.replace('https:','wss:')}/multiplayer/rooms/${room.id}/ws?ticket=${encodeURIComponent(ticket)}`);
    socket.onmessage=e=>{const message=JSON.parse(e.data);if(message.type==='welcome')clientId=message.clientId;if(message.type==='state'&&!localNetId)void hostPeer(message.participants.find(p=>!p.host));if(message.type==='signal')void(localNetId?guestSignal(message):hostSignal(message));};
  }
  function renderQr(link){const target=document.getElementById('qr');const draw=()=>new QRCode(target,{text:link,width:156,height:156,correctLevel:QRCode.CorrectLevel.M});if(window.QRCode)return draw();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=draw;s.onerror=()=>target.textContent='Use COPIAR CONVITE';document.head.appendChild(s);}
  async function createRoom(){await startCore();const data=await request('/multiplayer/rooms',{method:'POST',body:JSON.stringify({gameId:config.id,title:`${config.title} · batalha GBA`,system:'gba-link',maxPlayers:2,isPublic:true})});room=data.room;ticket=data.ticket;localNetId=0;connectSocket();const link=`${location.origin}/pokemon-link-player.html?room=${room.id}`;document.getElementById('invite').hidden=false;document.getElementById('invite-link').value=link;renderQr(link);action.hidden=true;}
  async function joinRoom(){const data=await request(`/multiplayer/rooms/${roomId}/join`,{method:'POST'});room=data.room;ticket=data.ticket;config=window.NeoPokemonLink.byId(room.gameId);if(!config)throw new Error('Esta sala não usa uma versão Pokémon compatível.');updateInfo();await startCore();localNetId=1;connectSocket();document.getElementById('invite').hidden=false;document.getElementById('room-status').textContent='Entrando na conexão do anfitrião...';action.hidden=true;}
  const keyIds={b:0,a:8,select:2,start:3,up:4,down:5,left:6,right:7,l:10,r:11};
  document.querySelectorAll('[data-key]').forEach(button=>{const bit=1<<keyIds[button.dataset.key];const down=e=>{e.preventDefault();inputMask|=bit;};const up=e=>{e.preventDefault();inputMask&=~bit;};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('pointerleave',up);});
  addEventListener('keydown',e=>{const map={z:8,x:0,Enter:3,Shift:2,ArrowUp:4,ArrowDown:5,ArrowLeft:6,ArrowRight:7,a:10,s:11};if(map[e.key]!=null){e.preventDefault();inputMask|=1<<map[e.key];}});
  addEventListener('keyup',e=>{const map={z:8,x:0,Enter:3,Shift:2,ArrowUp:4,ArrowDown:5,ArrowLeft:6,ArrowRight:7,a:10,s:11};if(map[e.key]!=null)inputMask&=~(1<<map[e.key]);});
  document.getElementById('copy').onclick=async()=>{await navigator.clipboard.writeText(document.getElementById('invite-link').value);document.getElementById('room-status').textContent='Convite copiado.';};
  testSaveButton.onclick=async()=>{
    if (!config || config.id !== 'pokemon-fire-red') return;
    const confirmed = confirm('Este save pronto substituirá somente o save do modo de batalha FireRed neste aparelho. Seu save normal do site não será alterado. Continuar?');
    if (!confirmed) return;
    testSaveButton.disabled=true; testSaveButton.textContent='PREPARANDO SAVE...';
    try {
      const response=await fetch('pokemon-link/saves/pokemon-fire-red-battle-ready.sav');
      const bytes=await response.arrayBuffer();
      if(!response.ok||bytes.byteLength!==131072)throw new Error('save inválido');
      await saveDb('write',bytes);
      testSaveButton.textContent='✓ SAVE PRONTO INSTALADO';
      document.getElementById('save-status').textContent='Save instalado. Inicie a sala, continue o jogo e vá ao 2º andar de qualquer Centro Pokémon.';
    } catch (_) { testSaveButton.disabled=false;testSaveButton.textContent='TENTAR INSTALAR SAVE NOVAMENTE'; }
  };
  addEventListener('pagehide',persistSave);
  action.onclick=()=>void(roomId?joinRoom():createRoom()).catch(error=>{action.disabled=false;action.textContent=roomId?'TENTAR ENTRAR NOVAMENTE':'TENTAR CRIAR SALA';document.getElementById('room-status').textContent=error.message;document.getElementById('invite').hidden=false;});
  (async()=>{if(!token()){loginRequired();return;}if(roomId){action.textContent='ENTRAR NA BATALHA';return;}if(!config){action.disabled=true;action.textContent='VERSÃO NÃO COMPATÍVEL';return;}updateInfo();testSaveButton.hidden=config.id!=='pokemon-fire-red';})();
})();
