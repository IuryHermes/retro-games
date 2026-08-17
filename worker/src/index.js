var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var SITE = "https://neoterminalroom.com.br";
var FIREBASE = "https://neoterminalroom-default-rtdb.firebaseio.com/apoiadores_cafe";
var WEBHOOK = "https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev/webhook";
var WORKER = "https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev";
var DISCORD_APP_ID = "1537269100114350182";
var DISCORD_GUILD_ID = "1206797125854167110";
var DISCORD_ROLES = { cafe: "1537272991585534093", cartucho: "1537273232665612418", arcade: "1537273467026673674" };
var DISCORD_CHANNELS = { agradecimentos: "1537275305717272706", enquetes: "1537275369160319027", live: "1537280728922849332", sugestoes: "1537275481122938981" };
var BOT_STATE = "https://neoterminalroom-default-rtdb.firebaseio.com/bot_clube";
var CLUB_PLANS = ["registered", "owner", "cafe", "cartucho", "arcade"];
var FIREBASE_PROJECT_ID = "neoterminalroom";
var FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
var FIREBASE_JWKS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
var PROFILE_AVATARS = Array.from({ length: 40 }, (_, index) => `avatar-${String(index + 1).padStart(2, "0")}`);
function cleanProfileText(value, max) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}
function validBirthDate(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text && date <= now && date >= new Date(`${now.getUTCFullYear() - 120}-01-01T00:00:00Z`);
}
function profileAge(value) {
  if (!validBirthDate(value)) return null;
  const birth = new Date(`${value}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const month = now.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || month === 0 && now.getUTCDate() < birth.getUTCDate()) age--;
  return age >= 0 && age <= 120 ? age : null;
}
function safeProfileUrl(value) {
  const text = String(value || "").trim().slice(0, 300);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch (_) { return ""; }
}
var MAX_SAVE_BYTES = 16 * 1024 * 1024;
var MAX_SAVE_IMAGE_BYTES = 4 * 1024 * 1024;
var WEEKLY_POLLS = [
  { question: "Qual sistema deve receber prioridade na pr\xF3xima novidade?", answers: ["Super Nintendo", "Mega Drive", "Game Boy Advance", "Nintendo 64"] },
  { question: "Que tipo de jogo combina mais com a pr\xF3xima sele\xE7\xE3o?", answers: ["Plataforma", "RPG", "Corrida", "A\xE7\xE3o"] },
  { question: "Qual estilo visual voc\xEA quer ver em destaque?", answers: ["Pixel art 8-bit", "Pixel art 16-bit", "3D retr\xF4", "Arcade cl\xE1ssico"] },
  { question: "Qual formato de novidade interessa mais?", answers: ["Jogo homebrew", "Lista tem\xE1tica", "Curiosidade retr\xF4", "Desafio da comunidade"] }
];
var PLANS = { cafe: { title: "Cafe", amount: 5 }, cartucho: { title: "Cartucho", amount: 12 }, arcade: { title: "Arcade", amount: 25 } };
var cors = {
  "Access-Control-Allow-Origin": SITE,
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Range, X-Save-Name, X-Game-Name, X-Game-System",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, X-Save-Name",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "Cross-Origin-Resource-Policy": "same-site",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};
var json = /* @__PURE__ */ __name((data, status = 200) => Response.json(data, { status, headers: cors }), "json");
async function discordMessage(env, channelId, body) {
  return fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ allowed_mentions: { parse: ["roles", "users"] }, ...body }) });
}
__name(discordMessage, "discordMessage");
var encoder = new TextEncoder();
var b64url = /* @__PURE__ */ __name((bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "b64url");
var fromB64url = /* @__PURE__ */ __name((value) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)), (char) => char.charCodeAt(0)), "fromB64url");
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}
__name(sign, "sign");
async function timingSafeStringEqual(provided, expected) {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(provided || ""))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(expected || "")))
  ]);
  if (typeof crypto.subtle.timingSafeEqual === "function")
    return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
  const providedBytes = new Uint8Array(providedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let mismatch = 0;
  for (let index = 0; index < providedBytes.length; index += 1)
    mismatch |= providedBytes[index] ^ expectedBytes[index];
  return mismatch === 0;
}
__name(timingSafeStringEqual, "timingSafeStringEqual");
async function makeToken(data, secret) {
  const payload = b64url(encoder.encode(JSON.stringify(data)));
  return `${payload}.${await sign(payload, secret)}`;
}
__name(makeToken, "makeToken");
async function readToken(token, secret) {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !await timingSafeStringEqual(signature, await sign(payload, secret)))
      return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
__name(readToken, "readToken");
async function firebaseAccess(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      return null;
    const header = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
    const now = Math.floor(Date.now() / 1e3);
    if (header.alg !== "RS256" || !header.kid || claims.aud !== FIREBASE_PROJECT_ID || claims.iss !== FIREBASE_ISSUER || typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128 || claims.exp <= now || claims.iat > now + 60 || claims.auth_time > now + 60)
      return null;
    const keysResponse = await fetch(FIREBASE_JWKS, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!keysResponse.ok)
      return null;
    const jwks = await keysResponse.json();
    const jwk = jwks.keys?.find((candidate) => candidate.kid === header.kid);
    if (!jwk)
      return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const verified = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromB64url(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`));
    return verified ? { uid: claims.sub, email: claims.email || "", provider: claims.firebase?.sign_in_provider || "" } : null;
  } catch {
    return null;
  }
}
__name(firebaseAccess, "firebaseAccess");
async function accountAccess(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const discord = await readToken(token, env.DISCORD_CLIENT_SECRET);
  if (discord?.purpose === "account" && /^discord-\d{10,25}$/.test(discord.accountId))
    return { uid: discord.accountId, email: "", provider: "discord.com", username: discord.username || "" };
  const firebase = await firebaseAccess(token);
  return firebase ? { ...firebase, username: firebase.email.split("@")[0] } : null;
}
__name(accountAccess, "accountAccess");
async function clubAccess(request, url, env) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : url.searchParams.get("token") || "";
  const access = await readToken(token, env.DISCORD_CLIENT_SECRET);
  if (access?.purpose === "club" && CLUB_PLANS.includes(access.plan) && /^\d{10,25}$/.test(access.discordId))
    return access;
  if (access?.purpose === "account" && /^discord-\d{10,25}$/.test(access.accountId))
    return { discordId: access.accountId, accountUid: access.accountId, username: access.username || "", plan: "registered", purpose: "club", exp: access.exp };
  const firebase = await firebaseAccess(token);
  return firebase ? { discordId: `firebase-${firebase.uid}`, firebaseUid: firebase.uid, username: firebase.email.split("@")[0], plan: "registered", purpose: "club", exp: Date.now() + 55 * 60 * 1e3 } : null;
}
__name(clubAccess, "clubAccess");
function saveTarget(url, discordId) {
  const game = (url.searchParams.get("game") || "").trim().toLowerCase();
  const slot = (url.searchParams.get("slot") || "auto").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,119}$/.test(game) || slot !== "auto" && !/^manual-[1-9]\d{0,8}$/.test(slot))
    return null;
  return { game, slot, key: `saves/v1/${discordId}/${game}/${slot}.state` };
}
__name(saveTarget, "saveTarget");
function manualSaveLimit(plan) {
  return plan === "registered" || plan === "cafe" ? 3 : plan === "cartucho" ? 7 : null;
}
__name(manualSaveLimit, "manualSaveLimit");
function automaticGameLimit(plan) {
  return plan === "registered" || plan === "cafe" ? 3 : plan === "cartucho" ? 7 : null;
}
__name(automaticGameLimit, "automaticGameLimit");
async function streamRewards(env, discordId) {
  const object = await env.GAMES.get(`live/rewards/${encodeURIComponent(discordId)}.json`);
  if (!object) return { minutes: 0, bonusAutoGames: 0, bonusManualSlots: 0, awarded: [] };
  const value = await object.json().catch(() => ({}));
  return { minutes: Number(value.minutes) || 0, bonusAutoGames: Number(value.bonusAutoGames) || 0, bonusManualSlots: Number(value.bonusManualSlots) || 0, awarded: Array.isArray(value.awarded) ? value.awarded : [] };
}
__name(streamRewards, "streamRewards");
async function listAll(env, prefix, include = []) {
  const objects = [];
  let cursor;
  do {
    const page = await env.GAMES.list({ prefix, limit: 1e3, include, ...cursor ? { cursor } : {} });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : void 0;
  } while (cursor);
  return objects;
}
__name(listAll, "listAll");
function slotAllowed(slot, plan) {
  if (slot === "auto")
    return true;
  const number = Number(slot.slice("manual-".length));
  const limit = manualSaveLimit(plan);
  return Number.isSafeInteger(number) && number > 0 && (limit === null || number <= limit);
}
__name(slotAllowed, "slotAllowed");
async function enforceRateLimit(env, identity, action, limit, windowMs) {
  const response = await env.SOCIAL_PLAYERS.getByName(`rate:${identity}`).fetch(new Request("https://internal/rate/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, limit, windowMs })
  }));
  return response.ok ? null : response;
}
__name(enforceRateLimit, "enforceRateLimit");
class MultiplayerRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
  async room() {
    return await this.ctx.storage.get("room") || null;
  }
  participants() {
    return this.ctx.getWebSockets().map((socket) => socket.deserializeAttachment()).filter(Boolean);
  }
  state(room) {
    return { type: "state", room: { id: room.id, gameId: room.gameId, title: room.title, system: room.system, maxPlayers: room.maxPlayers, isPublic: room.isPublic, hostName: room.hostName, status: room.status }, participants: this.participants().map(({ clientId, uid, name, host, seat, approved }) => ({ clientId, uid, name, host, seat, approved })) };
  }
  broadcast(payload, except) {
    const message = JSON.stringify(payload);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== except) {
        try {
          socket.send(message);
        } catch {
        }
      }
    }
  }
  find(clientId) {
    return this.ctx.getWebSockets().find((socket) => socket.deserializeAttachment()?.clientId === clientId);
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/create") {
      const existing = await this.room();
      if (existing)
        return json({ room: existing });
      const room = await request.json();
      await this.ctx.storage.put("room", room);
      return json({ room }, 201);
    }
    const room = await this.room();
    if (!room)
      return json({ erro: "Sala nao encontrada." }, 404);
    if (request.method === "GET" && url.pathname === "/summary") {
      const participants = this.participants();
      const hostOnline = participants.some((person) => person.host);
      return json({ ...room, status: hostOnline ? "waiting" : "offline", online: participants.length, seatsUsed: participants.filter((person) => person.approved && !person.spectator).length, spectators: participants.filter((person) => person.spectator).length });
    }
    if (url.pathname !== "/ws" || request.headers.get("Upgrade") !== "websocket")
      return json({ erro: "Upgrade WebSocket necessario." }, 426);
    const uid = request.headers.get("X-Multiplayer-Uid") || "";
    const name = decodeURIComponent(request.headers.get("X-Multiplayer-Name") || "Jogador").slice(0, 20);
    const host = request.headers.get("X-Multiplayer-Host") === "1" && uid === room.hostUid;
    const currentParticipants = this.participants();
    const spectator = request.headers.get("X-Multiplayer-Spectator") === "1";
    const otherGuests = currentParticipants.filter((person) => !person.host && !person.spectator && person.uid !== uid);
    if (!host && !spectator && otherGuests.length >= room.maxPlayers - 1)
      return json({ erro: "Sala lotada." }, 409);
    for (const socket of this.ctx.getWebSockets()) {
      const person = socket.deserializeAttachment();
      if (person?.uid === uid)
        socket.close(4001, "Nova conexao da mesma conta");
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const usedSeats = new Set(otherGuests.map((person) => person.seat));
    const automaticSeat = host ? 1 : spectator ? 0 : Array.from({ length: room.maxPlayers - 1 }, (_, index) => index + 2).find((seat) => !usedSeats.has(seat));
    if (!spectator && !automaticSeat)
      return json({ erro: "Nao ha controle disponivel nesta sala." }, 409);
    const attachment = { clientId: crypto.randomUUID(), uid, name, host, spectator, seat: automaticSeat, approved: true };
    server.serializeAttachment(attachment);
    this.ctx.acceptWebSocket(server, [host ? "host" : "guest"]);
    server.send(JSON.stringify({ type: "welcome", clientId: attachment.clientId, roomId: room.id, host }));
    if (!host && !spectator)
      server.send(JSON.stringify({ type: "assignment", seat: automaticSeat, approved: true }));
    queueMicrotask(() => this.broadcast(this.state(room)));
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(socket, message) {
    if (typeof message !== "string" || message.length > 65536)
      return;
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }
    const sender = socket.deserializeAttachment();
    const room = await this.room();
    if (!sender || !room)
      return;
    if (data.type === "signal" && typeof data.to === "string") {
      const target = this.find(data.to);
      if (target)
        target.send(JSON.stringify({ type: "signal", from: sender.clientId, data: data.data }));
      return;
    }
    if (data.type === "kick" && sender.host) {
      const target = this.find(String(data.clientId || ""));
      if (target && !target.deserializeAttachment()?.host)
        target.close(4003, "Removido pelo anfitriao");
      return;
    }
    if (data.type === "input" && sender.approved && !sender.spectator && sender.seat > 1) {
      const index = Number(data.index);
      const value = Number(data.value);
      if (!Number.isInteger(index) || index < 0 || index > 29 || !Number.isFinite(value) || value < -32767 || value > 32767)
        return;
      const hostSocket = this.ctx.getWebSockets("host")[0];
      if (hostSocket)
        hostSocket.send(JSON.stringify({ type: "input", seat: sender.seat, index, value }));
      return;
    }
    if (data.type === "close" && sender.host) {
      await this.ctx.storage.put("room", { ...room, status: "closed", closedAt: Date.now() });
      for (const peer of this.ctx.getWebSockets())
        peer.close(1000, "Sala encerrada");
    }
  }
  async webSocketClose(socket) {
    const person = socket.deserializeAttachment();
    const room = await this.room();
    if (person?.host && room) {
      await this.ctx.storage.put("room", { ...room, status: "closed", closedAt: Date.now() });
      for (const peer of this.ctx.getWebSockets())
        peer.close(4000, "Anfitriao desconectou");
    } else if (room) {
      queueMicrotask(() => this.broadcast(this.state(room)));
    }
  }
}
__name(MultiplayerRoom, "MultiplayerRoom");
class SocialPlayer {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const events = await this.ctx.storage.get("events") || [];
    if (request.method === "POST" && url.pathname === "/rate/check") {
      const body = await request.json().catch(() => ({}));
      const action = String(body.action || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
      const limit = Math.max(1, Math.min(120, Number(body.limit) || 1));
      const windowMs = Math.max(1e3, Math.min(864e5, Number(body.windowMs) || 6e4));
      if (!action)
        return json({ erro: "Limite invalido." }, 400);
      const now = Date.now();
      const key = `rate:${action}`;
      const current = await this.ctx.storage.get(key);
      const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
      bucket.count += 1;
      await this.ctx.storage.put(key, bucket);
      if (bucket.count > limit) {
        const headers = new Headers(cors);
        headers.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1e3))));
        return new Response(JSON.stringify({ erro: "Muitas tentativas. Aguarde e tente novamente." }), { status: 429, headers });
      }
      return json({ permitido: true, restante: limit - bucket.count });
    }
    if (request.method === "POST" && url.pathname === "/event") {
      const event = await request.json();
      const next = [...events, { ...event, id: crypto.randomUUID(), createdAt: Date.now() }].slice(-100);
      await this.ctx.storage.put("events", next);
      return json({ ok: true });
    }
    if (request.method === "GET" && url.pathname === "/events") {
      const since = Math.max(0, Number(url.searchParams.get("since")) || 0);
      return json({ events: events.filter((event) => event.createdAt > since).slice(-50) });
    }
    if (request.method === "POST" && url.pathname === "/message") {
      const message = await request.json();
      const key = `messages:${message.withUid}`;
      const messages = await this.ctx.storage.get(key) || [];
      await this.ctx.storage.put(key, [...messages, message].slice(-100));
      return json({ ok: true });
    }
    if (request.method === "GET" && url.pathname === "/messages") {
      const withUid = String(url.searchParams.get("with") || "").slice(0, 160);
      return json({ messages: await this.ctx.storage.get(`messages:${withUid}`) || [] });
    }
    return json({ erro: "Rota social invalida." }, 404);
  }
}
__name(SocialPlayer, "SocialPlayer");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (url.pathname.startsWith("/social/")) {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Entre na sua conta para acessar jogadores online." }, 401);
      const profileObject = await env.GAMES.get(`profiles/v1/${account.uid}.json`);
      const profile = profileObject ? await profileObject.json() : null;
      if (!profile)
        return json({ erro: "Complete seu perfil primeiro." }, 403);
      const own = env.SOCIAL_PLAYERS.getByName(account.uid);
      if (request.method === "POST" && url.pathname === "/social/heartbeat") {
        const body = await request.json().catch(() => ({}));
        const roomId = /^[a-f0-9]{12}$/.test(String(body.roomId || "")) ? String(body.roomId) : "";
        const presence = { uid: account.uid, name: profile.name, avatar: profile.avatar, page: String(body.page || "site").slice(0, 30), roomId, roomTitle: cleanProfileText(body.roomTitle, 100), updatedAt: Date.now() };
        await env.GAMES.put(`social/presence/${encodeURIComponent(account.uid)}.json`, JSON.stringify(presence), { httpMetadata: { contentType: "application/json" } });
        if (presence.page === "game" && roomId) {
          const rewardKey = `live/rewards/${encodeURIComponent(account.uid)}.json`;
          const rewardObject = await env.GAMES.get(rewardKey);
          const reward = rewardObject ? await rewardObject.json().catch(() => ({})) : {};
          const now = Date.now();
          const lastSeenAt = Number(reward.lastSeenAt) || 0;
          const activeRoomId = String(reward.activeRoomId || "");
          const continuing = activeRoomId === roomId && lastSeenAt > now - 90e3;
          const addedMinutes = continuing ? Math.min(2, Math.max(0, (now - lastSeenAt) / 6e4)) : 0;
          const minutes = (Number(reward.minutes) || 0) + addedMinutes;
          const awarded = Array.isArray(reward.awarded) ? reward.awarded : [];
          const next = { ...reward, activeRoomId: roomId, lastSeenAt: now, minutes, awarded, bonusAutoGames: Number(reward.bonusAutoGames) || 0, bonusManualSlots: Number(reward.bonusManualSlots) || 0 };
          const tiers = [[30, "30m-auto", "bonusAutoGames", 1], [120, "120m-manual", "bonusManualSlots", 2], [300, "300m-auto", "bonusAutoGames", 2]];
          const earned = [];
          for (const [threshold, id, field, amount] of tiers) if (minutes >= threshold && !awarded.includes(id)) { awarded.push(id); next[field] += amount; earned.push(`${amount} ${field === "bonusAutoGames" ? "jogo(s) com autosave" : "slot(s) manual(is)"}`); }
          await env.GAMES.put(rewardKey, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } });
          if (!continuing) await discordMessage(env, DISCORD_CHANNELS.live, { content: `🎥 **${profile.name}** está transmitindo **${presence.roomTitle || "uma gameplay"}** no NeoTerminalRoom. Assista no site: ${SITE}/multiplayer-room.html?room=${roomId}&spectator=1` }).catch(() => {});
          if (earned.length) await discordMessage(env, DISCORD_CHANNELS.live, { content: `🏆 ${profile.name} desbloqueou ${earned.join(" e ")} por tempo acumulado de transmissão no NeoTerminalRoom.` }).catch(() => {});
        }
        return json({ presence });
      }
      if (request.method === "GET" && url.pathname === "/social/players") {
        const [profileDirectory, presenceDirectory] = await Promise.all([listAll(env, "profiles/v1/"), listAll(env, "social/presence/")]);
        const presence = (await Promise.all(presenceDirectory.slice(-500).map(async (object) => {
          const record = await env.GAMES.get(object.key);
          return record ? await record.json().catch(() => null) : null;
        }))).filter(Boolean);
        const presenceByUid = new Map(presence.map((player) => [player.uid, player]));
        const players = (await Promise.all(profileDirectory.slice(-500).map(async (object) => {
          const record = await env.GAMES.get(object.key);
          const candidate = record ? await record.json().catch(() => null) : null;
          if (!candidate || candidate.uid === account.uid)
            return null;
          const live = presenceByUid.get(candidate.uid);
          const online = Boolean(live && Date.now() - live.updatedAt < 9e4);
          return { uid: candidate.uid, name: candidate.name, avatar: candidate.avatar, age: profileAge(candidate.birthDate), locality: candidate.locality || "", bio: candidate.bio || "", instagram: candidate.instagram || "", youtube: candidate.youtube || "", facebook: candidate.facebook || "", tiktok: candidate.tiktok || "", watchRoomId: online && live?.page === "game" ? live.roomId || "" : "", watchTitle: online && live?.page === "game" ? live.roomTitle || "" : "", online, page: online ? live.page : "offline", lastSeenAt: live?.updatedAt || null };
        }))).filter(Boolean).sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, "pt-BR")).slice(0, 500);
        return json({ self: { uid: account.uid, name: profile.name, avatar: profile.avatar }, players });
      }
      if (request.method === "GET" && url.pathname === "/social/events")
        return own.fetch(new Request(`https://social/events?since=${encodeURIComponent(url.searchParams.get("since") || "0")}`));
      if (request.method === "GET" && url.pathname === "/social/messages") {
        const withUid = String(url.searchParams.get("with") || "");
        return own.fetch(new Request(`https://social/messages?with=${encodeURIComponent(withUid)}`));
      }
      if (request.method === "POST" && url.pathname === "/social/invite") {
        const limited = await enforceRateLimit(env, account.uid, "social-invite", 10, 10 * 60 * 1e3);
        if (limited)
          return limited;
        const body = await request.json().catch(() => ({}));
        const toUid = String(body.toUid || "").slice(0, 160);
        const roomId = String(body.roomId || "");
        if (!toUid || toUid === account.uid || !/^[a-f0-9]{12}$/.test(roomId))
          return json({ erro: "Convite invalido." }, 400);
        const targetPresenceObject = await env.GAMES.get(`social/presence/${encodeURIComponent(toUid)}.json`);
        const targetPresence = targetPresenceObject ? await targetPresenceObject.json().catch(() => null) : null;
        if (!targetPresence || Date.now() - targetPresence.updatedAt >= 9e4)
          return json({ erro: "Esse jogador nao esta mais online." }, 409);
        const summaryResponse = await env.MULTIPLAYER_ROOMS.getByName(roomId).fetch(new Request("https://room/summary"));
        if (!summaryResponse.ok)
          return json({ erro: "Sala nao encontrada." }, 404);
        const room = await summaryResponse.json();
        if (room.hostUid !== account.uid || room.status !== "waiting")
          return json({ erro: "Somente o anfitriao pode convidar para esta sala." }, 403);
        await env.SOCIAL_PLAYERS.getByName(toUid).fetch(new Request("https://social/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "invite", fromUid: account.uid, fromName: profile.name, fromAvatar: profile.avatar, roomId, title: room.title }) }));
        return json({ enviado: true });
      }
      if (request.method === "POST" && url.pathname === "/social/messages") {
        const limited = await enforceRateLimit(env, account.uid, "social-message", 20, 60 * 1e3);
        if (limited)
          return limited;
        const body = await request.json().catch(() => ({}));
        const toUid = String(body.toUid || "").slice(0, 160);
        const text = String(body.text || "").trim().slice(0, 500);
        if (!toUid || toUid === account.uid || !text)
          return json({ erro: "Mensagem invalida." }, 400);
        if (!await env.GAMES.head(`profiles/v1/${toUid}.json`))
          return json({ erro: "Jogador nao encontrado." }, 404);
        const message = { id: crypto.randomUUID(), fromUid: account.uid, fromName: profile.name, fromAvatar: profile.avatar, toUid, text, createdAt: Date.now() };
        await Promise.all([
          own.fetch(new Request("https://social/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...message, withUid: toUid }) })),
          env.SOCIAL_PLAYERS.getByName(toUid).fetch(new Request("https://social/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...message, withUid: account.uid }) })),
          env.SOCIAL_PLAYERS.getByName(toUid).fetch(new Request("https://social/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "message", fromUid: account.uid, fromName: profile.name, fromAvatar: profile.avatar, preview: text.slice(0, 80) }) }))
        ]);
        return json({ message }, 201);
      }
      return json({ erro: "Rota social nao encontrada." }, 404);
    }
    if (request.method === "GET" && url.pathname === "/multiplayer/ice-servers") {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Entre na sua conta para usar o multiplayer." }, 401);
      const limited = await enforceRateLimit(env, account.uid, "turn-credentials", 12, 10 * 60 * 1e3);
      if (limited)
        return limited;
      const fallback = [{ urls: ["stun:stun.cloudflare.com:3478"] }];
      if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN)
        return json({ iceServers: fallback, relay: false });
      const turnResponse = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ttl: 14400 })
      });
      if (!turnResponse.ok)
        return json({ iceServers: fallback, relay: false });
      const turn = await turnResponse.json().catch(() => ({}));
      const iceServers = Array.isArray(turn.iceServers) ? turn.iceServers.map((server) => ({
        ...server,
        urls: (Array.isArray(server.urls) ? server.urls : [server.urls]).filter((candidate) => typeof candidate === "string" && !candidate.includes(":53?"))
      })).filter((server) => server.urls.length) : [];
      const usable = iceServers.length ? iceServers : fallback;
      const relay = usable.some((server) => server.urls.some((candidate) => candidate.startsWith("turn:") || candidate.startsWith("turns:")));
      return new Response(JSON.stringify({ iceServers: usable, relay }), { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    }
    if (request.method === "POST" && url.pathname === "/multiplayer/rooms") {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Entre na sua conta para abrir uma sala." }, 401);
      const limited = await enforceRateLimit(env, account.uid, "multiplayer-room", 6, 10 * 60 * 1e3);
      if (limited)
        return limited;
      const profileObject = await env.GAMES.get(`profiles/v1/${account.uid}.json`);
      const profile = profileObject ? await profileObject.json() : null;
      if (!profile)
        return json({ erro: "Complete seu perfil primeiro." }, 403);
      const body = await request.json().catch(() => ({}));
      const gameId = String(body.gameId || "").toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(0, 120);
      const title = String(body.title || "").trim().slice(0, 100);
      const system = String(body.system || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20);
      const maxPlayers = Math.max(2, Math.min(4, Number(body.maxPlayers) || 2));
      if (!gameId || !title || !system)
        return json({ erro: "Jogo invalido." }, 400);
      const roomId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const room = { id: roomId, gameId, title, system, maxPlayers, isPublic: body.isPublic !== false, hostUid: account.uid, hostName: profile.name, status: "waiting", createdAt: Date.now() };
      const stub = env.MULTIPLAYER_ROOMS.getByName(roomId);
      await stub.fetch(new Request("https://room/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(room) }));
      await env.GAMES.put(`multiplayer/rooms/${roomId}.json`, JSON.stringify({ id: roomId, createdAt: room.createdAt }), { httpMetadata: { contentType: "application/json" } });
      const ticket = await makeToken({ purpose: "multiplayer", roomId, uid: account.uid, name: profile.name, host: true, exp: Date.now() + 4 * 60 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
      return json({ room, ticket }, 201);
    }
    if (request.method === "GET" && url.pathname === "/multiplayer/rooms") {
      const directory = await listAll(env, "multiplayer/rooms/");
      const summaries = await Promise.all(directory.slice(-100).map(async (object) => {
        const roomId = object.key.split("/").pop()?.replace(/\.json$/, "") || "";
        if (!/^[a-f0-9]{12}$/.test(roomId))
          return null;
        const response = await env.MULTIPLAYER_ROOMS.getByName(roomId).fetch(new Request("https://room/summary"));
        if (!response.ok)
          return null;
        const summary = await response.json();
        if (!summary.isPublic || summary.status !== "waiting" || summary.seatsUsed >= summary.maxPlayers)
          return null;
        const { hostUid, ...publicSummary } = summary;
        return publicSummary;
      }));
      return json({ rooms: summaries.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50) });
    }
    const joinMatch = url.pathname.match(/^\/multiplayer\/rooms\/([a-f0-9]{12})\/join$/);
    if (request.method === "POST" && joinMatch) {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Entre na sua conta para participar." }, 401);
      const profileObject = await env.GAMES.get(`profiles/v1/${account.uid}.json`);
      const profile = profileObject ? await profileObject.json() : null;
      if (!profile)
        return json({ erro: "Complete seu perfil primeiro." }, 403);
      const roomId = joinMatch[1];
      const spectator = url.searchParams.get("spectator") === "1";
      const summaryResponse = await env.MULTIPLAYER_ROOMS.getByName(roomId).fetch(new Request("https://room/summary"));
      if (!summaryResponse.ok)
        return json({ erro: "Sala nao encontrada." }, 404);
      const room = await summaryResponse.json();
      if (room.status !== "waiting" || !spectator && room.seatsUsed >= room.maxPlayers)
        return json({ erro: "Sala indisponivel ou lotada." }, 409);
      const ticket = await makeToken({ purpose: "multiplayer", roomId, uid: account.uid, name: profile.name, host: false, spectator, exp: Date.now() + 4 * 60 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
      const { hostUid, ...publicRoom } = room;
      return json({ room: publicRoom, ticket });
    }
    const socketMatch = url.pathname.match(/^\/multiplayer\/rooms\/([a-f0-9]{12})\/ws$/);
    if (request.method === "GET" && socketMatch) {
      const ticket = await readToken(url.searchParams.get("ticket") || "", env.DISCORD_CLIENT_SECRET);
      if (!ticket || ticket.purpose !== "multiplayer" || ticket.roomId !== socketMatch[1] || !ticket.uid)
        return json({ erro: "Convite expirado." }, 401);
      const headers = new Headers(request.headers);
      headers.set("X-Multiplayer-Uid", ticket.uid);
      headers.set("X-Multiplayer-Name", encodeURIComponent(ticket.name || "Jogador"));
      headers.set("X-Multiplayer-Host", ticket.host ? "1" : "0");
      headers.set("X-Multiplayer-Spectator", ticket.spectator ? "1" : "0");
      return env.MULTIPLAYER_ROOMS.getByName(socketMatch[1]).fetch(new Request("https://room/ws", { method: "GET", headers }));
    }
    if (request.method === "GET" && url.pathname === "/discord/app-info") {
      const response = await fetch("https://discord.com/api/v10/oauth2/applications/@me", { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      if (!response.ok)
        return json({ erro: "Discord indisponivel." }, 502);
      const application = await response.json();
      return json({ applicationId: application.id, name: application.name });
    }
    if (request.method === "GET" && url.pathname === "/discord/login") {
      const plan = ["cafe", "cartucho", "arcade"].includes(url.searchParams.get("plano") || "") ? url.searchParams.get("plano") : "cafe";
      const state = await makeToken({ plan, exp: Date.now() + 10 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
      const authorize = new URL("https://discord.com/oauth2/authorize");
      authorize.search = new URLSearchParams({ client_id: DISCORD_APP_ID, response_type: "code", redirect_uri: `${WORKER}/discord/callback`, scope: "identify", state }).toString();
      return Response.redirect(authorize.toString(), 302);
    }
    if (request.method === "GET" && url.pathname === "/club/login") {
      const state = await makeToken({ purpose: "club", exp: Date.now() + 10 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
      const authorize = new URL("https://discord.com/oauth2/authorize");
      authorize.search = new URLSearchParams({ client_id: DISCORD_APP_ID, response_type: "code", redirect_uri: `${WORKER}/discord/callback`, scope: "identify", state }).toString();
      return Response.redirect(authorize.toString(), 302);
    }
    if (request.method === "GET" && url.pathname === "/account/discord/login") {
      const state = await makeToken({ purpose: "account", exp: Date.now() + 10 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
      const authorize = new URL("https://discord.com/oauth2/authorize");
      authorize.search = new URLSearchParams({ client_id: DISCORD_APP_ID, response_type: "code", redirect_uri: `${WORKER}/discord/callback`, scope: "identify", state }).toString();
      return Response.redirect(authorize.toString(), 302);
    }
    if (request.method === "POST" && url.pathname === "/admin/publish-poll") {
      if (!env.HERMES_PUBLISH_KEY || !await timingSafeStringEqual(request.headers.get("Authorization") || "", `Bearer ${env.HERMES_PUBLISH_KEY}`))
        return json({ erro: "Nao autorizado." }, 401);
      const body = await request.json();
      const question = String(body.question || "").trim().slice(0, 300);
      const answers = Array.isArray(body.answers) ? body.answers.map((answer) => String(answer).trim().slice(0, 55)).filter(Boolean).slice(0, 10) : [];
      if (!question || answers.length < 2)
        return json({ erro: "Informe uma pergunta e pelo menos duas opcoes." }, 400);
      const result = await discordMessage(env, DISCORD_CHANNELS.enquetes, { content: `<@&${DISCORD_ROLES.cartucho}> <@&${DISCORD_ROLES.arcade}> \u2014 nova enquete do Clube:`, poll: { question: { text: question }, answers: answers.map((text) => ({ poll_media: { text } })), duration: 168, allow_multiselect: Boolean(body.multiselect) } });
      if (!result.ok)
        return json({ erro: "O Discord recusou a enquete.", detalhe: await result.text() }, 502);
      return json({ publicado: true });
    }
    if (request.method === "GET" && url.pathname === "/discord/callback") {
      const state = await readToken(url.searchParams.get("state") || "", env.DISCORD_CLIENT_SECRET);
      const code = url.searchParams.get("code");
      if (!state || !code)
        return Response.redirect(`${SITE}/apoie.html?discord_erro=login`, 302);
      const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: DISCORD_APP_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code, redirect_uri: `${WORKER}/discord/callback` }) });
      if (!tokenResponse.ok)
        return Response.redirect(`${SITE}/apoie.html?discord_erro=token`, 302);
      const oauth = await tokenResponse.json();
      const userResponse = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${oauth.access_token}` } });
      const user = await userResponse.json();
      if (state.purpose === "account") {
        const accountId = `discord-${user.id}`;
        const access = await makeToken({ accountId, username: user.global_name || user.username, purpose: "account", exp: Date.now() + 7 * 24 * 60 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
        return Response.redirect(`${SITE}/#account_token=${encodeURIComponent(access)}`, 302);
      }
      const discordHeaders = { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` };
      const [memberResponse, rolesResponse, guildResponse] = await Promise.all([fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${user.id}`, { headers: discordHeaders }), fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`, { headers: discordHeaders }), fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}`, { headers: discordHeaders })]);
      if (!memberResponse.ok || !rolesResponse.ok || !guildResponse.ok) {
        return Response.redirect(state.purpose === "club" ? `${SITE}/?club_erro=entre_no_servidor` : `${SITE}/apoie.html?discord_erro=entre_no_servidor`, 302);
      }
      const member = await memberResponse.json();
      const roles = await rolesResponse.json();
      const memberRole = roles.find((role) => role.name.toLowerCase() === "membro");
      const guild = await guildResponse.json();
      const isOwner = guild.owner_id === user.id;
      if (!isOwner && (!memberRole || !member.roles.includes(memberRole.id))) {
        return Response.redirect(state.purpose === "club" ? `${SITE}/?club_erro=aceite_as_regras` : `${SITE}/apoie.html?discord_erro=aceite_as_regras`, 302);
      }
      if (state.purpose === "club") {
        const plan = isOwner ? "owner" : member.roles.includes(DISCORD_ROLES.arcade) ? "arcade" : member.roles.includes(DISCORD_ROLES.cartucho) ? "cartucho" : member.roles.includes(DISCORD_ROLES.cafe) ? "cafe" : null;
        if (!plan)
          return Response.redirect(`${SITE}/?club_erro=plano#saves`, 302);
        const access = await makeToken({ discordId: user.id, username: user.username, plan, purpose: "club", exp: Date.now() + 7 * 24 * 60 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
        return Response.redirect(`${SITE}/#club_token=${encodeURIComponent(access)}`, 302);
      }
      const linked = await makeToken({ discordId: user.id, username: user.username, exp: Date.now() + 30 * 60 * 1e3 }, env.DISCORD_CLIENT_SECRET);
      const planValue = state.plan === "arcade" ? "25" : state.plan === "cartucho" ? "12" : "5";
      return Response.redirect(`${SITE}/?discord=${encodeURIComponent(linked)}&apoio=${planValue}#apoio`, 302);
    }
    if (request.method === "GET" && url.pathname === "/club/session") {
      const access = await clubAccess(request, url, env);
      if (!access)
        return json({ erro: "Acesso expirado." }, 401);
      let profile = null;
      if (access.firebaseUid || access.accountUid) {
        const profileObject = await env.GAMES.get(`profiles/v1/${access.firebaseUid || access.accountUid}.json`);
        profile = profileObject ? await profileObject.json() : null;
      }
      const savePrefix = `saves/v1/${access.discordId}/`;
      const savedObjects = await listAll(env, savePrefix, ["customMetadata"]);
      const automaticGames = new Set(savedObjects.filter((object) => object.key.endsWith("/auto.state")).map((object) => object.key.slice(savePrefix.length).split("/")[0]));
      const rewards = await streamRewards(env, access.discordId);
      return json({ conectado: true, username: profile?.name || access.username || "", avatar: profile?.avatar || "", plan: access.plan, manualSaveLimit: manualSaveLimit(access.plan) === null ? null : manualSaveLimit(access.plan) + rewards.bonusManualSlots, automaticGameLimit: automaticGameLimit(access.plan) === null ? null : automaticGameLimit(access.plan) + rewards.bonusAutoGames, automaticGamesUsed: automaticGames.size, streamMinutes: Math.floor(rewards.minutes), streamRewards: rewards, expiresAt: access.exp });
    }
    if (url.pathname === "/account/profile" && ["GET", "PUT"].includes(request.method)) {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Login expirado." }, 401);
      const key = `profiles/v1/${account.uid}.json`;
      const currentObject = await env.GAMES.get(key);
      const current = currentObject ? await currentObject.json() : null;
      if (request.method === "GET")
        return current ? json({ profile: current }) : json({ profile: null }, 404);
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || "").trim().replace(/\s+/g, " ").slice(0, 20);
      const avatar = String(body.avatar || "").toLowerCase();
      if (!/^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,19}$/u.test(name) || !PROFILE_AVATARS.includes(avatar))
        return json({ erro: "Escolha um nome de 2 a 20 caracteres e um avatar valido." }, 400);
      const birthDate = String(body.birthDate || current?.birthDate || "");
      const locality = cleanProfileText(body.locality ?? current?.locality, 80);
      const bio = cleanProfileText(body.bio ?? current?.bio, 280);
      const phone = cleanProfileText(body.phone ?? current?.phone, 30);
      const instagram = safeProfileUrl(body.instagram ?? current?.instagram);
      const youtube = safeProfileUrl(body.youtube ?? current?.youtube);
      const facebook = safeProfileUrl(body.facebook ?? current?.facebook);
      const tiktok = safeProfileUrl(body.tiktok ?? current?.tiktok);
      if (!validBirthDate(birthDate) || locality.length < 2)
        return json({ erro: "Informe uma data de nascimento valida e sua localidade." }, 400);
      if ([instagram, youtube, facebook, tiktok].some((value, index) => String(body[["instagram", "youtube", "facebook", "tiktok"][index]] || "").trim() && !value))
        return json({ erro: "Use links validos começando com http:// ou https://." }, 400);
      const profile = { uid: account.uid, name, avatar, birthDate, locality, bio, phone, instagram, youtube, facebook, tiktok, provider: account.provider, createdAt: current?.createdAt || Date.now(), updatedAt: Date.now() };
      await env.GAMES.put(key, JSON.stringify(profile), { httpMetadata: { contentType: "application/json" } });
      if (!current) {
        await fetch(`https://neoterminalroom-default-rtdb.firebaseio.com/hall_cadastros/${encodeURIComponent(account.uid)}.json`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: name, avatar, mensagem: `Bem-vindo(a), ${name}! Um novo jogador entrou na sala.`, timestamp: Date.now() }) });
      }
      return json({ profile, created: !current });
    }
    if (url.pathname === "/account/history" && ["GET", "POST"].includes(request.method)) {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Login expirado." }, 401);
      const key = `history/v1/${account.uid}.json`;
      const historyObject = await env.GAMES.get(key);
      const history = historyObject ? await historyObject.json() : [];
      if (request.method === "GET")
        return json({ games: Array.isArray(history) ? history.slice(0, 50) : [] });
      const body = await request.json().catch(() => ({}));
      const id = String(body.id || "").trim().toLowerCase().slice(0, 120);
      const name = String(body.name || "").trim().slice(0, 100);
      const system = String(body.system || "").trim().toLowerCase().slice(0, 20);
      const cover = String(body.cover || "").trim().slice(0, 1e3);
      const playUrl = String(body.playUrl || "").trim().slice(0, 2e3);
      if (!/^[a-z0-9][a-z0-9._,-]{0,119}$/.test(id) || !name || !/^[a-z0-9-]{2,20}$/.test(system) || !/^player-(universal|ps1)\.html\?/.test(playUrl) || cover && !/^(https:\/\/pub-[a-z0-9]+\.r2\.dev\/|systems\/|assets\/)/.test(cover))
        return json({ erro: "Jogo invalido." }, 400);
      const game = { id, name, system, cover, playUrl: playUrl.replace(/([?&])nocache=[^&]*&?/, "$1").replace(/[?&]$/, ""), playedAt: Date.now() };
      const next = [game, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== id)].slice(0, 50);
      await env.GAMES.put(key, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } });
      return json({ recorded: true, game, total: next.length });
    }
    if (url.pathname === "/club/saves" && request.method === "GET") {
      const access = await clubAccess(request, url, env);
      if (!access)
        return json({ erro: "Acesso expirado." }, 401);
      const game = (url.searchParams.get("game") || "").trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{0,119}$/.test(game))
        return json({ erro: "Jogo invalido." }, 400);
      const result = await env.GAMES.list({ prefix: `saves/v1/${access.discordId}/${game}/`, limit: 1e3, include: ["customMetadata"] });
      return json({ game, manualSaveLimit: manualSaveLimit(access.plan), saves: result.objects.map((object) => ({ slot: object.customMetadata?.slot || object.key.split("/").pop()?.replace(/\.state$/, ""), name: object.customMetadata?.name || "", size: object.size, updatedAt: object.customMetadata?.updatedAt || object.uploaded.toISOString(), etag: object.httpEtag })) });
    }
    if (url.pathname === "/club/library" && request.method === "GET") {
      const access = await clubAccess(request, url, env);
      if (!access)
        return json({ erro: "Acesso expirado." }, 401);
      const prefix = `saves/v1/${access.discordId}/`;
      const objects = await listAll(env, prefix, ["customMetadata"]);
      const games = /* @__PURE__ */ new Map();
      for (const object of objects) {
        const relative = object.key.slice(prefix.length);
        const separator = relative.lastIndexOf("/");
        if (separator < 1)
          continue;
        const gameId = relative.slice(0, separator);
        const slot = relative.slice(separator + 1).replace(/\.state$/, "");
        const metadata = object.customMetadata || {};
        const game = games.get(gameId) || { id: gameId, name: metadata.gameName || gameId, system: metadata.gameSystem || "", slots: [] };
        if (metadata.gameName)
          game.name = metadata.gameName;
        if (metadata.gameSystem)
          game.system = metadata.gameSystem;
        game.slots.push({ slot, name: metadata.name || (slot === "auto" ? "Autosave" : slot), size: object.size, updatedAt: metadata.updatedAt || object.uploaded.toISOString() });
        games.set(gameId, game);
      }
      const rewards = await streamRewards(env, access.discordId);
      const automaticLimit = automaticGameLimit(access.plan) === null ? null : automaticGameLimit(access.plan) + rewards.bonusAutoGames;
      const result = Array.from(games.values()).map((game) => ({ ...game, slots: game.slots.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) })).sort((a, b) => String(b.slots[0]?.updatedAt || "").localeCompare(String(a.slots[0]?.updatedAt || "")));
      return json({ games: result, automaticGameLimit: automaticLimit, automaticGamesUsed: result.filter((game) => game.slots.some((slot) => slot.slot === "auto")).length, manualSaveLimit: manualSaveLimit(access.plan) === null ? null : manualSaveLimit(access.plan) + rewards.bonusManualSlots, streamMinutes: Math.floor(rewards.minutes), streamRewards: rewards });
    }
    if (url.pathname === "/club/save" && ["GET", "PUT", "DELETE"].includes(request.method)) {
      const access = await clubAccess(request, url, env);
      if (!access)
        return json({ erro: "Acesso expirado." }, 401);
      const target = saveTarget(url, access.discordId);
      if (!target)
        return json({ erro: "Jogo ou slot invalido." }, 400);
      if (!slotAllowed(target.slot, access.plan))
        return json({ erro: "Este slot nao esta incluido no seu plano.", limite: manualSaveLimit(access.plan) }, 403);
      if (request.method === "GET") {
        const object2 = await env.GAMES.get(target.key);
        if (!object2)
          return json({ erro: "Save nao encontrado." }, 404);
        const headers = new Headers(cors);
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Content-Length", String(object2.size));
        headers.set("ETag", object2.httpEtag);
        headers.set("Last-Modified", object2.uploaded.toUTCString());
        headers.set("Cache-Control", "private, no-store");
        headers.set("X-Save-Name", object2.customMetadata?.name || "");
        return new Response(object2.body, { headers });
      }
      if (request.method === "DELETE") {
        const limited = await enforceRateLimit(env, access.discordId, "save-delete", 30, 10 * 60 * 1e3);
        if (limited)
          return limited;
        await env.GAMES.delete(target.key);
        if (target.slot === "auto")
          await env.GAMES.delete(`save-images/v1/${access.discordId}/${target.game}.png`);
        return json({ removido: true, game: target.game, slot: target.slot });
      }
      const limited = await enforceRateLimit(env, access.discordId, "save-upload", 30, 10 * 60 * 1e3);
      if (limited)
        return limited;
      const contentLength = Number(request.headers.get("Content-Length") || 0);
      if (!Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > MAX_SAVE_BYTES)
        return json({ erro: "Save vazio ou maior que 16 MB." }, 413);
      const data = await request.arrayBuffer();
      if (data.byteLength !== contentLength || data.byteLength > MAX_SAVE_BYTES)
        return json({ erro: "Tamanho do save invalido." }, 400);
      const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const name = (request.headers.get("X-Save-Name") || "").trim().slice(0, 60);
      let gameName = "";
      try {
        gameName = decodeURIComponent(request.headers.get("X-Game-Name") || "").trim().slice(0, 100);
      } catch {
        gameName = "";
      }
      const gameSystem = (request.headers.get("X-Game-System") || "").trim().toLowerCase().slice(0, 20);
      if (target.slot === "auto") {
        const existing = await env.GAMES.head(target.key);
        if (!existing) {
          const prefix = `saves/v1/${access.discordId}/`;
          const automaticGames = new Set((await listAll(env, prefix)).filter((item) => item.key.endsWith("/auto.state")).map((item) => item.key.slice(prefix.length).split("/")[0]));
          const rewards = await streamRewards(env, access.discordId);
          const limit = automaticGameLimit(access.plan) === null ? null : automaticGameLimit(access.plan) + rewards.bonusAutoGames;
          if (limit !== null && automaticGames.size >= limit)
            return json({ erro: "Limite de jogos com autosave atingido.", automaticGameLimit: limit, automaticGamesUsed: automaticGames.size }, 409);
        }
      }
      const object = await env.GAMES.put(target.key, data, { httpMetadata: { contentType: "application/octet-stream" }, customMetadata: { game: target.game, slot: target.slot, name, gameName, gameSystem, updatedAt } });
      return json({ salvo: true, game: target.game, slot: target.slot, size: data.byteLength, updatedAt, etag: object?.httpEtag });
    }
    if (url.pathname === "/club/save-image" && ["GET", "PUT"].includes(request.method)) {
      const access = await clubAccess(request, url, env);
      if (!access)
        return json({ erro: "Acesso expirado." }, 401);
      const game = (url.searchParams.get("game") || "").trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{0,119}$/.test(game))
        return json({ erro: "Jogo invalido." }, 400);
      const key = `save-images/v1/${access.discordId}/${game}.png`;
      if (request.method === "GET") {
        const image = await env.GAMES.get(key);
        if (!image)
          return json({ erro: "Imagem do autosave nao encontrada." }, 404);
        const headers = new Headers(cors);
        headers.set("Content-Type", "image/png");
        headers.set("Content-Length", String(image.size));
        headers.set("Cache-Control", "private, no-store");
        return new Response(image.body, { headers });
      }
      const limited = await enforceRateLimit(env, access.discordId, "save-image", 12, 10 * 60 * 1e3);
      if (limited)
        return limited;
      const contentLength = Number(request.headers.get("Content-Length") || 0);
      if (!Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > MAX_SAVE_IMAGE_BYTES)
        return json({ erro: "Imagem vazia ou maior que 4 MB." }, 413);
      const image = await request.arrayBuffer();
      if (image.byteLength !== contentLength || image.byteLength > MAX_SAVE_IMAGE_BYTES)
        return json({ erro: "Tamanho da imagem invalido." }, 400);
      await env.GAMES.put(key, image, { httpMetadata: { contentType: "image/png", cacheControl: "private, no-store" } });
      return json({ salvo: true, game, size: image.byteLength });
    }
    if (request.method === "POST" && url.pathname === "/admin/setup-discord") {
      const authorization = request.headers.get("Authorization");
      const authorized = Boolean(
        env.ADMIN_SETUP_KEY && await timingSafeStringEqual(authorization || "", `Bearer ${env.ADMIN_SETUP_KEY}`) ||
        env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization || "", `Bearer ${env.HERMES_PUBLISH_KEY}`)
      );
      if (!authorized)
        return json({ erro: "Nao autorizado." }, 401);
      const { guildId } = await request.json();
      if (guildId !== DISCORD_GUILD_ID)
        return json({ erro: "Servidor invalido." }, 400);
      const discord = /* @__PURE__ */ __name(async (path, init = {}) => fetch(`https://discord.com/api/v10${path}`, { ...init, headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json", ...init.headers || {} } }), "discord");
      const [rolesResponse, channelsResponse, botResponse] = await Promise.all([discord(`/guilds/${guildId}/roles`), discord(`/guilds/${guildId}/channels`), discord("/users/@me")]);
      if (!rolesResponse.ok || !channelsResponse.ok || !botResponse.ok)
        return json({ erro: "O bot nao conseguiu ler o servidor. Confirme se ele foi instalado." }, 502);
      const roles = await rolesResponse.json();
      const channels = await channelsResponse.json();
      const bot = await botResponse.json();
      const botMemberResponse = await discord(`/guilds/${guildId}/members/${bot.id}`);
      if (!botMemberResponse.ok)
        return json({ erro: "Nao foi possivel localizar o bot como membro do servidor." }, 502);
      const botMember = await botMemberResponse.json();
      const normalize = /* @__PURE__ */ __name((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""), "normalize");
      const findRole = /* @__PURE__ */ __name((name) => roles.find((role) => normalize(role.name) === normalize(name)), "findRole");
      const findChannel = /* @__PURE__ */ __name((name) => channels.find((channel) => normalize(channel.name) === normalize(name)), "findChannel");
      const roleMap = { continue: findRole("Continue"), cartucho: findRole("Cartucho"), arcade: findRole("Arcade") };
      const botRoles = roles.filter((role) => botMember.roles.includes(role.id));
      const channelAccess = { agradecimentos: ["continue", "cartucho", "arcade"], enquetes: ["cartucho", "arcade"], "live-arcade": ["continue", "cartucho", "arcade"], "sugestoes-prioritarias": ["arcade"] };
      const missingRoles = Object.entries(roleMap).filter(([, role]) => !role).map(([name]) => name);
      const missingChannels = Object.keys(channelAccess).filter((name) => !findChannel(name));
      if (missingRoles.length)
        return json({ erro: "Cargos pagos nao encontrados.", missingRoles }, 409);
      let clubCategory = channels.find((channel) => channel.type === 4 && normalize(channel.name) === normalize("CLUBE NEOTERMINALROOM"));
      if (!clubCategory) {
        const createdCategory = await discord(`/guilds/${guildId}/channels`, { method: "POST", body: JSON.stringify({ name: "CLUBE NEOTERMINALROOM", type: 4 }) });
        if (!createdCategory.ok)
          return json({ erro: "Falha ao criar a categoria do Clube.", detalhe: await createdCategory.text() }, 502);
        clubCategory = await createdCategory.json();
        channels.push(clubCategory);
      }
      if (missingChannels.length) {
        for (const name of missingChannels) {
          const created = await discord(`/guilds/${guildId}/channels`, { method: "POST", body: JSON.stringify({ name, type: name === "live-arcade" ? 2 : 0, parent_id: clubCategory.id }) });
          if (!created.ok)
            return json({ erro: `Falha ao criar ${name}.`, detalhe: await created.text() }, 502);
          channels.push(await created.json());
        }
      }
      const highestPlanRole = Math.max(...Object.values(roleMap).map((role) => role.position));
      const highestBotRole = Math.max(...botRoles.map((role) => role.position));
      const controllingBotRole = botRoles.find((role) => role.position === highestBotRole);
      if (highestBotRole <= highestPlanRole)
        return json({ erro: "O cargo mais alto do bot precisa ficar acima de Continue, Cartucho e Arcade.", highestBotRole, highestPlanRole }, 409);
      const view = 1024n;
      const textPermissions = 1024n + 2048n + 65536n;
      const voicePermissions = textPermissions + 1048576n + 2097152n;
      const overwriteFor = /* @__PURE__ */ __name((channel, id) => channel.permission_overwrites?.find((overwrite) => overwrite.id === id && overwrite.type === 0), "overwriteFor");
      const payload = /* @__PURE__ */ __name((channel, id, permitted, everyone = false) => {
        const current = overwriteFor(channel, id);
        let allow = BigInt(current?.allow || "0");
        let deny = BigInt(current?.deny || "0");
        if (everyone) {
          allow &= ~view;
          deny |= view;
        } else if (permitted) {
          const granted = channel.type === 2 ? voicePermissions : textPermissions;
          allow |= granted;
          deny &= ~granted;
        } else {
          allow &= ~view;
          deny |= view;
        }
        return JSON.stringify({ type: 0, allow: String(allow), deny: String(deny) });
      }, "payload");
      for (const [channelName, allowedRoles] of Object.entries(channelAccess)) {
        const channel = findChannel(channelName);
        const moved = await discord(`/channels/${channel.id}`, { method: "PATCH", body: JSON.stringify({ parent_id: clubCategory.id }) });
        if (!moved.ok)
          return json({ erro: `Falha ao mover ${channelName} para a categoria do Clube.`, detalhe: await moved.text() }, 502);
        const botAccess = await discord(`/channels/${channel.id}/permissions/${controllingBotRole.id}`, { method: "PUT", body: payload(channel, controllingBotRole.id, true) });
        if (!botAccess.ok)
          return json({ erro: `Falha ao preservar acesso do bot em ${channelName}.`, detalhe: await botAccess.text() }, 502);
        const everyone = await discord(`/channels/${channel.id}/permissions/${guildId}`, { method: "PUT", body: payload(channel, guildId, false, true) });
        if (!everyone.ok)
          return json({ erro: `Falha ao proteger ${channelName}.`, detalhe: await everyone.text() }, 502);
        for (const [planName, role] of Object.entries(roleMap)) {
          const permitted = allowedRoles.includes(planName);
          const response = await discord(`/channels/${channel.id}/permissions/${role.id}`, { method: "PUT", body: payload(channel, role.id, permitted) });
          if (!response.ok)
            return json({ erro: `Falha em ${channelName}/${planName}.`, detalhe: await response.text() }, 502);
        }
        if (channelName === "live-arcade") {
          const watch = 1024n + 1048576n;
          const speakAndStream = 2097152n + 512n;
          for (const role of [roleMap.continue, roleMap.cartucho]) {
            const response = await discord(`/channels/${channel.id}/permissions/${role.id}`, { method: "PUT", body: JSON.stringify({ type: 0, allow: String(watch), deny: String(speakAndStream) }) });
            if (!response.ok)
              return json({ erro: "Falha ao configurar espectadores da sala.", detalhe: await response.text() }, 502);
          }
          const broadcaster = await discord(`/channels/${channel.id}/permissions/${roleMap.arcade.id}`, { method: "PUT", body: JSON.stringify({ type: 0, allow: String(watch + speakAndStream), deny: "0" }) });
          if (!broadcaster.ok)
            return json({ erro: "Falha ao configurar transmissores Arcade.", detalhe: await broadcaster.text() }, 502);
        }
      }
      return json({ configurado: true, guildId, roles: Object.fromEntries(Object.entries(roleMap).map(([name, role]) => [name, role.id])), channels: Object.fromEntries(Object.keys(channelAccess).map((name) => [name, findChannel(name).id])) });
    }
    if (request.method === "POST" && url.pathname === "/gerar-link") {
      const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
      const limited = await enforceRateLimit(env, `payment:${clientIp}`, "payment-link", 10, 10 * 60 * 1e3);
      if (limited)
        return limited;
      try {
        const body = await request.json();
        const requestedPlan = String(body.plano || "").toLowerCase();
        const isFree = requestedPlan === "livre";
        const planKey = requestedPlan;
        const plan = PLANS[planKey];
        const freeAmount = Math.round(Number(body.valorLivre) * 100) / 100;
        const amount = isFree ? freeAmount : plan?.amount;
        const id = String(body.idMensagem || "");
        const anonymous = body.anonimo === true;
        const name = anonymous ? "Anonimo" : String(body.nome || "").trim().slice(0, 15);
        const message = String(body.mensagem || "").trim().slice(0, 100);
        const discord = isFree ? null : await readToken(String(body.discordToken || ""), env.DISCORD_CLIENT_SECRET);
        if (!plan && !isFree || !amount || amount < 1 || amount > 1e4 || !/^MSG-[0-9]{10,}$/.test(id) || !isFree && (!anonymous && !name) || !isFree && !discord?.discordId)
          return json({ erro: isFree ? "Informe um valor entre R$ 1 e R$ 10.000." : "Conecte uma conta Discord valida antes de apoiar." }, 400);
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.MP_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ title: isFree ? "Apoio livre ao NeoTerminalRoom" : `Clube NeoTerminalRoom - ${plan.title}`, quantity: 1, currency_id: "BRL", unit_price: amount }], external_reference: id, notification_url: WEBHOOK, back_urls: { success: `${SITE}/apoie.html?pagamento=aprovado`, pending: `${SITE}/apoie.html?pagamento=pendente`, failure: `${SITE}/apoie.html?pagamento=falhou` }, auto_return: "approved", metadata: { plan: isFree ? "livre" : planKey } })
        });
        const preference = await mpResponse.json();
        if (!mpResponse.ok || !preference.init_point)
          return json({ erro: "Mercado Pago recusou a preferencia." }, 502);
        const pendingRecord = isFree ? { valor: amount, plano: "livre", status: "pendente", timestamp: Date.now(), exibirMural: false } : { nome: name, mensagem: message, valor: amount, plano: planKey, status: "pendente", timestamp: Date.now(), discordId: discord.discordId, discordUsuario: discord.username, exibirMural: true };
        const pending = await fetch(`${FIREBASE}/${encodeURIComponent(id)}.json`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pendingRecord) });
        if (!pending.ok)
          return json({ erro: "Nao foi possivel registrar o apoio." }, 502);
        return json({ link: preference.init_point });
      } catch {
        return json({ erro: "Erro ao gerar pagamento." }, 500);
      }
    }
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        const body = await request.json().catch(() => ({}));
        const paymentId = String(body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "");
        if (!/^\d+$/.test(paymentId))
          return json({ recebido: true });
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${env.MP_TOKEN}` } });
        if (!paymentResponse.ok)
          return json({ erro: "Pagamento nao encontrado." }, 502);
        const payment = await paymentResponse.json();
        const id = String(payment.external_reference || "");
        const amount = Number(payment.transaction_amount);
        if (payment.status !== "approved" || !/^MSG-[0-9]{10,}$/.test(id))
          return json({ recebido: true });
        const recordResponse = await fetch(`${FIREBASE}/${encodeURIComponent(id)}.json`);
        const record = await recordResponse.json();
        if (!record || Math.abs(Number(record.valor) - amount) > 1e-3)
          return json({ erro: "Valor do pagamento divergente." }, 409);
        if (record.plano === "livre") {
          const update2 = await fetch(`${FIREBASE}/${encodeURIComponent(id)}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "doacao_aprovada", aprovadoEm: Date.now() }) });
          return update2.ok ? json({ recebido: true }) : json({ erro: "Falha ao confirmar doacao." }, 502);
        }
        if (!Object.values(PLANS).some((p) => p.amount === amount))
          return json({ erro: "Valor de plano invalido." }, 409);
        if (!record?.plano || !record.discordId || !DISCORD_ROLES[record.plano])
          return json({ erro: "Apoio sem vinculacao Discord." }, 409);
        for (const roleId of Object.values(DISCORD_ROLES))
          if (roleId !== DISCORD_ROLES[record.plano])
            await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${record.discordId}/roles/${roleId}`, { method: "DELETE", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
        const roleResponse = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${record.discordId}/roles/${DISCORD_ROLES[record.plano]}`, { method: "PUT", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
        const approvedAt = Date.now();
        const discordStatus = roleResponse.ok ? "cargo_liberado" : "falha_ao_liberar";
        if (roleResponse.ok)
          await discordMessage(env, DISCORD_CHANNELS.agradecimentos, { content: `\u{1F3AE} Obrigado, <@${record.discordId}>! Seu apoio **${record.plano === "cafe" ? "Continue" : record.plano === "cartucho" ? "Cartucho" : "Arcade"}** foi confirmado. O cargo e os benef\xEDcios est\xE3o ativos por 30 dias.` });
        const update = await fetch(`${FIREBASE}/${encodeURIComponent(id)}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "aprovado", valor: amount, aprovadoEm: approvedAt, validoAte: approvedAt + 30 * 24 * 60 * 60 * 1e3, discordStatus }) });
        if (!update.ok)
          return json({ erro: "Falha ao liberar apoio." }, 502);
        return json({ recebido: true });
      } catch {
        return json({ erro: "Webhook invalido." }, 400);
      }
    }
    return json({ erro: "Nao encontrado." }, 404);
  },
  async scheduled(_event, env) {
    const response = await fetch(`${FIREBASE}.json`);
    if (!response.ok)
      return;
    const records = await response.json();
    for (const [id, record] of Object.entries(records || {})) {
      if (record.status !== "aprovado" || !record.validoAte || record.validoAte > Date.now() || !record.discordId || !record.plano)
        continue;
      await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${record.discordId}/roles/${DISCORD_ROLES[record.plano]}`, { method: "DELETE", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      await fetch(`${FIREBASE}/${encodeURIComponent(id)}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "expirado", discordStatus: "cargo_removido" }) });
    }
    const now = /* @__PURE__ */ new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const stateResponse = await fetch(`${BOT_STATE}.json`);
    const state = stateResponse.ok ? await stateResponse.json() || {} : {};
    if (now.getUTCDay() === 1 && state.ultimaEnquete !== dayKey) {
      const start = Date.UTC(now.getUTCFullYear(), 0, 1);
      const week = Math.floor((now.getTime() - start) / 6048e5);
      const topic = WEEKLY_POLLS[week % WEEKLY_POLLS.length];
      const poll = await discordMessage(env, DISCORD_CHANNELS.enquetes, { content: `<@&${DISCORD_ROLES.cartucho}> <@&${DISCORD_ROLES.arcade}> \u2014 enquete semanal do Clube:`, poll: { question: { text: topic.question }, answers: topic.answers.map((text) => ({ poll_media: { text } })), duration: 168, allow_multiselect: false } });
      if (poll.ok) {
        state.ultimaEnquete = dayKey;
        await fetch(`${BOT_STATE}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ultimaEnquete: dayKey }) });
      }
    }
    if (now.getUTCDate() === 1 && state.ultimoLembreteLive !== dayKey) {
      const live = await discordMessage(env, DISCORD_CHANNELS.live, { content: `<@&${DISCORD_ROLES.arcade}> \u2014 a sala comunit\xE1ria est\xE1 dispon\xEDvel: apoiadores Arcade podem abrir uma transmiss\xE3o aqui, e os demais membros podem entrar para assistir. Respeitem as regras do servidor e n\xE3o transmitam conte\xFAdo sem autoriza\xE7\xE3o.` });
      if (live.ok) {
        await discordMessage(env, DISCORD_CHANNELS.sugestoes, { content: `<@&${DISCORD_ROLES.arcade}> Use este canal para enviar sua sugest\xE3o priorit\xE1ria do m\xEAs. Inclua nome, sistema e motivo. A equipe far\xE1 a curadoria antes de publicar qualquer conte\xFAdo.` });
        await fetch(`${BOT_STATE}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ultimoLembreteLive: dayKey }) });
      }
    }
  }
};
export {
  MultiplayerRoom,
  SocialPlayer,
  src_default as default
};
//# sourceMappingURL=index.js.map
