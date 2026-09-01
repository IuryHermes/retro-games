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
  let pendingIceCandidates=[];
  let peerCreation=null;
  let signalChain=Promise.resolve();
  let testSaveSelected = config?.id === 'pokemon-fire-red';
  let inputMask = 0, audioContext, audioTime = 0, lastSave = 0;
  const screen = document.getElementById('screen'), ctx = screen.getContext('2d', { alpha:false });
  const connection = document.getElementById('connection'), action = document.getElementById('create-room');
  const toggleLobbyButton=document.getElementById('toggle-lobby');
  const roomIntent=document.getElementById('room-intent'), publicRooms=document.getElementById('public-rooms'), refreshRoomsButton=document.getElementById('refresh-rooms');
  const testSaveButton = document.getElementById('test-save');
  const findSaveButton = document.getElementById('find-save'), importSaveButton=document.getElementById('import-save'), exportSaveButton=document.getElementById('export-save'), saveFileInput=document.getElementById('save-file');
  const token = () => sessionStorage.getItem('neo_club_access') || sessionStorage.getItem('neo_account_access') || '';
  const waitForAuth = async () => {
    if (token()) return true;
    await new Promise(resolve => {
      const timer=setTimeout(resolve,3500);
      addEventListener('neo-auth-ready',()=>{clearTimeout(timer);resolve();},{once:true});
    });
    return Boolean(token());
  };
  const request = async (path, options={}) => {
    const response = await fetch(API + path, { ...options, signal:options.signal || AbortSignal.timeout(20000), headers:{ Authorization:`Bearer ${token()}`, ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers } });
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
  function updateSaveControls(){
    const preparedOnly=config?.id==='pokemon-fire-red';
    testSaveButton.hidden=true;
    findSaveButton.hidden=preparedOnly;
    importSaveButton.hidden=preparedOnly;
    exportSaveButton.hidden=preparedOnly;
    if(preparedOnly)document.getElementById('save-status').textContent='Save online validado: os dois jogadores começarão no ponto correto para batalha e troca.';
  }
  function saveDb(mode, bytes, forcePersonal=false) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open('neo-pokemon-link', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('saves');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('saves', mode === 'read' ? 'readonly' : 'readwrite');
        const key=forcePersonal?config.id:(testSaveSelected?`${config.id}-test-room`:config.id);
        const req = mode === 'read' ? tx.objectStore('saves').get(key) : tx.objectStore('saves').put(bytes, key);
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      };
    });
  }
  async function legacyEmulatorSave() {
    const names={
      'pokemon-fire-red':['pokemon-fire-red','pokemon_fire_red','firered'],
      'pokemon-leaf-green':['pokemon-leaf-green','pokemon_leaf_green','leaf-green','leafgreen'],
      'pokemon-ruby':['pokemon-ruby','pokemon_ruby'],
      'pokemon-sapphire':['pokemon-sapphire','pokemon_sapphire'],
      'pokemon-emerald':['pokemon-emerald','pokemon_emerald']
    }[config.id]||[];
    const databases=typeof indexedDB.databases==='function'?await indexedDB.databases():[{name:'/data/saves'}];
    for(const info of databases){
      if(!info.name)continue;
      const db=await new Promise(resolve=>{const open=indexedDB.open(info.name);open.onerror=()=>resolve(null);open.onsuccess=()=>resolve(open.result);});
      if(!db)continue;
      for(const storeName of Array.from(db.objectStoreNames)){
        let rows;
        try{rows=await new Promise((resolve,reject)=>{const store=db.transaction(storeName).objectStore(storeName),keys=store.getAllKeys(),values=store.getAll();let k,v;const done=()=>k&&v&&resolve(k.map((key,index)=>[String(key),v[index]]));keys.onsuccess=()=>{k=keys.result;done();};values.onsuccess=()=>{v=values.result;done();};keys.onerror=values.onerror=()=>reject(keys.error||values.error);});}catch(_){continue;}
        for(const [key,value] of rows){
          const normalized=key.toLowerCase().replace(/[^a-z0-9]+/g,'-');
          if(!names.some(name=>normalized.includes(name.replace(/[^a-z0-9]+/g,'-'))))continue;
          const source=value?.contents||value?.data||value;
          const bytes=source instanceof ArrayBuffer?new Uint8Array(source):ArrayBuffer.isView(source)?new Uint8Array(source.buffer,source.byteOffset,source.byteLength):null;
          if(bytes?.byteLength===131072){db.close();return bytes.slice().buffer;}
        }
      }
      db.close();
    }
    return null;
  }
  async function installPersonalSave(bytes,message) {
    const data=bytes instanceof ArrayBuffer?bytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
    if(data.byteLength!==131072)throw new Error('O save precisa ter 128 KB. Estados rápidos do emulador não são compatíveis.');
    await saveDb('write',data,true);testSaveSelected=false;
    document.getElementById('save-status').textContent=message;
  }
  async function battleTestSave() {
    const response=await fetch('pokemon-link/saves/pokemon-fire-red-battle-ready.sav?v=2');
    const bytes=await response.arrayBuffer();
    if(!response.ok||bytes.byteLength!==131072)throw new Error('O save pronto não pôde ser carregado.');
    return bytes;
  }
  function loadingError(error) {
    const loading=document.getElementById('loading');
    loading.hidden=false;
    loading.innerHTML=`<strong>O JOGO NÃO INICIOU</strong><span>${String(error?.message||error||'Falha desconhecida')}</span><small>Feche esta aba, abra novamente e tente uma vez. Se continuar, envie esta mensagem.</small>`;
  }
  async function startCore() {
    if (running) return;
    action.disabled = true; action.textContent = 'CARREGANDO JOGO...';
    const loading=document.getElementById('loading');loading.hidden=false;loading.innerHTML='<strong>1/4 · PREPARANDO ÁUDIO...</strong><span>Não feche esta página.</span>';
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint:'interactive', sampleRate:48000 });
    await audioContext.resume();
    loading.innerHTML='<strong>2/4 · CARREGANDO NÚCLEO GBA...</strong><span>Primeiro acesso pode levar alguns segundos.</span>';
    core = await Promise.race([window.createNeoGpsp({ locateFile:file => `pokemon-link/${file}?v=2` }),new Promise((_,reject)=>setTimeout(()=>reject(new Error('O núcleo GBA demorou demais para carregar.')),30000))]);
    loading.innerHTML='<strong>3/4 · CARREGANDO ROM EM PORTUGUÊS...</strong><span>Aguarde o download do cartucho.</span>';
    const romResponse=await fetch(ROMS[config.id]);
    if(!romResponse.ok)throw new Error(`A ROM não carregou (${romResponse.status}).`);
    const rom = new Uint8Array(await romResponse.arrayBuffer());
    core.FS.writeFile('/game.gba', rom);
    if (!core.ccall('neo_init', 'number', ['string','string'], ['/game.gba', config.mode === 'cable' ? 'cable' : 'rfu'])) throw new Error('Esta ROM não pôde ser iniciada no modo de batalha.');
    loading.innerHTML='<strong>4/4 · PREPARANDO SAVE...</strong><span>Quase pronto.</span>';
    const stored = testSaveSelected && config.id==='pokemon-fire-red' ? await battleTestSave() : await saveDb('read').catch(() => null);
    const saveSize = core._neo_save_size(), savePtr = core._neo_save_ptr();
    if (stored && stored.byteLength === saveSize) core.HEAPU8.set(new Uint8Array(stored), savePtr);
    if(testSaveSelected&&config.id==='pokemon-fire-red'){
      loading.innerHTML='<strong>ENTRANDO NA UNION ROOM...</strong><span>Carregando diretamente o ponto da batalha.</span>';
      const wait=frames=>{core._neo_set_input(0);for(let i=0;i<frames;i++)core._neo_run();};
      const press=(mask)=>{core._neo_set_input(mask);core._neo_run();wait(90);};
      wait(600);press(1<<3);press(1<<8);press(1<<8);press(1<<8);press(1<<8);press(1<<0);
    }
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
  async function addOrQueueCandidate(candidate){if(!candidate||!peer)return;if(peer.remoteDescription)await peer.addIceCandidate(candidate);else pendingIceCandidates.push(candidate);}
  async function flushIceCandidates(){if(!peer?.remoteDescription)return;for(const candidate of pendingIceCandidates.splice(0))await peer.addIceCandidate(candidate);}
  function watchPeer(){peer.onconnectionstatechange=()=>{const state=peer.connectionState;connection.textContent=state==='connected'?'CONECTADO':state==='failed'?'FALHA NA CONEXÃO':state==='disconnected'?'DESCONECTADO':'CONECTANDO...';connection.classList.toggle('online',state==='connected');if(state==='failed')document.getElementById('loading').innerHTML='<strong>FALHA NA CONEXÃO ENTRE OS APARELHOS</strong><span>Tente criar outra sala. Se estiverem em redes diferentes, confira se VPN ou economia de dados está desativada.</span>';};}
  function bindChannel(value) {
    channel=value; channel.binaryType='arraybuffer';
    channel.onopen=()=>{core._neo_net_start(localNetId);connection.textContent='CONECTADO';connection.classList.add('online');document.body.classList.add('game-active');document.getElementById('room-status').textContent='Conexão pronta. Agora entrem no local indicado dentro do jogo.';};
    channel.onmessage=event=>{const bytes=new Uint8Array(event.data),ptr=core._malloc(bytes.length);core.HEAPU8.set(bytes,ptr);core._neo_queue_packet(ptr,bytes.length,localNetId?0:1);core._free(ptr);};
    channel.onclose=()=>{connection.textContent='DESCONECTADO';connection.classList.remove('online');core?._neo_net_stop();};
    core.neoPokemonSend=bytes=>{if(channel?.readyState==='open')channel.send(bytes);};
  }
  async function hostPeer(person) {
    if(peer||!person||person.host)return;
    if(peerCreation)return peerCreation;
    peerCreation=(async()=>{
      const servers=await iceServers();
      if(peer)return;
      peer=new RTCPeerConnection({iceServers:servers}); bindChannel(peer.createDataChannel('pokemon-link',{ordered:true}));
      pendingIceCandidates=[];watchPeer();connection.textContent='CONECTANDO...';
      peer.onicecandidate=e=>e.candidate&&sendSignal(person.clientId,{candidate:e.candidate});
      const offer=await peer.createOffer();await peer.setLocalDescription(offer);sendSignal(person.clientId,{description:peer.localDescription});
    })();
    try{return await peerCreation;}finally{peerCreation=null;}
  }
  async function guestSignal(message) {
    if(!peer){peer=new RTCPeerConnection({iceServers:await iceServers()});pendingIceCandidates=[];watchPeer();connection.textContent='CONECTANDO...';peer.ondatachannel=e=>bindChannel(e.channel);peer.onicecandidate=e=>e.candidate&&sendSignal(message.from,{candidate:e.candidate});}
    if(message.data?.description){await peer.setRemoteDescription(message.data.description);await flushIceCandidates();const answer=await peer.createAnswer();await peer.setLocalDescription(answer);sendSignal(message.from,{description:peer.localDescription});}
    if(message.data?.candidate)await addOrQueueCandidate(message.data.candidate).catch(()=>{});
  }
  async function hostSignal(message){if(message.data?.description){await peer.setRemoteDescription(message.data.description);await flushIceCandidates();}if(message.data?.candidate)await addOrQueueCandidate(message.data.candidate).catch(()=>{});}
  function connectSocket(){
    socket=new WebSocket(`${API.replace('https:','wss:')}/multiplayer/rooms/${room.id}/ws?ticket=${encodeURIComponent(ticket)}`);
    socket.onmessage=e=>{const message=JSON.parse(e.data);if(message.type==='welcome')clientId=message.clientId;if(message.type==='state'&&!localNetId){const guest=message.participants.find(p=>!p.host);if(guest)document.body.classList.add('guest-arrived');void hostPeer(guest).catch(showConnectionError);}if(message.type==='signal'){signalChain=signalChain.then(()=>localNetId?guestSignal(message):hostSignal(message)).catch(showConnectionError);}};
  }
  function showConnectionError(error){console.error('[Pokemon Link] Falha na negociação:',error);connection.textContent='ERRO NA CONEXÃO';connection.classList.remove('online');const loading=document.getElementById('loading');loading.hidden=false;loading.innerHTML='<strong>NÃO FOI POSSÍVEL CONECTAR OS APARELHOS</strong><span>Feche esta sala e crie um novo convite. Não reutilize o convite anterior.</span>';}
  async function refreshPublicRooms(){
    refreshRoomsButton.disabled=true;
    try{
      const data=await request('/multiplayer/rooms');
      const rooms=(data.rooms||[]).filter(item=>item.system==='gba-link'&&window.NeoPokemonLink.byId(String(item.gameId||'').replace(/-test$/,'')));
      publicRooms.replaceChildren();
      if(!rooms.length){const empty=document.createElement('span');empty.textContent='Nenhum jogador aguardando agora. Crie a primeira sala.';publicRooms.append(empty);return;}
      rooms.forEach(item=>{const card=document.createElement('article');card.className='public-room';card.setAttribute('role','listitem');const name=document.createElement('strong');name.textContent=item.hostName||'Treinador';const detail=document.createElement('small');detail.textContent=item.title;const join=document.createElement('a');join.href=`pokemon-link-player.html?room=${encodeURIComponent(item.id)}`;join.textContent='ENTRAR';card.append(name,detail,join);publicRooms.append(card);});
    }catch(_){publicRooms.textContent='Não foi possível atualizar os jogadores agora.';}finally{refreshRoomsButton.disabled=false;}
  }
  function renderQr(link){const target=document.getElementById('qr');target.replaceChildren();try{if(!window.QRCode)throw new Error('QR indisponível');new QRCode(target,{text:link,width:156,height:156,colorDark:'#061109',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});requestAnimationFrame(()=>{if(!target.querySelector('canvas,img'))target.textContent='Use COPIAR CONVITE';});}catch(_){target.textContent='Use COPIAR CONVITE';}}
  async function createRoom(){await startCore();const roomGameId=testSaveSelected?`${config.id}-test`:config.id;const intent={batalha:'batalha',troca:'troca',ambos:'batalha ou troca'}[roomIntent.value]||'batalha';const data=await request('/multiplayer/rooms',{method:'POST',body:JSON.stringify({gameId:roomGameId,title:`${config.title} · ${intent}${testSaveSelected?' · save pronto':''}`,system:'gba-link',maxPlayers:2,isPublic:true})});room=data.room;ticket=data.ticket;localNetId=0;connectSocket();const link=`${location.origin}/pokemon-link-player.html?room=${room.id}`;document.getElementById('invite').hidden=false;document.getElementById('invite-link').value=link;renderQr(link);action.hidden=true;void refreshPublicRooms();}
  async function joinRoom(){action.disabled=true;action.textContent='ENTRANDO NA SALA...';const loading=document.getElementById('loading');loading.hidden=false;loading.innerHTML='<strong>ENTRANDO NA SALA...</strong><span>Validando o convite.</span>';const data=await request(`/multiplayer/rooms/${roomId}/join`,{method:'POST'});room=data.room;ticket=data.ticket;config=window.NeoPokemonLink.byId(room.gameId.replace(/-test$/,''));if(!config)throw new Error('Esta sala não usa uma versão Pokémon compatível.');testSaveSelected=config.id==='pokemon-fire-red'||/-test$/.test(room.gameId);updateInfo();updateSaveControls();await startCore();document.body.classList.add('guest-game');localNetId=1;connectSocket();document.getElementById('invite').hidden=false;document.getElementById('room-status').textContent=testSaveSelected?'Save pronto aplicado nos dois aparelhos. Entrando na conexão...':'Entrando na conexão do anfitrião...';action.hidden=true;}
  const keyIds={b:0,a:8,select:2,start:3,up:4,down:5,left:6,right:7,l:10,r:11};
  document.querySelectorAll('[data-key]').forEach(button=>{const bit=1<<keyIds[button.dataset.key];const down=e=>{e.preventDefault();inputMask|=bit;};const up=e=>{e.preventDefault();inputMask&=~bit;};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('pointerleave',up);});
  addEventListener('keydown',e=>{const map={z:8,x:0,Enter:3,Shift:2,ArrowUp:4,ArrowDown:5,ArrowLeft:6,ArrowRight:7,a:10,s:11};if(map[e.key]!=null){e.preventDefault();inputMask|=1<<map[e.key];}});
  addEventListener('keyup',e=>{const map={z:8,x:0,Enter:3,Shift:2,ArrowUp:4,ArrowDown:5,ArrowLeft:6,ArrowRight:7,a:10,s:11};if(map[e.key]!=null)inputMask&=~(1<<map[e.key]);});
  document.getElementById('copy').onclick=async()=>{await navigator.clipboard.writeText(document.getElementById('invite-link').value);document.getElementById('room-status').textContent='Convite copiado.';};
  toggleLobbyButton.onclick=()=>{const hidden=document.body.classList.contains('lobby-collapsed')||(document.body.classList.contains('guest-arrived')&&!document.body.classList.contains('lobby-manual-open'))||(document.body.classList.contains('guest-game')&&!document.body.classList.contains('lobby-manual-open'));if(hidden){document.body.classList.remove('lobby-collapsed');document.body.classList.add('lobby-manual-open');toggleLobbyButton.textContent='OCULTAR INSTRUÇÕES';}else{document.body.classList.remove('lobby-manual-open');document.body.classList.add('lobby-collapsed');toggleLobbyButton.textContent='MOSTRAR INSTRUÇÕES';}};
  findSaveButton.onclick=async()=>{findSaveButton.disabled=true;document.getElementById('save-status').textContent='Procurando save compatível neste navegador...';try{const save=await legacyEmulatorSave();if(!save)throw new Error('Não encontrei um save de 128 KB deste jogo. Use IMPORTAR .SAV/.SRM.');await installPersonalSave(save,'✓ Save do jogo normal copiado para o modo de batalha.');}catch(error){document.getElementById('save-status').textContent=error.message;}finally{findSaveButton.disabled=false;}};
  importSaveButton.onclick=()=>saveFileInput.click();
  saveFileInput.onchange=async()=>{const file=saveFileInput.files?.[0];if(!file)return;try{await installPersonalSave(await file.arrayBuffer(),'✓ Save importado. Ele será usado nesta sala.');}catch(error){document.getElementById('save-status').textContent=error.message;}saveFileInput.value='';};
  exportSaveButton.onclick=async()=>{if(core&&running&&!testSaveSelected)persistSave();await new Promise(resolve=>setTimeout(resolve,80));const save=await saveDb('read',null,true).catch(()=>null);if(!save){document.getElementById('save-status').textContent='Ainda não existe um save pessoal para baixar.';return;}const url=URL.createObjectURL(new Blob([save],{type:'application/octet-stream'})),link=document.createElement('a');link.href=url;link.download=`${config.id}.sav`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  testSaveButton.onclick=async()=>{
    if (!config || config.id !== 'pokemon-fire-red') return;
    if (testSaveSelected) {
      testSaveSelected=false;
      testSaveButton.disabled=false;
      testSaveButton.textContent='USAR SAVE PRONTO PARA TESTE';
      document.getElementById('save-status').textContent='Seu próprio save será usado nesta sala.';
      return;
    }
    const confirmed = confirm('Este save pronto substituirá somente o save do modo de batalha FireRed neste aparelho. Seu save normal do site não será alterado. Continuar?');
    if (!confirmed) return;
    testSaveButton.disabled=true; testSaveButton.textContent='PREPARANDO SAVE...';
    try {
      const bytes=await battleTestSave();
      if(bytes.byteLength!==131072)throw new Error('save inválido');
      testSaveSelected=true;
      testSaveButton.textContent='✓ SAVE PRONTO INSTALADO';
      testSaveButton.disabled=false;
      document.getElementById('save-status').textContent='Save de teste ativo somente para esta sala. Clique novamente para usar o seu.';
    } catch (_) { testSaveButton.disabled=false;testSaveButton.textContent='TENTAR INSTALAR SAVE NOVAMENTE'; }
  };
  refreshRoomsButton.onclick=()=>void refreshPublicRooms();
  setInterval(()=>void refreshPublicRooms(),15000);
  addEventListener('pagehide',persistSave);
  action.onclick=()=>void(roomId?joinRoom():createRoom()).catch(error=>{action.disabled=false;action.textContent=roomId?'TENTAR ENTRAR NOVAMENTE':'TENTAR CRIAR SALA';loadingError(error);});
  (async()=>{localStorage.removeItem('neo_pokemon_fire_red_test_save');void refreshPublicRooms();if(!await waitForAuth()){loginRequired();return;}if(roomId){action.disabled=false;action.textContent='ENTRAR NA BATALHA';return;}if(!config){action.disabled=true;action.textContent='VERSÃO NÃO COMPATÍVEL';return;}updateInfo();testSaveSelected=config.id==='pokemon-fire-red';updateSaveControls();action.disabled=false;action.textContent='CRIAR SALA PÚBLICA';})();
})();
