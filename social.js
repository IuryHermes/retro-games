import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const API = "https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev";
const app = initializeApp({
  apiKey: "AIzaSyCx_OllbDYkua9BbMOj2oJP5V1UcbxmnbI",
  authDomain: "neoterminalroom.firebaseapp.com",
  databaseURL: "https://neoterminalroom-default-rtdb.firebaseio.com",
  projectId: "neoterminalroom",
});
const auth = getAuth(app);
const globalChat = ref(getDatabase(app), 'mensagens');
const state = {
  firebase: null,
  discord: sessionStorage.getItem("neo_account_access") || "",
  players: [],
  self: null,
  chat: null,
  since: Date.now() - 60000,
  invited: new Set(),
};
const el = (id) => document.getElementById(id);
const avatar = (value) =>
  `assets/avatars/${/^avatar-\d{2}$/.test(value || "") ? value : "avatar-01"}.png`;
const recognitionBadges = (value) => value?.recognition?.badges || [];
const avatarWithBadges = (image, value, variant = "icons") =>
  window.NeoClubBadges.avatar(image, recognitionBadges(value), { variant, className: "community-avatar-badges" });
function refreshGlobalMessageBadges() {
  const people = new Map([state.self, ...state.players].filter(Boolean).map(person => [person.uid, person]));
  document.querySelectorAll('.global-message[data-uid]').forEach(row => {
    const person = people.get(row.dataset.uid);
    const frame = row.querySelector('.club-avatar-frame');
    if (!person || !frame) return;
    frame.querySelector('.club-badge-list')?.replaceWith(window.NeoClubBadges.create(recognitionBadges(person), { variant:'tiny' }));
  });
}
onChildAdded(query(globalChat, limitToLast(100)), snapshot => {
  const message = snapshot.val() || {};
  const row = document.createElement('article'); row.className = 'global-message'; row.dataset.uid = String(message.uid || '');
  const image = document.createElement('img'); image.src = avatar(message.avatar); image.alt = '';
  const content = document.createElement('div');
  const name = document.createElement('strong'); name.textContent = String(message.user || 'Jogador').slice(0, 40);
  const time = document.createElement('small'); time.textContent = String(message.time || '').slice(0, 40);
  const text = document.createElement('p'); text.textContent = String(message.text || '').slice(0, 240);
  const person = [state.self, ...state.players].find(candidate => candidate?.uid === message.uid);
  content.append(name, time, text); row.append(avatarWithBadges(image, person, 'tiny'), content); el('global-messages').appendChild(row);
  el('global-messages').scrollTop = el('global-messages').scrollHeight;
});

el('global-composer').onsubmit = async event => {
  event.preventDefault();
  const text = el('global-message').value.trim();
  if (!state.firebase) return alert('Entre com Google na página inicial para enviar mensagens no chat global.');
  if (!state.self?.name || !text) return;
  const now = new Date();
  const time = `${now.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })} ${now.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}`;
  await push(globalChat, { user:state.self.name.slice(0,40), text:text.slice(0,240), time, avatar:state.self.avatar || 'avatar-01', uid:state.self.uid });
  el('global-message').value = '';
};
function successToast(message) {
  const box = el("toast");
  box.replaceChildren(document.createTextNode(message));
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 3000);
}
async function token() {
  if (state.firebase) return state.firebase.getIdToken();
  if (state.discord) return state.discord;
  throw new Error("Entre na sua conta pela página inicial.");
}
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${await token()}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.erro || "Serviço social indisponível.");
  return data;
}
async function heartbeat() {
  await api("/social/heartbeat", {
    method: "POST",
    body: JSON.stringify({ page: "social" }),
  });
}
function toast(event) {
  const box = el("toast");
  box.replaceChildren();
  const text = document.createElement("div");
  text.textContent =
    event.type === "invite"
      ? `${event.fromName} convidou você para ${event.title}.`
      : event.type === "support-anniversary"
        ? event.preview
        : `Nova mensagem de ${event.fromName}: ${event.preview}`;
  box.appendChild(text);
  if (event.type === "invite") {
    const link = document.createElement("a");
    link.href = `multiplayer-room.html?room=${encodeURIComponent(event.roomId)}`;
    link.textContent = "ENTRAR NA PARTIDA";
    box.appendChild(link);
  }
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 12000);
  if (["invite", "support-anniversary"].includes(event.type) && "Notification" in window && Notification.permission === "granted")
    new Notification(event.type === "support-anniversary" ? "Aniversário de apoio" : "NeoTerminalRoom", { body: text.textContent, icon: avatar(event.fromAvatar), tag: event.type === "support-anniversary" ? `neo-support-anniversary-${event.years}` : `neo-invite-${event.roomId}` });
}
async function pollEvents() {
  try {
    const data = await api(`/social/events?since=${state.since}`);
    for (const event of data.events || []) {
      state.since = Math.max(state.since, event.createdAt);
      toast(event);
    }
  } catch (_) {}
}
async function loadPlayers() {
  try {
    await heartbeat();
    const data = await api("/social/players");
    state.self = data.self || state.self;
    el('global-message').disabled = !state.firebase;
    el('global-message').placeholder = state.firebase ? 'Mensagem para toda a comunidade...' : 'Entre com Google na página inicial para conversar...';
    state.players = data.players || [];
    refreshGlobalMessageBadges();
    el("players").replaceChildren();
    const onlineCount = state.players.filter((player) => player.online).length;
    el("status").textContent =
      `${onlineCount} online · ${state.players.length} perfil(is) cadastrado(s)`;
    if (!state.players.length) {
      el("players").innerHTML =
        '<div class="empty">Ainda não existem outros perfis cadastrados.</div>';
      return;
    }
    for (const player of state.players.filter(
      (candidate) => !state.invited.has(candidate.uid),
    )) {
      const card = document.createElement("article");
      card.className = `player${player.online ? " online" : ""}`;
      const image = document.createElement("img");
      image.src = avatar(player.avatar);
      image.alt = "";
      const info = document.createElement("div");
      const name = document.createElement("strong");
      const dot = document.createElement("span");
      dot.className = "presence-dot";
      name.append(dot, document.createTextNode(player.name));
      const page = document.createElement("small");
      const presence = player.online
        ? player.page === "game"
          ? "Online · jogando agora"
          : "Online · navegando no site"
          : "Offline";
      page.textContent = [presence, player.age ? `${player.age} anos` : "", player.locality ? `Cidade: ${player.locality}` : ""].filter(Boolean).join("\n");
      info.append(name, page);
      if (false && player.locality) {
        const locality = document.createElement("small");
        locality.textContent = `📍 ${player.locality}`;
        info.append(locality);
      }
      if (player.bio) {
        const bio = document.createElement("small");
        bio.className = "player-bio";
        bio.textContent = player.bio;
        info.append(bio);
      }
      const buttons = document.createElement("div");
      buttons.className = "buttons";
      const chat = document.createElement("button");
      chat.textContent = "CONVERSAR";
      chat.onclick = () => openChat(player);
      const invite = document.createElement("button");
      invite.textContent = "CONVIDAR";
      invite.disabled = !player.online;
      invite.title = player.online
        ? "Convidar para sua sala"
        : "Jogador offline";
      invite.onclick = () => invitePlayer(player);
      buttons.append(chat, invite);
      card.append(avatarWithBadges(image, player), info, buttons);
      el("players").appendChild(card);
    }
  } catch (error) {
    el("status").textContent = error.message;
    el("players").innerHTML =
      '<div class="empty"><a href="index.html">Entre ou conclua seu perfil na página inicial.</a></div>';
  }
}
async function invitePlayer(player) {
  const room = new URLSearchParams(location.search).get("room");
  if (!room) {
    alert(
      "Abra um jogo, crie uma sala pelo botão JOGAR ONLINE e use a lista de jogadores ao lado do convite.",
    );
    return;
  }
  try {
    await api("/social/invite", {
      method: "POST",
      body: JSON.stringify({ toUid: player.uid, roomId: room }),
    });
    state.invited.add(player.uid);
    await loadPlayers();
    successToast("Seu convite foi enviado com sucesso.");
  } catch (error) {
    alert(error.message);
  }
}
async function openChat(player) {
  state.chat = player;
  el("chat-title").textContent = `CONVERSA COM ${player.name}`;
  el("chat").showModal();
  await loadMessages();
}
async function loadMessages() {
  if (!state.chat) return;
  const data = await api(
    `/social/messages?with=${encodeURIComponent(state.chat.uid)}`,
  );
  el("messages").replaceChildren();
  for (const message of data.messages || []) {
    const mine = message.fromUid === state.self?.uid;
    const row = document.createElement("div");
    row.className = `message-row${mine ? " mine" : ""}`;
    const image = document.createElement("img");
    image.className = "message-avatar";
    image.src = avatar(message.fromAvatar || (mine ? state.self?.avatar : state.chat.avatar));
    image.alt = "";
    const bubble = document.createElement("div");
    bubble.className = "message";
    bubble.textContent = message.text;
    const time = document.createElement("small");
    time.textContent = `${message.fromName} · ${new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    bubble.appendChild(time);
    const sender = mine ? state.self : state.chat;
    row.append(avatarWithBadges(image, sender, 'tiny'), bubble);
    el("messages").appendChild(row);
  }
  el("messages").scrollTop = el("messages").scrollHeight;
}
el("composer").onsubmit = async (event) => {
  event.preventDefault();
  const text = el("message").value.trim();
  if (!text || !state.chat) return;
  await api("/social/messages", {
    method: "POST",
    body: JSON.stringify({ toUid: state.chat.uid, text }),
  });
  el("message").value = "";
  await loadMessages();
};
el("chat-close").onclick = () => el("chat").close();
el("refresh").onclick = loadPlayers;
onAuthStateChanged(auth, (user) => {
  state.firebase = user;
  if (user || state.discord) {
    void loadPlayers();
    void pollEvents();
    setInterval(heartbeat, 30000);
    setInterval(loadPlayers, 30000);
    setInterval(pollEvents, 7000);
    setInterval(() => state.chat && loadMessages(), 5000);
    if ("Notification" in window && Notification.permission === "default")
      void Notification.requestPermission();
  } else loadPlayers();
});
