var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var SITE = "https://neoterminalroom.com.br";
var WEBHOOK = "https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev/webhook";
var WORKER = "https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev";
var DISCORD_APP_ID = "1537269100114350182";
var DISCORD_GUILD_ID = "1206797125854167110";
var DISCORD_ROLES = { cafe: "1537272991585534093", cartucho: "1537273232665612418", arcade: "1537273467026673674" };
var DISCORD_CHANNELS = { agradecimentos: "1537275305717272706", enquetes: "1537275369160319027", sugestoes: "1537275481122938981", terminalroom: "1542234608907845662" };
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
var TERMINALROOM_DIGESTS = [
  "🎮 **NeoTerminalRoom na prática** — jogue clássicos no navegador, crie seu perfil e proteja seu progresso. O projeto é mantido dentro do NeoTerminalSec para unir preservação digital, código e cultura retrô.",
  "🧠 **Laboratório aberto** — o TerminalRoom conecta emulação, saves na nuvem e multiplayer. Teste um jogo, encontre um problema e traga a evidência para a comunidade técnica.",
  "🔐 **Privacidade e autonomia** — cadastro e saves existem para você continuar sua partida em outros dispositivos. Não envie senhas ou códigos no Discord; use os fluxos oficiais do site.",
  "🛠️ **Atualização da semana** — confira o catálogo, experimente um sistema diferente e compartilhe sua sugestão. O NeoTerminalSec ajuda a transformar testes da comunidade em melhorias reais.",
  "☁️ **Seu progresso continua** — jogue primeiro sem burocracia. Depois do primeiro jogo, o site convida você a criar uma conta grátis; os níveis Apoiador, Guardião e Patrono só entram quando você quiser fortalecer o projeto e receber mais espaço como agradecimento."
];
var PLANS = { cafe: { title: "Apoiador", amount: 5 }, cartucho: { title: "Guardião", amount: 12 }, arcade: { title: "Patrono", amount: 25 } };
var AFFILIATE_CATEGORIES = ["cupons", "destaques", "console-ps5", "console-xbox", "console-nintendo", "controles", "ps5", "xbox", "nintendo", "pc-gamer", "monitores", "audio", "armazenamento", "celulares", "smart-home", "streaming", "retro", "gadgets"];
var AFFILIATE_BOT_SEARCHES = [
  { query: "jogos midia fisica ps5", category: "ps5" }, { query: "jogos midia fisica xbox", category: "xbox" },
  { query: "jogos midia fisica nintendo switch", category: "nintendo" }, { query: "gift card playstation xbox nintendo", category: "destaques" },
  { query: "controle gamer", category: "controles" }, { query: "smart tv 4k", category: "monitores" },
  { query: "ssd nvme gamer", category: "armazenamento" }, { query: "headset gamer", category: "audio" },
  { query: "pc gamer acessorios", category: "pc-gamer" }, { query: "gadgets tecnologia", category: "gadgets" }
];
var DEFAULT_AFFILIATE_PRODUCTS = [];
var paymentKey = (id) => `payments/v1/${encodeURIComponent(String(id))}.json`;
async function getPayment(env, id) {
  const object = await env.GAMES.get(paymentKey(id));
  if (object) return object.json().catch(() => null);
  const migration = await env.GAMES.get("payments/migration-backup.json");
  const legacy = migration ? await migration.json().catch(() => ({})) : {};
  return legacy?.[id] || null;
}
async function putPayment(env, id, value) {
  await env.GAMES.put(paymentKey(id), JSON.stringify(value), { httpMetadata: { contentType: "application/json" } });
  return value;
}
async function patchPayment(env, id, patch) {
  const current = await getPayment(env, id);
  if (!current) return null;
  return putPayment(env, id, { ...current, ...patch });
}
async function allPayments(env) {
  const [records, migration] = await Promise.all([readJsonDirectory(env, "payments/v1/", 1e3), env.GAMES.get("payments/migration-backup.json")]);
  const legacy = migration ? await migration.json().catch(() => ({})) : {};
  return { ...legacy, ...Object.fromEntries(records.map(({ key, value }) => [decodeURIComponent(key.slice("payments/v1/".length).replace(/\.json$/, "")), value])) };
}
function paymentIdentity(record) {
  if (record?.accountUid) return `account:${record.accountUid}`;
  if (record?.discordId) return `discord:${record.discordId}`;
  return "";
}
function supportRecognitionContext(payments) {
  const monthFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" });
  const recordsByIdentity = /* @__PURE__ */ new Map();
  const rankByIdentity = /* @__PURE__ */ new Map();
  const monthsByIdentity = /* @__PURE__ */ new Map();
  const approved = Object.values(payments).filter((record) => paymentIdentity(record) && Number(record?.aprovadoEm || 0) > 0).sort((a, b) => Number(a.aprovadoEm) - Number(b.aprovadoEm));
  for (const record of approved) {
    const identity = paymentIdentity(record);
    if (!rankByIdentity.has(identity)) rankByIdentity.set(identity, rankByIdentity.size + 1);
    if (!recordsByIdentity.has(identity)) recordsByIdentity.set(identity, []);
    if (!monthsByIdentity.has(identity)) monthsByIdentity.set(identity, /* @__PURE__ */ new Set());
    recordsByIdentity.get(identity).push(record);
    monthsByIdentity.get(identity).add(monthFormatter.format(Number(record.aprovadoEm)));
  }
  return { recordsByIdentity, rankByIdentity, monthsByIdentity };
}
function supportRecognition(payments, identity, plan = "", context = null) {
  const index = context || supportRecognitionContext(payments);
  const records = index.recordsByIdentity.get(identity) || [];
  const rank = index.rankByIdentity.get(identity) || 0;
  const supportMonths = index.monthsByIdentity.get(identity)?.size || 0;
  const levelLabels = { cafe: "APOIADOR", cartucho: "GUARDIÃO", arcade: "PATRONO", owner: "ADMIN" };
  const badges = [];
  if (rank > 0 && rank <= 100) badges.push("FUNDADOR");
  if (levelLabels[plan]) badges.push(levelLabels[plan]);
  if (supportMonths >= 12) badges.push("12 MESES"); else if (supportMonths >= 6) badges.push("6 MESES"); else if (supportMonths >= 3) badges.push("3 MESES");
  return { founder: rank > 0 && rank <= 100, founderRank: rank || null, supportMonths, contributions: records.length, memberSince: records[0]?.aprovadoEm || null, badges };
}
var GRANTABLE_BADGES = ["FUNDADOR", "APOIADOR", "GUARDIÃO", "PATRONO", "3 MESES", "6 MESES", "12 MESES"];
function applyBadgeGrants(recognition, grants) {
  const granted = Array.isArray(grants) ? grants.filter((badge) => GRANTABLE_BADGES.includes(badge)) : [];
  return { ...recognition, grantedBadges: granted, badges: [...new Set([...(recognition?.badges || []), ...granted])] };
}
function activeSupportPlan(payments, accountUid, discordId, now = Date.now()) {
  const priority = { cafe: 1, cartucho: 2, arcade: 3 };
  return Object.values(payments).filter((record) => record?.status === "aprovado" && (!record.validoAte || Number(record.validoAte) > now) && (accountUid && String(record.accountUid || "") === accountUid || discordId && String(record.discordId || "") === discordId)).sort((a, b) => Number(priority[b.plano] || 0) - Number(priority[a.plano] || 0) || Number(b.aprovadoEm || 0) - Number(a.aprovadoEm || 0))[0]?.plano || "registered";
}
function isCompleteAffiliateProduct(product, now = Date.now()) {
  const image = String(product?.image || "");
  const couponComplete = product?.kind === "coupon" && /^[A-Z0-9][A-Z0-9_-]{3,29}$/i.test(String(product?.couponCode || "")) && /^https:\/\//i.test(String(product?.url || ""));
  const linkComplete = product?.kind === "link" && /^https:\/\//i.test(String(product?.url || ""));
  const productComplete = product?.kind !== "coupon" && product?.kind !== "link" && Number(product?.price) > 0 && /^https:\/\//i.test(image);
  return product?.active !== false && (couponComplete || linkComplete || productComplete) && (!product.expiresAt || Number(product.expiresAt) > now);
}
__name(isCompleteAffiliateProduct, "isCompleteAffiliateProduct");
async function affiliateBotState(env) {
  const [state, config] = await Promise.all([env.GAMES.get("affiliate/bot/state.json"), env.GAMES.get("affiliate/bot/config.json")]);
  return { state: state ? await state.json().catch(() => ({})) : {}, config: config ? await config.json().catch(() => ({})) : { active: false, expiresHours: 36, searches: AFFILIATE_BOT_SEARCHES } };
}
__name(affiliateBotState, "affiliateBotState");
async function mercadoLivreAccessToken(env) {
  if (env.ML_ACCESS_TOKEN) return env.ML_ACCESS_TOKEN;
  const savedObject = await env.GAMES.get("affiliate/bot/oauth.json");
  const saved = savedObject ? await savedObject.json().catch(() => null) : null;
  if (saved?.accessToken && Number(saved.expiresAt) > Date.now() + 5 * 60 * 1e3) return saved.accessToken;
  if (saved?.refreshToken && env.ML_CLIENT_ID && env.ML_CLIENT_SECRET) {
    const refreshBody = new URLSearchParams({ grant_type: "refresh_token", client_id: env.ML_CLIENT_ID, client_secret: env.ML_CLIENT_SECRET, refresh_token: saved.refreshToken });
    const refreshed = await fetch("https://api.mercadolibre.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: refreshBody });
    if (refreshed.ok) {
      const data = await refreshed.json();
      const token = { accessToken: String(data.access_token || ""), refreshToken: String(data.refresh_token || saved.refreshToken), expiresAt: Date.now() + Math.max(300, Number(data.expires_in) || 21600) * 1e3, userId: String(data.user_id || saved.userId || ""), updatedAt: Date.now() };
      await env.GAMES.put("affiliate/bot/oauth.json", JSON.stringify(token), { httpMetadata: { contentType: "application/json" } });
      return token.accessToken;
    }
  }
  if (!env.ML_CLIENT_ID || !env.ML_CLIENT_SECRET) return "";
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: env.ML_CLIENT_ID, client_secret: env.ML_CLIENT_SECRET });
  const response = await fetch("https://api.mercadolibre.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) {
    console.error(JSON.stringify({ event: "affiliate_token_error", status: response.status }));
    return "";
  }
  const data = await response.json();
  return String(data.access_token || "");
}
__name(mercadoLivreAccessToken, "mercadoLivreAccessToken");
async function runAffiliateBot(env) {
  const { config } = await affiliateBotState(env);
  if (!config.active) return { ok: false, reason: "inactive", candidates: [] };
  const accessToken = await mercadoLivreAccessToken(env);
  if (!accessToken) return { ok: false, reason: "missing_token", candidates: [] };
  const searches = Array.isArray(config.searches) && config.searches.length ? config.searches.slice(0, 12) : AFFILIATE_BOT_SEARCHES;
  const collected = [];
  for (const search of searches) {
    const endpoint = new URL("https://api.mercadolibre.com/sites/MLB/search");
    endpoint.searchParams.set("q", cleanProfileText(search.query, 80)); endpoint.searchParams.set("limit", "12");
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) {
      console.error(JSON.stringify({ event: "affiliate_search_error", status: response.status, query: search.query, detail: (await response.text()).slice(0, 300) }));
      continue;
    }
    const data = await response.json();
    for (const item of data.results || []) {
      const price = Number(item.price || 0), originalPrice = Number(item.original_price || 0);
      const discount = originalPrice > price && price > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
      const image = String(item.thumbnail || "").replace(/^http:/, "https:").slice(0, 1e3);
      if (!item.id || !item.title || !item.permalink || price <= 0 || !/^https:\/\//i.test(image)) continue;
      collected.push({ id: String(item.id), title: cleanProfileText(item.title, 120), permalink: String(item.permalink).slice(0, 1e3), image, price, originalPrice: originalPrice > price ? originalPrice : 0, discount, freeShipping: Boolean(item.shipping?.free_shipping), category: AFFILIATE_CATEGORIES.includes(search.category) ? search.category : "destaques", score: discount * 3 + (item.shipping?.free_shipping ? 20 : 0) + Math.min(20, Number(item.sold_quantity || 0) / 10) });
    }
  }
  const unique = [...new Map(collected.map((item) => [item.id, item])).values()].sort((a, b) => b.score - a.score).slice(0, 80);
  const state = { ok: true, ranAt: Date.now(), candidates: unique };
  await env.GAMES.put("affiliate/bot/state.json", JSON.stringify(state), { httpMetadata: { contentType: "application/json" } });
  return state;
}
__name(runAffiliateBot, "runAffiliateBot");
async function storeAffiliateImage(env, productId, sourceUrl) {
  if (!sourceUrl) return "";
  try {
    const parsed = new URL(sourceUrl); if (parsed.protocol !== "https:") return "";
    const response = await fetch(parsed, { redirect: "follow" }); if (!response.ok) return "";
    const contentType = String(response.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
    const extensions = { "image/avif": "avif", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }; if (!extensions[contentType]) return "";
    const declared = Number(response.headers.get("Content-Length") || 0); if (declared > MAX_SAVE_IMAGE_BYTES) return "";
    const bytes = await response.arrayBuffer(); if (!bytes.byteLength || bytes.byteLength > MAX_SAVE_IMAGE_BYTES) return "";
    const extension = extensions[contentType], key = `affiliate/images/${productId}.${extension}`;
    await env.GAMES.put(key, bytes, { httpMetadata: { contentType, cacheControl: "public, max-age=86400" } });
    return `${WORKER}/affiliate/image/${productId}.${extension}`;
  } catch (_) { return ""; }
}
__name(storeAffiliateImage, "storeAffiliateImage");
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
async function discordDirectMessage(env, userId, content) {
  const channel = await fetch("https://discord.com/api/v10/users/@me/channels", { method: "POST", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ recipient_id: userId }) });
  if (!channel.ok) return false;
  const data = await channel.json().catch(() => ({}));
  const sent = await discordMessage(env, data.id, { content });
  return sent.ok;
}
__name(discordDirectMessage, "discordDirectMessage");
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
    return verified ? { uid: claims.sub, email: claims.email || "", emailVerified: claims.email_verified === true, provider: claims.firebase?.sign_in_provider || "" } : null;
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
    return { uid: discord.accountId, email: "", emailVerified: true, provider: "discord.com", username: discord.username || "" };
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
  if (access?.purpose === "account" && /^discord-\d{10,25}$/.test(access.accountId)) {
    const rawDiscordId = access.accountId.slice("discord-".length);
    const plan = activeSupportPlan(await allPayments(env), access.accountId, rawDiscordId);
    return { discordId: access.accountId, rawDiscordId, accountUid: access.accountId, username: access.username || "", plan, purpose: "club", exp: access.exp };
  }
  const firebase = await firebaseAccess(token);
  if (!firebase) return null;
  const plan = activeSupportPlan(await allPayments(env), firebase.uid, "");
  return { discordId: `firebase-${firebase.uid}`, firebaseUid: firebase.uid, accountUid: firebase.uid, username: firebase.email.split("@")[0], plan, purpose: "club", exp: Date.now() + 55 * 60 * 1e3 };
}
__name(clubAccess, "clubAccess");
function saveTarget(url, discordId) {
  const game = (url.searchParams.get("game") || "").trim().toLowerCase();
  const slot = (url.searchParams.get("slot") || "auto").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,119}$/.test(game) || slot !== "auto" && slot !== "previous" && !/^manual-[1-9]\d{0,8}$/.test(slot))
    return null;
  return { game, slot, key: `saves/v1/${discordId}/${game}/${slot}.state` };
}
__name(saveTarget, "saveTarget");
function manualSaveLimit(plan) {
  return plan === "registered" ? 3 : plan === "cafe" ? 7 : plan === "cartucho" ? 20 : null;
}
__name(manualSaveLimit, "manualSaveLimit");
function automaticGameLimit(plan) {
  return plan === "registered" ? 3 : plan === "cafe" ? 5 : plan === "cartucho" ? 15 : null;
}
__name(automaticGameLimit, "automaticGameLimit");
async function referralRewards(env, uid) {
  const object = await env.GAMES.get(`referrals/rewards/${encodeURIComponent(uid)}.json`);
  if (!object) return { points: 0, shares: 0, referrals: 0, bonusAutoGames: 0, bonusManualSlots: 0, awarded: [] };
  const value = await object.json().catch(() => ({}));
  return { ...value, points: Number(value.points) || 0, shares: Number(value.shares) || 0, referrals: Number(value.referrals) || 0, bonusAutoGames: Number(value.bonusAutoGames) || 0, bonusManualSlots: Number(value.bonusManualSlots) || 0, awarded: Array.isArray(value.awarded) ? value.awarded : [] };
}
__name(referralRewards, "referralRewards");
function applyReferralTiers(reward) {
  const next = { ...reward, awarded: [...(reward.awarded || [])] };
  const earned = [];
  for (const [threshold, id, field, amount] of [[5, "share-5", "bonusAutoGames", 1], [15, "community-15", "bonusManualSlots", 2], [30, "community-30", "bonusAutoGames", 2]]) {
    if (next.points >= threshold && !next.awarded.includes(id)) { next.awarded.push(id); next[field] = (Number(next[field]) || 0) + amount; earned.push(id); }
  }
  return { next, earned };
}
__name(applyReferralTiers, "applyReferralTiers");
async function referralCode(env, uid) {
  const ownerKey = `referrals/owners/${encodeURIComponent(uid)}.json`;
  const current = await env.GAMES.get(ownerKey);
  if (current) return String((await current.json()).code || "");
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  await Promise.all([
    env.GAMES.put(ownerKey, JSON.stringify({ code, uid, createdAt: Date.now() }), { httpMetadata: { contentType: "application/json" } }),
    env.GAMES.put(`referrals/codes/${code}.json`, JSON.stringify({ uid, createdAt: Date.now() }), { httpMetadata: { contentType: "application/json" } })
  ]);
  return code;
}
__name(referralCode, "referralCode");
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
async function readJsonDirectory(env, prefix, limit = 500) {
  const objects = (await listAll(env, prefix)).slice(-limit);
  return (await Promise.all(objects.map(async (object) => {
    const record = await env.GAMES.get(object.key);
    if (!record) return null;
    const value = await record.json().catch(() => null);
    return value ? { key: object.key, size: object.size, uploaded: object.uploaded?.toISOString?.() || "", value } : null;
  }))).filter(Boolean);
}
__name(readJsonDirectory, "readJsonDirectory");
async function activeRoomSummaries(env, limit = 100) {
  const directory = (await listAll(env, "multiplayer/rooms/")).slice(-limit);
  const checked = await Promise.all(directory.map(async (object) => {
    const roomId = object.key.split("/").pop()?.replace(/\.json$/, "") || "";
    if (!/^[a-f0-9]{12}$/.test(roomId)) return { object, summary: null, stale: true };
    const response = await env.MULTIPLAYER_ROOMS.getByName(roomId).fetch(new Request("https://room/summary"));
    if (!response.ok) return { object, summary: null, stale: response.status === 404 };
    const summary = await response.json();
    const active = summary.status === "waiting" && Number(summary.online) > 0;
    return { object, summary: active ? summary : null, stale: !active };
  }));
  await Promise.all(checked.filter((entry) => entry.stale).map((entry) => env.GAMES.delete(entry.object.key)));
  return checked.map((entry) => entry.summary).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
}
__name(activeRoomSummaries, "activeRoomSummaries");
function catalogOverrideId(system, rom) {
  const name = String(rom || "").split("/").pop() || "game";
  return `${system}-${name}`.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
__name(catalogOverrideId, "catalogOverrideId");
async function adminAudit(env, action, target, detail = {}) {
  const now = Date.now();
  const actor = cleanProfileText(detail?.actor, 64) || "admin";
  const safeDetail = { ...detail };
  delete safeDetail.actor;
  const record = { id: crypto.randomUUID(), actor, action, target: String(target || "").slice(0, 180), detail: safeDetail, createdAt: now };
  await env.GAMES.put(`admin/audit/${String(now).padStart(16, "0")}-${record.id}.json`, JSON.stringify(record), { httpMetadata: { contentType: "application/json" } });
  return record;
}
__name(adminAudit, "adminAudit");
function slotAllowed(slot, plan) {
  if (slot === "auto" || slot === "previous")
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
    if (request.method === "POST" && url.pathname === "/admin-close") {
      const room = await this.room();
      if (!room) return Response.json({ closed: false }, { status: 404 });
      room.status = "closed";
      await this.ctx.storage.put("room", room);
      for (const socket of this.ctx.getWebSockets()) socket.close(1000, "Sala encerrada pela administracao");
      return Response.json({ closed: true, roomId: room.id });
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
    if (request.method === "GET" && url.pathname === "/affiliate/oauth/callback") {
      const code = String(url.searchParams.get("code") || ""), state = String(url.searchParams.get("state") || "");
      const stateObject = state ? await env.GAMES.get(`affiliate/bot/oauth-state/${state}.json`) : null;
      const savedState = stateObject ? await stateObject.json().catch(() => null) : null;
      if (!code || !savedState || Date.now() - Number(savedState.createdAt) > 10 * 60 * 1e3) return json({ erro: "Autorização inválida ou expirada." }, 400);
      await env.GAMES.delete(`affiliate/bot/oauth-state/${state}.json`);
      const redirectUri = `${WORKER}/affiliate/oauth/callback`;
      const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: env.ML_CLIENT_ID, client_secret: env.ML_CLIENT_SECRET, code, redirect_uri: redirectUri }) });
      if (!tokenResponse.ok) return json({ erro: "O Mercado Livre recusou a autorização." }, 502);
      const data = await tokenResponse.json();
      const token = { accessToken: String(data.access_token || ""), refreshToken: String(data.refresh_token || ""), expiresAt: Date.now() + Math.max(300, Number(data.expires_in) || 21600) * 1e3, userId: String(data.user_id || ""), updatedAt: Date.now() };
      if (!token.accessToken || !token.refreshToken) return json({ erro: "Autorização incompleta." }, 502);
      await env.GAMES.put("affiliate/bot/oauth.json", JSON.stringify(token), { httpMetadata: { contentType: "application/json" } });
      return new Response("<!doctype html><meta charset=utf-8><title>Neo Terminal</title><style>body{background:#030805;color:#55ff88;font:20px Consolas;padding:60px;text-align:center}</style><h1>NEO TERMINAL</h1><p>Mercado Livre conectado. Você pode fechar esta aba.</p>", { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (request.method === "GET" && url.pathname === "/affiliate/products") {
      const account = await accountAccess(request, env);
      if (!account)
        return json({ erro: "Entre ou cadastre-se para acessar as ofertas." }, 401);
      const profile = await env.GAMES.head(`profiles/v1/${encodeURIComponent(account.uid)}.json`);
      if (!profile)
        return json({ erro: "Complete seu cadastro para acessar as ofertas." }, 403);
      const saved = await readJsonDirectory(env, "affiliate/products/", 500);
      const merged = new Map(DEFAULT_AFFILIATE_PRODUCTS.map((product) => [product.id, product]));
      for (const record of saved) merged.set(record.value.id, { ...(merged.get(record.value.id) || {}), ...record.value, image: record.value.image || merged.get(record.value.id)?.image || "" });
      const now = Date.now();
      const discountOf = (product) => {
        const price = Number(product.price || 0), original = Number(product.originalPrice || 0);
        return original > price && price > 0 ? (original - price) / original : 0;
      };
      const products = [...merged.values()].filter((product) => isCompleteAffiliateProduct(product, now)).sort((a, b) => discountOf(b) - discountOf(a) || Number(a.price || Infinity) - Number(b.price || Infinity) || Number(b.publishedAt || 0) - Number(a.publishedAt || 0));
      const activeCategories = AFFILIATE_CATEGORIES.filter((category) => products.some((product) => product.category === category));
      return json({ products, categories: activeCategories, disclosure: "Alguns links sao afiliados. O NeoTerminalRoom pode receber comissao, sem custo adicional para voce." });
    }
    if (request.method === "GET" && url.pathname === "/affiliate/public-products") {
      const saved = await readJsonDirectory(env, "affiliate/products/", 500);
      const now = Date.now();
      const products = saved.map((record) => record.value).filter((product) => isCompleteAffiliateProduct(product, now));
      const controls = products.filter((product) => /controle|gamepad|joystick|volante|arcade stick/i.test(`${product.title || ""} ${product.description || ""} ${product.category || ""} ${(product.tags || []).join(" ")}`));
      const selected = [...controls, ...products.filter((product) => !controls.includes(product))].slice(0, 4).map((product) => ({ id: product.id, title: String(product.title || "Oferta gamer").slice(0, 100), price: Number(product.price || 0), originalPrice: Number(product.originalPrice || 0), discount: Number(product.discount || 0), image: String(product.image || ""), url: String(product.url || ""), source: String(product.source || product.store || "Oferta") }));
      return json({ products: selected, disclosure: "Alguns links sao afiliados. O NeoTerminalRoom pode receber comissao, sem custo adicional para voce." });
    }
    if (request.method === "GET" && url.pathname === "/public/hall") {
      const now = Date.now();
      const [payments, registrations, migration, achievementRecords, profileRecords] = await Promise.all([allPayments(env), readJsonDirectory(env, "hall/registrations/", 200), env.GAMES.get("hall/registrations-backup.json"), readJsonDirectory(env, "support/achievements/", 100), readJsonDirectory(env, "profiles/v1/", 500)]);
      const legacyRegistrations = migration ? await migration.json().catch(() => ({})) : {};
      const profilesByUid = new Map(profileRecords.map((record) => [String(record.value?.uid || ""), record.value]));
      const profilesByName = new Map();
      for (const record of profileRecords) {
        const key = cleanProfileText(record.value?.name, 40).toLocaleLowerCase("pt-BR");
        if (!key) continue;
        const matches = profilesByName.get(key) || [];
        matches.push(record.value); profilesByName.set(key, matches);
      }
      const recognitionIndex = supportRecognitionContext(payments);
      const supporters = Object.values(payments).filter((record) => record?.status === "aprovado" && record.exibirMural !== false && (!record.validoAte || Number(record.validoAte) > now)).map((record) => ({ nome: cleanProfileText(record.anonimo ? "Anonimo" : record.nome, 40), mensagem: cleanProfileText(record.mensagem, 240), valor: record.exibirValor === false ? null : Number(record.valor || 0), validoAte: Number(record.validoAte || 0), recognition: applyBadgeGrants(supportRecognition(payments, paymentIdentity(record), record.plano, recognitionIndex), profilesByUid.get(String(record.accountUid || ""))?.badgeGrants) })).slice(-10).reverse();
      const monthPartsFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" });
      const monthKeyFor = (timestamp) => {
        const parts = Object.fromEntries(monthPartsFormatter.formatToParts(timestamp).map((part) => [part.type, part.value]));
        return `${parts.year}-${parts.month}`;
      };
      const monthKey = monthKeyFor(now);
      const currentParts = Object.fromEntries(monthPartsFormatter.formatToParts(now).map((part) => [part.type, part.value]));
      const previousMonthKey = monthKeyFor(Date.UTC(Number(currentParts.year), Number(currentParts.month) - 2, 15, 12));
      const approvedPayments = Object.values(payments).filter((record) => ["aprovado", "doacao_aprovada"].includes(record?.status) && Number(record?.aprovadoEm || 0) > 0);
      const monthlyPayments = approvedPayments.filter((record) => {
        const approvedAt = Number(record?.aprovadoEm || 0);
        return monthKeyFor(approvedAt) === monthKey;
      });
      const previousMonthRaised = approvedPayments.filter((record) => monthKeyFor(Number(record.aprovadoEm)) === previousMonthKey).reduce((total, record) => total + Number(record.valor || 0), 0);
      const hasEarlierHistory = approvedPayments.some((record) => monthKeyFor(Number(record.aprovadoEm)) < monthKey);
      const automaticGoalValue = hasEarlierHistory ? Math.min(1000, Math.max(100, Math.ceil(previousMonthRaised * 1.1 / 50) * 50)) : 300;
      const goalOverrideObject = await env.GAMES.get(`support/goals/${monthKey}.json`);
      const goalOverride = goalOverrideObject ? await goalOverrideObject.json().catch(() => null) : null;
      const manualGoalValue = Number(goalOverride?.goal || 0);
      const hasManualGoal = Number.isFinite(manualGoalValue) && manualGoalValue >= 1;
      const monthlyGoalValue = hasManualGoal ? manualGoalValue : automaticGoalValue;
      const monthlyRaised = monthlyPayments.reduce((total, record) => total + Number(record.valor || 0), 0);
      const supportGoal = { month: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", month: "long", year: "numeric" }).format(now), monthKey, goal: monthlyGoalValue, raised: Number(monthlyRaised.toFixed(2)), percentage: Math.round(monthlyRaised / monthlyGoalValue * 100), contributions: monthlyPayments.length, automatic: !hasManualGoal, automaticGoal: automaticGoalValue, previousMonthRaised: Number(previousMonthRaised.toFixed(2)) };
      const storedRegistrations = registrations.map((record) => ({ ...record.value, uid: record.value.uid || decodeURIComponent(record.key.slice("hall/registrations/".length).replace(/\.json$/, "")) }));
      const members = [...Object.values(legacyRegistrations), ...storedRegistrations].sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)).slice(0, 5).map((record) => {
        const nameKey = cleanProfileText(record.nome, 40).toLocaleLowerCase("pt-BR");
        const nameMatches = profilesByName.get(nameKey) || [];
        const profile = profilesByUid.get(String(record.uid || "")) || profilesByUid.get(String(record.uid || "").replace(/^firebase-/, "")) || (nameMatches.length === 1 ? nameMatches[0] : null);
        const uid = String(profile?.uid || record.uid || "");
        const identity = uid ? `account:${uid}` : "";
        const plan = uid ? activeSupportPlan(payments, uid, "", now) : "registered";
        return { nome: cleanProfileText(record.nome, 40), mensagem: cleanProfileText(record.mensagem, 100), avatar: PROFILE_AVATARS.includes(record.avatar) ? record.avatar : "avatar-01", recognition: identity ? applyBadgeGrants(supportRecognition(payments, identity, plan, recognitionIndex), profile?.badgeGrants) : { badges: [] } };
      });
      const achievements = achievementRecords.map((record) => record.value).filter((item) => item?.active !== false).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0)).slice(0, 6).map((item) => ({ id: String(item.id || ""), title: cleanProfileText(item.title, 100), description: cleanProfileText(item.description, 300), category: cleanProfileText(item.category, 30), date: String(item.date || "").slice(0, 10) }));
      return json({ supporters, members, supportGoal, achievements, updatedAt: now });
    }
    const affiliateImageMatch = url.pathname.match(/^\/affiliate\/image\/([a-z0-9._-]{3,80})\.(avif|jpe?g|png|webp)$/i);
    if (request.method === "GET" && affiliateImageMatch) {
      const key = `affiliate/images/${affiliateImageMatch[1].toLowerCase()}.${affiliateImageMatch[2].toLowerCase()}`;
      const object = await env.GAMES.get(key); if (!object) return json({ erro: "Imagem nao encontrada." }, 404);
      const headers = new Headers(cors); object.writeHttpMetadata(headers); headers.set("Cache-Control", "public, max-age=86400"); headers.set("ETag", object.httpEtag);
      return new Response(object.body, { headers });
    }
    if (request.method === "GET" && url.pathname === "/catalog/overrides") {
      const system = String(url.searchParams.get("system") || "").toLowerCase();
      if (!/^(nes|snes|n64|gba|megadrive|ps1|atari2600)$/.test(system)) return json({ erro: "Sistema invalido." }, 400);
      const records = await readJsonDirectory(env, `catalog/overrides/${system}/`, 2e3);
      return json({ system, overrides: Object.fromEntries(records.map((record) => [record.value.id, record.value])) });
    }
    const adminCoverMatch = url.pathname.match(/^\/catalog\/admin-cover\/(nes|snes|n64|gba|megadrive|ps1|atari2600)\/([a-z0-9._-]+)\.(avif|gif|jpe?g|png|webp)$/i);
    if (request.method === "GET" && adminCoverMatch) {
      const key = `catalog/admin-covers/${adminCoverMatch[1].toLowerCase()}/${adminCoverMatch[2].toLowerCase()}.${adminCoverMatch[3].toLowerCase()}`;
      const object = await env.GAMES.get(key);
      if (!object) return json({ erro: "Capa nao encontrada." }, 404);
      const headers = new Headers(cors);
      object.writeHttpMetadata(headers);
      headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("ETag", object.httpEtag);
      return new Response(object.body, { headers });
    }
    if (request.method === "POST" && url.pathname === "/internal/admin-cover") {
      const provided = request.headers.get("X-Admin-Key") || "";
      if (!env.ADMIN_PANEL_KEY || !await timingSafeStringEqual(provided, env.ADMIN_PANEL_KEY)) return json({ erro: "Nao autorizado." }, 401);
      const system = String(request.headers.get("X-Game-System") || "").toLowerCase();
      const rom = decodeURIComponent(request.headers.get("X-Game-Rom") || "");
      const contentType = String(request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
      const extensions = { "image/avif": "avif", "image/gif": "gif", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const length = Number(request.headers.get("Content-Length") || 0);
      if (!/^(nes|snes|n64|gba|megadrive|ps1|atari2600)$/.test(system) || !rom || rom.length > 300) return json({ erro: "Jogo invalido." }, 400);
      if (!extensions[contentType]) return json({ erro: "Use uma imagem AVIF, GIF, JPG, PNG ou WEBP." }, 415);
      if (!Number.isSafeInteger(length) || length < 1 || length > MAX_SAVE_IMAGE_BYTES) return json({ erro: "A capa deve ter no maximo 4 MB." }, 413);
      const bytes = await request.arrayBuffer();
      if (bytes.byteLength !== length || bytes.byteLength > MAX_SAVE_IMAGE_BYTES) return json({ erro: "Tamanho da capa invalido." }, 400);
      const id = catalogOverrideId(system, rom);
      const extension = extensions[contentType];
      const imageKey = `catalog/admin-covers/${system}/${id}.${extension}`;
      const overrideKey = `catalog/overrides/${system}/${id}.json`;
      const currentObject = await env.GAMES.get(overrideKey);
      const current = currentObject ? await currentObject.json().catch(() => ({})) : {};
      const version = Date.now();
      const capa = `${WORKER}/catalog/admin-cover/${system}/${id}.${extension}?v=${version}`;
      const override = { ...current, id, system, rom, capa, updatedAt: version };
      const oldCoverKeys = ["avif", "gif", "jpg", "jpeg", "png", "webp"].filter((item) => item !== extension).map((item) => `catalog/admin-covers/${system}/${id}.${item}`);
      await Promise.all([...oldCoverKeys.map((key) => env.GAMES.delete(key)), env.GAMES.put(imageKey, bytes, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } }), env.GAMES.put(overrideKey, JSON.stringify(override), { httpMetadata: { contentType: "application/json" } }), adminAudit(env, "game-cover-upload", id, { system, actor: cleanProfileText(request.headers.get("X-Admin-Actor"), 64) || "admin", bytes: bytes.byteLength })]);
      return json({ capa, override });
    }
    if (request.method === "POST" && url.pathname === "/internal/admin-console") {
      const provided = request.headers.get("X-Admin-Key") || "";
      if (!env.ADMIN_PANEL_KEY || !await timingSafeStringEqual(provided, env.ADMIN_PANEL_KEY)) return json({ erro: "Nao autorizado." }, 401);
      const clientIp = request.headers.get("CF-Connecting-IP") || "admin";
      const limited = await enforceRateLimit(env, clientIp, "admin-console", 120, 60e3);
      if (limited) return limited;
      const body = await request.json().catch(() => ({}));
      const action = String(body.action || "");
      const actor = cleanProfileText(body.adminActor, 64) || "admin";
      const audit = (auditAction, target, detail = {}) => adminAudit(env, auditAction, target, { ...detail, actor });
      const validUid = (value) => /^[a-zA-Z0-9._:@-]{2,180}$/.test(String(value || ""));
      const storageIds = (uid) => String(uid).startsWith("discord-") ? [String(uid)] : [String(uid), `firebase-${uid}`];
      if (action === "overview") {
        const prefixes = ["profiles/v1/", "social/presence/", "saves/v1/", "save-images/v1/", "history/v1/", "referrals/rewards/"];
        const [directories, activeRooms] = await Promise.all([Promise.all(prefixes.map((prefix) => listAll(env, prefix))), activeRoomSummaries(env)]);
        const now = Date.now();
        const presence = await readJsonDirectory(env, "social/presence/", 500);
        const online = presence.filter((record) => now - Number(record.value.updatedAt || 0) < 9e4).length;
        const payments = await allPayments(env);
        const approved = Object.values(payments).filter((record) => record?.status === "aprovado").length;
        const affiliateProducts = await readJsonDirectory(env, "affiliate/products/", 500);
        const referralClaims = await readJsonDirectory(env, "referrals/claims/", 1e3);
        return json({ counts: { ...Object.fromEntries(prefixes.map((prefix, index) => [prefix, directories[index].length])), "multiplayer/rooms/": activeRooms.length, "affiliate/products/": affiliateProducts.length, "referrals/claims/": referralClaims.length }, online, approvedPayments: approved, funnel: { registered: directories[0].length, withSaves: new Set(directories[2].map((item) => item.key.slice("saves/v1/".length).split("/")[0])).size, referrals: referralClaims.length, activeOffers: affiliateProducts.filter((item) => isCompleteAffiliateProduct(item.value)).length }, generatedAt: now });
      }
      if (action === "accounts") {
        const [profiles, presence, rewards, saveObjects] = await Promise.all([readJsonDirectory(env, "profiles/v1/", 500), readJsonDirectory(env, "social/presence/", 500), readJsonDirectory(env, "referrals/rewards/", 500), listAll(env, "saves/v1/")]);
        const presenceMap = new Map(presence.map((record) => [record.value.uid, record.value]));
        const rewardMap = new Map(rewards.map((record) => [decodeURIComponent(record.key.slice("referrals/rewards/".length).replace(/\.json$/, "")), record.value]));
        const saveCounts = new Map();
        for (const object of saveObjects) { const storedUid = object.key.slice("saves/v1/".length).split("/")[0]; const uid = storedUid.startsWith("firebase-") ? storedUid.slice("firebase-".length) : storedUid; saveCounts.set(uid, (saveCounts.get(uid) || 0) + 1); }
        const now = Date.now();
        return json({ accounts: profiles.map((record) => { const profile = record.value; const live = presenceMap.get(profile.uid); return { ...profile, online: Boolean(live && now - Number(live.updatedAt || 0) < 9e4), presence: live || null, rewards: rewardMap.get(profile.uid) || null, saves: saveCounts.get(profile.uid) || 0 }; }).sort((a, b) => Number(b.online) - Number(a.online) || String(a.name).localeCompare(String(b.name), "pt-BR")) });
      }
      if (action === "profile-update") {
        const uid = String(body.uid || "");
        if (!validUid(uid)) return json({ erro: "Conta invalida." }, 400);
        const key = `profiles/v1/${encodeURIComponent(uid)}.json`;
        const object = await env.GAMES.get(key);
        if (!object) return json({ erro: "Perfil nao encontrado." }, 404);
        const current = await object.json();
        const patch = body.profile || {};
        const avatar = cleanProfileText(patch.avatar ?? current.avatar, 40).toLowerCase();
        if (patch.avatar != null && !PROFILE_AVATARS.includes(avatar)) return json({ erro: "Avatar invalido." }, 400);
        for (const field of ["instagram", "youtube", "facebook", "tiktok"]) if (String(patch[field] || "").trim() && !safeProfileUrl(patch[field])) return json({ erro: `Link de ${field} invalido.` }, 400);
        const next = { ...current, name: cleanProfileText(patch.name ?? current.name, 20), avatar, locality: cleanProfileText(patch.locality ?? current.locality, 80), bio: cleanProfileText(patch.bio ?? current.bio, 280), phone: cleanProfileText(patch.phone ?? current.phone, 30), instagram: safeProfileUrl(patch.instagram ?? current.instagram), youtube: safeProfileUrl(patch.youtube ?? current.youtube), facebook: safeProfileUrl(patch.facebook ?? current.facebook), tiktok: safeProfileUrl(patch.tiktok ?? current.tiktok), updatedAt: Date.now() };
        if (!next.name || next.name.length < 2) return json({ erro: "Nome invalido." }, 400);
        await env.GAMES.put(key, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } });
        await audit(action, uid, { before: current, after: next });
        return json({ profile: next });
      }
      if (action === "entitlements-update") {
        const uid = String(body.uid || "");
        if (!validUid(uid)) return json({ erro: "Conta invalida." }, 400);
        const key = `referrals/rewards/${encodeURIComponent(uid)}.json`;
        const object = await env.GAMES.get(key);
        const current = object ? await object.json().catch(() => ({})) : {};
        const bonusManualSlots = Math.max(0, Math.min(999, Math.floor(Number(body.bonusManualSlots) || 0)));
        const bonusAutoGames = Math.max(0, Math.min(999, Math.floor(Number(body.bonusAutoGames) || 0)));
        const points = Math.max(0, Math.min(1e7, Number(body.points ?? current.points) || 0));
        const tiered = applyReferralTiers({ ...current, points, bonusManualSlots, bonusAutoGames, awarded: Array.isArray(current.awarded) ? current.awarded : [] });
        const next = { ...tiered.next, updatedAt: Date.now() };
        await env.GAMES.put(key, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } });
        await audit(action, uid, { before: current, after: next, earned: tiered.earned });
        return json({ rewards: next });
      }
      if (action === "badge-grants-update") {
        const uid = String(body.uid || "");
        if (!validUid(uid)) return json({ erro: "Conta invalida." }, 400);
        const key = `profiles/v1/${encodeURIComponent(uid)}.json`;
        const object = await env.GAMES.get(key);
        if (!object) return json({ erro: "Perfil nao encontrado." }, 404);
        const current = await object.json();
        const badges = [...new Set((Array.isArray(body.badges) ? body.badges : []).map((badge) => String(badge).toUpperCase()).filter((badge) => GRANTABLE_BADGES.includes(badge)))];
        const next = { ...current, badgeGrants: badges, badgeGrantsUpdatedAt: Date.now(), updatedAt: Date.now() };
        await env.GAMES.put(key, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } });
        await audit(action, uid, { before: current.badgeGrants || [], after: badges });
        return json({ uid, badges });
      }
      if (action === "account-saves") {
        const uid = String(body.uid || "");
        if (!validUid(uid)) return json({ erro: "Conta invalida." }, 400);
        const objects = (await Promise.all(storageIds(uid).map((id) => listAll(env, `saves/v1/${encodeURIComponent(id)}/`, ["customMetadata"])))).flat();
        return json({ saves: objects.map((object) => ({ key: object.key, size: object.size, uploaded: object.uploaded?.toISOString?.() || "", metadata: object.customMetadata || {} })) });
      }
      if (action === "save-delete") {
        const uid = String(body.uid || ""); const key = String(body.key || "");
        if (!validUid(uid) || !storageIds(uid).some((id) => key.startsWith(`saves/v1/${encodeURIComponent(id)}/`)) || body.confirm !== key) return json({ erro: "Confirmacao de save invalida." }, 400);
        await env.GAMES.delete(key); await audit(action, uid, { key });
        return json({ deleted: true, key });
      }
      if (action === "account-delete-data") {
        const uid = String(body.uid || "");
        if (!validUid(uid) || body.confirm !== uid) return json({ erro: "Confirmacao de conta invalida." }, 400);
        const profileObject = await env.GAMES.get(`profiles/v1/${encodeURIComponent(uid)}.json`);
        const profile = profileObject ? await profileObject.json().catch(() => null) : null;
        if (profile?.referrerUid) {
          const rewardKey = `referrals/rewards/${encodeURIComponent(profile.referrerUid)}.json`;
          const reward = await referralRewards(env, profile.referrerUid);
          await env.GAMES.put(rewardKey, JSON.stringify({ ...reward, referrals: Math.max(0, reward.referrals - 1), points: Math.max(0, reward.points - 10), updatedAt: Date.now() }), { httpMetadata: { contentType: "application/json" } });
        }
        const ids = storageIds(uid);
        const prefixes = ids.flatMap((id) => [`saves/v1/${encodeURIComponent(id)}/`, `save-images/v1/${encodeURIComponent(id)}/`]);
        const children = (await Promise.all(prefixes.map((prefix) => listAll(env, prefix)))).flat();
        const ownerKey = `referrals/owners/${encodeURIComponent(uid)}.json`;
        const ownerObject = await env.GAMES.get(ownerKey);
        const owner = ownerObject ? await ownerObject.json().catch(() => null) : null;
        await Promise.all(children.map((object) => env.GAMES.delete(object.key)));
        const directKeys = [`profiles/v1/${encodeURIComponent(uid)}.json`, `history/v1/${encodeURIComponent(uid)}.json`, `social/presence/${encodeURIComponent(uid)}.json`, `referrals/rewards/${encodeURIComponent(uid)}.json`, `referrals/claims/${encodeURIComponent(uid)}.json`, ownerKey, ...(owner?.code ? [`referrals/codes/${owner.code}.json`] : [])];
        await Promise.all(directKeys.map((key) => env.GAMES.delete(key)));
        await env.GAMES.delete(`hall/registrations/${encodeURIComponent(uid)}.json`);
        await audit(action, uid, { deletedObjects: children.length + directKeys.length });
        return json({ deleted: true, uid, objects: children.length + directKeys.length });
      }
      if (action === "rooms") {
        return json({ rooms: await activeRoomSummaries(env) });
      }
      if (action === "room-close") {
        const roomId = String(body.roomId || "");
        if (!/^[a-f0-9]{12}$/.test(roomId) || body.confirm !== roomId) return json({ erro: "Sala invalida." }, 400);
        const response = await env.MULTIPLAYER_ROOMS.getByName(roomId).fetch(new Request("https://room/admin-close", { method: "POST" }));
        await env.GAMES.delete(`multiplayer/rooms/${roomId}.json`); await audit(action, roomId);
        return json({ closed: response.ok, roomId });
      }
      if (action === "payments") {
        const values = await allPayments(env);
        const payments = Object.entries(values).map(([id, record]) => ({ id, plano: record?.plano || "", valor: Number(record?.valor || record?.valorEsperado || 0), status: record?.status || "", nome: record?.anonimo ? "Anonimo" : cleanProfileText(record?.nome, 40), discordId: record?.discordId || "", criadoEm: record?.criadoEm || 0, aprovadoEm: record?.aprovadoEm || 0, validoAte: record?.validoAte || 0, discordStatus: record?.discordStatus || "" })).sort((a, b) => Number(b.criadoEm) - Number(a.criadoEm)).slice(0, 500);
        return json({ payments });
      }
      if (action === "support-goal-get") {
        const month = String(body.month || "");
        if (!/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(month)) return json({ erro: "Mes invalido." }, 400);
        const object = await env.GAMES.get(`support/goals/${month}.json`);
        const override = object ? await object.json().catch(() => null) : null;
        return json({ month, override: override && Number(override.goal) >= 1 ? override : null });
      }
      if (action === "support-goal-set") {
        const month = String(body.month || "");
        const goal = Number(body.goal);
        if (!/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(month)) return json({ erro: "Mes invalido." }, 400);
        if (!Number.isFinite(goal) || goal < 1 || goal > 1e5) return json({ erro: "Informe uma meta entre R$ 1 e R$ 100.000." }, 400);
        const key = `support/goals/${month}.json`;
        const beforeObject = await env.GAMES.get(key);
        const before = beforeObject ? await beforeObject.json().catch(() => null) : null;
        const override = { month, goal: Number(goal.toFixed(2)), updatedAt: Date.now(), updatedBy: actor };
        await env.GAMES.put(key, JSON.stringify(override), { httpMetadata: { contentType: "application/json" } });
        await audit(action, month, { before, after: override });
        return json({ month, override });
      }
      if (action === "support-goal-clear") {
        const month = String(body.month || "");
        if (!/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(month)) return json({ erro: "Mes invalido." }, 400);
        const key = `support/goals/${month}.json`;
        const beforeObject = await env.GAMES.get(key);
        const before = beforeObject ? await beforeObject.json().catch(() => null) : null;
        await env.GAMES.delete(key);
        await audit(action, month, { before });
        return json({ month, override: null });
      }
      if (action === "support-achievements") {
        const records = await readJsonDirectory(env, "support/achievements/", 200);
        return json({ achievements: records.map((record) => record.value).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0)) });
      }
      if (action === "support-achievement-upsert") {
        const input = body.achievement || {};
        const id = String(input.id || crypto.randomUUID()).toLowerCase();
        const title = cleanProfileText(input.title, 100);
        const description = cleanProfileText(input.description, 300);
        const category = String(input.category || "melhoria").toLowerCase();
        const date = String(input.date || "");
        if (!/^[a-f0-9-]{8,40}$/.test(id)) return json({ erro: "Resultado invalido." }, 400);
        if (!title || !description || !/^(servidores|acervo|emuladores|recursos|correcoes|comunidade)$/.test(category) || !/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(date)) return json({ erro: "Preencha titulo, descricao, categoria e data validos." }, 400);
        const key = `support/achievements/${id}.json`;
        const beforeObject = await env.GAMES.get(key);
        const before = beforeObject ? await beforeObject.json().catch(() => null) : null;
        const achievement = { id, title, description, category, date, active: input.active !== false, createdAt: Number(before?.createdAt || Date.now()), updatedAt: Date.now(), updatedBy: actor };
        await env.GAMES.put(key, JSON.stringify(achievement), { httpMetadata: { contentType: "application/json" } });
        await audit(action, id, { before, after: achievement });
        return json({ achievement });
      }
      if (action === "support-achievement-delete") {
        const id = String(body.id || "").toLowerCase();
        if (!/^[a-f0-9-]{8,40}$/.test(id) || body.confirm !== id) return json({ erro: "Confirmacao invalida." }, 400);
        const key = `support/achievements/${id}.json`;
        const beforeObject = await env.GAMES.get(key);
        const before = beforeObject ? await beforeObject.json().catch(() => null) : null;
        if (!before) return json({ erro: "Resultado nao encontrado." }, 404);
        await env.GAMES.delete(key);
        await audit(action, id, { before });
        return json({ deleted: true, id });
      }
      if (action === "discord-plan") {
        const discordId = String(body.discordId || ""); const plan = String(body.plan || "none");
        if (!/^\d{10,25}$/.test(discordId) || !["none", "cafe", "cartucho", "arcade"].includes(plan)) return json({ erro: "Cargo invalido." }, 400);
        const headers = { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` };
        for (const roleId of Object.values(DISCORD_ROLES)) await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${roleId}`, { method: "DELETE", headers });
        if (plan !== "none") { const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${DISCORD_ROLES[plan]}`, { method: "PUT", headers }); if (!response.ok) return json({ erro: "Discord recusou o cargo.", detalhe: await response.text() }, 502); }
        await audit(action, discordId, { plan }); return json({ updated: true, discordId, plan });
      }
      if (action === "payment-update") {
        const paymentId = String(body.paymentId || ""); const plan = String(body.plan || "none");
        if (!/^MSG-[0-9]{10,}$/.test(paymentId) || !["none", "cafe", "cartucho", "arcade"].includes(plan)) return json({ erro: "Pagamento ou plano invalido." }, 400);
        const record = await getPayment(env, paymentId);
        if (!record) return json({ erro: "Pagamento nao encontrado." }, 404);
        const discordId = String(record.discordId || "");
        if (!/^\d{10,25}$/.test(discordId)) return json({ erro: "Pagamento sem conta Discord valida." }, 409);
        const headers = { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` };
        for (const roleId of Object.values(DISCORD_ROLES)) await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${roleId}`, { method: "DELETE", headers });
        if (plan !== "none") { const role = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${DISCORD_ROLES[plan]}`, { method: "PUT", headers }); if (!role.ok) return json({ erro: "Discord recusou o cargo." }, 502); }
        const now = Date.now();
        const patch = plan === "none" ? { plano: record.plano, status: "expirado", validoAte: now, discordStatus: "cargo_removido" } : { plano: plan, status: "aprovado", aprovadoEm: Number(record.aprovadoEm) || now, validoAte: Number(body.validUntil) > now ? Number(body.validUntil) : now + 30 * 24 * 60 * 60 * 1e3, discordStatus: "cargo_liberado" };
        await patchPayment(env, paymentId, patch);
        await audit(action, paymentId, { before: { plano: record.plano, status: record.status, validoAte: record.validoAte }, after: patch, discordId });
        return json({ updated: true, paymentId, plan, payment: { ...record, ...patch } });
      }
      if (action === "payment-delete") {
        const paymentId = String(body.paymentId || "");
        if (!/^MSG-[0-9]{10,}$/.test(paymentId) || body.confirm !== paymentId) return json({ erro: "Confirmação de pagamento inválida." }, 400);
        const record = await getPayment(env, paymentId);
        if (!record) return json({ erro: "Pagamento não encontrado." }, 404);
        await env.GAMES.delete(paymentKey(paymentId));
        await audit(action, paymentId, { before: record });
        return json({ deleted: true, paymentId });
      }
      if (action === "affiliate-products") {
        const saved = await readJsonDirectory(env, "affiliate/products/", 500);
        const merged = new Map(DEFAULT_AFFILIATE_PRODUCTS.map((product) => [product.id, product]));
        for (const record of saved) merged.set(record.value.id, record.value);
        return json({ products: [...merged.values()].sort((a, b) => Number(a.position || 999) - Number(b.position || 999)), categories: AFFILIATE_CATEGORIES });
      }
      if (action === "affiliate-bot-status") {
        const bot = await affiliateBotState(env);
        const oauth = await env.GAMES.head("affiliate/bot/oauth.json");
        return json({ ...bot, tokenConfigured: Boolean(env.ML_ACCESS_TOKEN || oauth || env.ML_CLIENT_ID && env.ML_CLIENT_SECRET), accountAuthorized: Boolean(env.ML_ACCESS_TOKEN || oauth), defaultSearches: AFFILIATE_BOT_SEARCHES });
      }
      if (action === "affiliate-oauth-start") {
        if (!env.ML_CLIENT_ID || !env.ML_CLIENT_SECRET) return json({ erro: "Aplicação do Mercado Livre não configurada." }, 409);
        const state = crypto.randomUUID();
        await env.GAMES.put(`affiliate/bot/oauth-state/${state}.json`, JSON.stringify({ createdAt: Date.now() }), { httpMetadata: { contentType: "application/json" } });
        const authorize = new URL("https://auth.mercadolivre.com.br/authorization");
        authorize.searchParams.set("response_type", "code"); authorize.searchParams.set("client_id", env.ML_CLIENT_ID); authorize.searchParams.set("redirect_uri", `${WORKER}/affiliate/oauth/callback`); authorize.searchParams.set("state", state);
        return json({ url: authorize.toString() });
      }
      if (action === "affiliate-bot-config") {
        const searches = Array.isArray(body.searches) ? body.searches.map((item) => ({ query: cleanProfileText(item.query, 80), category: AFFILIATE_CATEGORIES.includes(item.category) ? item.category : "destaques" })).filter((item) => item.query).slice(0, 12) : AFFILIATE_BOT_SEARCHES;
        const config = { active: Boolean(body.active), expiresHours: Math.max(12, Math.min(168, Math.floor(Number(body.expiresHours) || 36))), searches, updatedAt: Date.now() };
        await env.GAMES.put("affiliate/bot/config.json", JSON.stringify(config), { httpMetadata: { contentType: "application/json" } });
        await audit(action, "affiliate-bot", { active: config.active, expiresHours: config.expiresHours, searches: config.searches.length });
        return json({ config });
      }
      if (action === "affiliate-bot-run") {
        const result = await runAffiliateBot(env);
        await audit(action, "affiliate-bot", { ok: result.ok, reason: result.reason || "", candidates: result.candidates?.length || 0 });
        return result.ok ? json(result) : json({ erro: result.reason === "missing_token" ? "Cadastre o segredo ML_ACCESS_TOKEN no Worker." : "Ative o robô nas configurações." }, 409);
      }
      if (action === "affiliate-bot-publish") {
        const { state, config } = await affiliateBotState(env); const candidate = (state.candidates || []).find((item) => item.id === String(body.candidateId || ""));
        if (!candidate) return json({ erro: "Achado não encontrado. Execute uma nova busca." }, 404);
        let affiliateUrl; try { affiliateUrl = new URL(String(body.affiliateUrl || "")); } catch (_) { return json({ erro: "Cole o link gerado na Central de Afiliados." }, 400); }
        if (affiliateUrl.protocol !== "https:" || !/(^|\.)(meli\.la|mercadolivre\.com\.br)$/i.test(affiliateUrl.hostname)) return json({ erro: "Use um link afiliado HTTPS do Mercado Livre." }, 400);
        const id = `achado-${candidate.id.toLowerCase().replace(/[^a-z0-9._-]/g, "-")}`.slice(0, 80), now = Date.now();
        const description = `${candidate.discount ? `${candidate.discount}% de desconto. ` : ""}${candidate.freeShipping ? "Frete grátis. " : ""}Preço e disponibilidade podem mudar no Mercado Livre.`;
        if (!(Number(candidate.price) > 0) || !/^https:\/\//i.test(String(candidate.image || ""))) return json({ erro: "O produto precisa ter preço e imagem original válidos." }, 409);
        const ownImage = await storeAffiliateImage(env, id, candidate.image);
        if (!ownImage) return json({ erro: "Não foi possível validar e armazenar a imagem original do produto." }, 502);
        const product = { id, title: candidate.title, description, url: affiliateUrl.toString(), image: ownImage, category: candidate.category, tags: ["achado-neoterminal", candidate.category], featured: candidate.score >= 50, active: true, position: 1, price: candidate.price, originalPrice: candidate.originalPrice, discount: candidate.discount, freeShipping: candidate.freeShipping, publishedAt: now, expiresAt: now + Math.max(12, Math.min(168, Number(config.expiresHours) || 36)) * 36e5, sourceId: candidate.id, updatedAt: now };
        await env.GAMES.put(`affiliate/products/${id}.json`, JSON.stringify(product), { httpMetadata: { contentType: "application/json" } });
        await audit(action, id, { sourceId: candidate.id, expiresAt: product.expiresAt }); return json({ product });
      }
      if (action === "affiliate-upsert") {
        const input = body.product || {};
        const kind = input.kind === "coupon" ? "coupon" : input.kind === "link" ? "link" : "product";
        const id = String(input.id || crypto.randomUUID()).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
        const title = cleanProfileText(input.title, 120); const description = cleanProfileText(input.description, 300); const category = String(input.category || "destaques").toLowerCase();
        let productUrl; let image = "";
        try { productUrl = new URL(String(input.url || "")); } catch (_) { return json({ erro: "Link afiliado invalido." }, 400); }
        const isMercadoLivre = productUrl.protocol === "https:" && /(^|\.)(meli\.la|mercadolivre\.com\.br)$/i.test(productUrl.hostname);
        const isAmazon = productUrl.protocol === "https:" && /(^|\.)amazon\.com\.br$/i.test(productUrl.hostname)
          && productUrl.searchParams.get("tag") === "neoterminalro-20" && (kind === "coupon" || /^\/dp\/[A-Z0-9]{10}(?:\/|$)/i.test(productUrl.pathname));
        const isShopee = productUrl.protocol === "https:" && productUrl.hostname.toLowerCase() === "s.shopee.com.br" && /^\/[A-Za-z0-9_-]{6,32}\/?$/.test(productUrl.pathname);
        if (!isMercadoLivre && !isAmazon && !isShopee) return json({ erro: "Use um link afiliado HTTPS válido do Mercado Livre, Amazon Brasil ou Shopee." }, 400);
        if (String(input.image || "").trim()) { try { const parsed = new URL(String(input.image)); if (parsed.protocol !== "https:") throw new Error(); image = parsed.toString().slice(0, 1000); } catch (_) { return json({ erro: "Imagem invalida. Use HTTPS." }, 400); } }
        if (!id || title.length < 3 || !AFFILIATE_CATEGORIES.includes(category)) return json({ erro: "Produto ou categoria invalida." }, 400);
        const price = Number(input.price);
        const couponCode = cleanProfileText(input.couponCode, 30).toUpperCase(); const terms = cleanProfileText(input.terms, 500); const merchant = cleanProfileText(input.merchant, 30);
        if (kind === "product" && !(price > 0)) return json({ erro: "O preço atual é obrigatório e deve ser maior que zero." }, 400);
        if (kind === "product" && !image) return json({ erro: "A imagem original HTTPS do produto é obrigatória." }, 400);
        if (kind === "coupon" && (!/^[A-Z0-9][A-Z0-9_-]{3,29}$/.test(couponCode) || terms.length < 8)) return json({ erro: "Cupom precisa de código e regras válidas." }, 400);
        const now = Date.now();
        const product = { id, kind, title, description, url: productUrl.toString(), image: kind === "product" ? image : "", category: kind === "coupon" ? "cupons" : category, couponCode: kind === "coupon" ? couponCode : "", terms: kind === "coupon" ? terms : "", merchant: kind === "coupon" ? merchant : "", tags: Array.isArray(input.tags) ? input.tags.map((tag) => cleanProfileText(tag, 30)).filter(Boolean).slice(0, 12) : [], featured: Boolean(input.featured), active: input.active !== false, position: Math.max(1, Math.min(9999, Math.floor(Number(input.position) || 999))), price: kind === "product" ? price : 0, originalPrice: kind === "product" ? Math.max(0, Number(input.originalPrice) || 0) : 0, discount: Math.max(0, Math.min(100, Number(input.discount) || 0)), publishedAt: Number(input.publishedAt) || now, expiresAt: Number(input.expiresAt) || now + 36 * 36e5, updatedAt: now };
        await env.GAMES.put(`affiliate/products/${id}.json`, JSON.stringify(product), { httpMetadata: { contentType: "application/json" } });
        await audit(action, id, { title, category, active: product.active });
        return json({ product });
      }
      if (action === "affiliate-delete") {
        const id = String(body.id || "");
        if (!/^[a-z0-9._-]{3,80}$/.test(id) || body.confirm !== id) return json({ erro: "Confirmacao invalida." }, 400);
        await env.GAMES.put(`affiliate/products/${id}.json`, JSON.stringify({ id, active: false, position: 9999, updatedAt: Date.now() }), { httpMetadata: { contentType: "application/json" } });
        await audit(action, id);
        return json({ deleted: true, id });
      }
      if (action === "games") {
        const system = String(body.system || "snes").toLowerCase();
        if (!/^(nes|snes|n64|gba|megadrive|ps1|atari2600)$/.test(system)) return json({ erro: "Sistema invalido." }, 400);
        const [catalogResponse, overrides] = await Promise.all([fetch(`${SITE}/systems/${system}/games.json`, { cf: { cacheTtl: 300 } }), readJsonDirectory(env, `catalog/overrides/${system}/`, 2e3)]);
        if (!catalogResponse.ok) return json({ erro: "Catalogo indisponivel." }, 502);
        const overrideMap = new Map(overrides.map((record) => [record.value.id, record.value]));
        const games = (await catalogResponse.json()).map((game) => { const id = catalogOverrideId(system, game.rom); return { id, system, ...game, override: overrideMap.get(id) || null }; });
        return json({ system, games });
      }
      if (action === "game-override") {
        const system = String(body.system || "").toLowerCase(); const rom = String(body.rom || "");
        if (!/^(nes|snes|n64|gba|megadrive|ps1|atari2600)$/.test(system) || !rom || rom.length > 300) return json({ erro: "Jogo invalido." }, 400);
        const id = catalogOverrideId(system, rom); const input = body.override || {};
        const capa = cleanProfileText(input.capa, 500);
        const ownUpload = capa.startsWith(`${WORKER}/catalog/admin-cover/${system}/${id}.`);
        const catalogFile = /^[a-zA-Z0-9][a-zA-Z0-9._() -]*\.(?:avif|gif|jpe?g|png|webp)$/i.test(capa);
        if (capa && !ownUpload && !catalogFile) return json({ erro: "URLs externas nao sao permitidas. Envie a capa pelo painel." }, 400);
        const override = { id, system, rom, nome: cleanProfileText(input.nome, 100), descricao: cleanProfileText(input.descricao, 2e3), nota: cleanProfileText(input.nota, 10), capa, hidden: Boolean(input.hidden), updatedAt: Date.now() };
        if (!override.nome && !override.descricao && !override.nota && !override.capa && !override.hidden) await env.GAMES.delete(`catalog/overrides/${system}/${id}.json`);
        else await env.GAMES.put(`catalog/overrides/${system}/${id}.json`, JSON.stringify(override), { httpMetadata: { contentType: "application/json" } });
        await audit(action, id, { system, hidden: override.hidden, capa: override.capa }); return json({ override });
      }
      if (action === "referrals-admin") {
        const [profiles, rewards, owners] = await Promise.all([readJsonDirectory(env, "profiles/v1/", 1e3), readJsonDirectory(env, "referrals/rewards/", 1e3), readJsonDirectory(env, "referrals/owners/", 1e3)]);
        const profileMap = new Map(profiles.map((record) => [record.value.uid, record.value]));
        const rewardMap = new Map(rewards.map((record) => [decodeURIComponent(record.key.slice("referrals/rewards/".length).replace(/\.json$/, "")), record.value]));
        const ownerMap = new Map(owners.map((record) => [record.value.uid, record.value]));
        return json({ referrals: profiles.filter((record) => record.value.referrerUid).map((record) => ({ uid: record.value.uid, name: record.value.name, createdAt: record.value.createdAt, referrerUid: record.value.referrerUid, referrerName: profileMap.get(record.value.referrerUid)?.name || "", code: ownerMap.get(record.value.referrerUid)?.code || "" })), rewards: [...rewardMap].map(([uid, reward]) => ({ uid, name: profileMap.get(uid)?.name || "", ...reward })) });
      }
      if (action === "referral-revoke") {
        const uid = String(body.uid || "");
        if (!validUid(uid) || body.confirm !== uid) return json({ erro: "Confirmacao de indicacao invalida." }, 400);
        const profileKey = `profiles/v1/${encodeURIComponent(uid)}.json`;
        const object = await env.GAMES.get(profileKey);
        if (!object) return json({ erro: "Perfil nao encontrado." }, 404);
        const profile = await object.json();
        const referrerUid = String(profile.referrerUid || "");
        if (!referrerUid) return json({ erro: "A conta nao possui indicacao ativa." }, 409);
        const rewardKey = `referrals/rewards/${encodeURIComponent(referrerUid)}.json`;
        const current = await referralRewards(env, referrerUid);
        const next = { ...current, referrals: Math.max(0, current.referrals - 1), points: Math.max(0, current.points - 10), updatedAt: Date.now() };
        const { referrerUid: _removed, ...nextProfile } = profile;
        await Promise.all([env.GAMES.put(profileKey, JSON.stringify(nextProfile), { httpMetadata: { contentType: "application/json" } }), env.GAMES.put(rewardKey, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } }), env.GAMES.delete(`referrals/claims/${encodeURIComponent(uid)}.json`)]);
        await audit(action, uid, { referrerUid, pointsRemoved: 10 });
        return json({ revoked: true, uid, referrerUid, rewards: next });
      }
      if (action === "account-export") {
        const uid = String(body.uid || "");
        if (!validUid(uid)) return json({ erro: "Conta invalida." }, 400);
        const [profile, history, rewards, saves] = await Promise.all([env.GAMES.get(`profiles/v1/${encodeURIComponent(uid)}.json`).then((o) => o?.json() || null), env.GAMES.get(`history/v1/${encodeURIComponent(uid)}.json`).then((o) => o?.json() || null), referralRewards(env, uid), Promise.all(storageIds(uid).map((id) => listAll(env, `saves/v1/${encodeURIComponent(id)}/`, ["customMetadata"]))).then((groups) => groups.flat())]);
        await audit(action, uid, { saves: saves.length });
        return json({ exportedAt: Date.now(), uid, profile, history, rewards, saves: saves.map((item) => ({ key: item.key, size: item.size, uploaded: item.uploaded?.toISOString?.() || "", metadata: item.customMetadata || {} })) });
      }
      if (action === "audit") return json({ audit: (await readJsonDirectory(env, "admin/audit/", 1e3)).map((record) => record.value).reverse() });
      return json({ erro: "Acao administrativa desconhecida." }, 404);
    }
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
        return json({ presence });
      }
      if (request.method === "GET" && url.pathname === "/social/players") {
        const [profileDirectory, presenceDirectory, payments] = await Promise.all([listAll(env, "profiles/v1/"), listAll(env, "social/presence/"), allPayments(env)]);
        const now = Date.now();
        const recognitionIndex = supportRecognitionContext(payments);
        const recognitionFor = (uid) => supportRecognition(payments, `account:${uid}`, activeSupportPlan(payments, uid, "", now), recognitionIndex);
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
          const online = Boolean(live && now - live.updatedAt < 9e4);
          return { uid: candidate.uid, name: candidate.name, avatar: candidate.avatar, recognition: applyBadgeGrants(recognitionFor(candidate.uid), candidate.badgeGrants), age: profileAge(candidate.birthDate), locality: candidate.locality || "", bio: candidate.bio || "", instagram: candidate.instagram || "", youtube: candidate.youtube || "", facebook: candidate.facebook || "", tiktok: candidate.tiktok || "", watchRoomId: online && live?.page === "game" ? live.roomId || "" : "", watchTitle: online && live?.page === "game" ? live.roomTitle || "" : "", online, page: online ? live.page : "offline", lastSeenAt: live?.updatedAt || null };
        }))).filter(Boolean).sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, "pt-BR")).slice(0, 500);
        return json({ self: { uid: account.uid, name: profile.name, avatar: profile.avatar, recognition: applyBadgeGrants(recognitionFor(account.uid), profile.badgeGrants) }, players });
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
      const summaries = (await activeRoomSummaries(env)).map((summary) => {
        if (!summary.isPublic || summary.status !== "waiting" || summary.seatsUsed >= summary.maxPlayers)
          return null;
        const { hostUid, ...publicSummary } = summary;
        return publicSummary;
      });
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
    if (request.method === "POST" && url.pathname === "/admin/publish-terminalroom-digest") {
      const authorization = request.headers.get("Authorization") || "";
      const authorized = env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.HERMES_PUBLISH_KEY}`) || env.ADMIN_PANEL_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.ADMIN_PANEL_KEY}`);
      if (!authorized)
        return json({ erro: "Nao autorizado." }, 401);
      const stateObject = await env.GAMES.get("club/bot-state.json");
      const state = stateObject ? await stateObject.json().catch(() => ({})) : {};
      const index = Number(state.terminalRoomDigestIndex || 0) % TERMINALROOM_DIGESTS.length;
      const content = `${TERMINALROOM_DIGESTS[index]}\n\n🌐 Site: ${SITE}\n☁️ Saves e planos: ${SITE}/apoie.html#planos\n💬 Comunidade: programação, IA, segurança e hacktivismo no NeoTerminalSec.`;
      const result = await discordMessage(env, state.terminalRoomChannelId || DISCORD_CHANNELS.terminalroom, { content });
      if (!result.ok) return json({ erro: "O Discord recusou o aviso.", detalhe: await result.text() }, 502);
      const now = new Date();
      const digestKey = `terminalroom-${now.getUTCFullYear()}-${Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 6048e5)}`;
      state.ultimoTerminalRoomDigest = digestKey;
      state.terminalRoomDigestIndex = (index + 1) % TERMINALROOM_DIGESTS.length;
      await env.GAMES.put("club/bot-state.json", JSON.stringify(state), { httpMetadata: { contentType: "application/json" } });
      return json({ publicado: true, canal: state.terminalRoomChannelId || DISCORD_CHANNELS.terminalroom });
    }
    if (request.method === "POST" && url.pathname === "/admin/cleanup-discord") {
      const authorization = request.headers.get("Authorization") || "";
      const authorized = env.ADMIN_PANEL_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.ADMIN_PANEL_KEY}`) || env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.HERMES_PUBLISH_KEY}`);
      if (!authorized) return json({ erro: "Nao autorizado." }, 401);
      const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      if (!channelsResponse.ok) return json({ erro: "Nao foi possivel ler os canais do Discord." }, 502);
      const channels = await channelsResponse.json();
      const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const obsolete = channels.filter((channel) => ["conteudo-antecipado", "live-arcade"].map(normalize).includes(normalize(channel.name)));
      const removed = [];
      for (const channel of obsolete) {
        const response = await fetch(`https://discord.com/api/v10/channels/${channel.id}`, { method: "DELETE", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
        if (response.ok) removed.push(channel.name);
      }
      let announcement = channels.find((channel) => normalize(channel.name) === "avisosterminalroom" && channel.type === 0);
      if (!announcement) {
        const category = channels.find((channel) => channel.type === 4 && normalize(channel.name) === "neoterminalroom");
        const created = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, { method: "POST", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: "avisos-terminalroom", type: 0, parent_id: category?.id || null, topic: "Atualizações automáticas do NeoTerminalRoom, projeto do NeoTerminalSec." }) });
        if (!created.ok) return json({ erro: "Nao foi possivel criar o canal de avisos.", removidos: removed }, 502);
        announcement = await created.json();
      }
      const stateObject = await env.GAMES.get("club/bot-state.json");
      const state = stateObject ? await stateObject.json().catch(() => ({})) : {};
      state.terminalRoomChannelId = announcement.id;
      await env.GAMES.put("club/bot-state.json", JSON.stringify(state), { httpMetadata: { contentType: "application/json" } });
      return json({ removidos: removed, canalAvisos: { id: announcement.id, name: announcement.name } });
    }
    if (request.method === "GET" && url.pathname === "/admin/discord-audit") {
      const authorization = request.headers.get("Authorization") || "";
      const authorized = env.ADMIN_PANEL_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.ADMIN_PANEL_KEY}`) || env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.HERMES_PUBLISH_KEY}`);
      if (!authorized) return json({ erro: "Nao autorizado." }, 401);
      const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      if (!response.ok) return json({ erro: "Nao foi possivel ler os canais do Discord." }, 502);
      const channels = await response.json();
      return json({ channels: channels.map((channel) => ({ id: channel.id, name: channel.name, type: channel.type, parentId: channel.parent_id || "" })) });
    }
    if (request.method === "GET" && url.pathname === "/admin/discord-channel-permissions") {
      const authorization = request.headers.get("Authorization") || "";
      const authorized = env.ADMIN_PANEL_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.ADMIN_PANEL_KEY}`) || env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.HERMES_PUBLISH_KEY}`);
      if (!authorized) return json({ erro: "Nao autorizado." }, 401);
      const stateObject = await env.GAMES.get("club/bot-state.json");
      const state = stateObject ? await stateObject.json().catch(() => ({})) : {};
      const response = await fetch(`https://discord.com/api/v10/channels/${state.terminalRoomChannelId || DISCORD_CHANNELS.terminalroom}`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      if (!response.ok) return json({ erro: "Nao foi possivel ler o canal." }, 502);
      const channel = await response.json();
      return json({ id: channel.id, name: channel.name, type: channel.type, permissionOverwrites: channel.permission_overwrites || [] });
    }
    if (request.method === "GET" && url.pathname === "/admin/discord-bots-audit") {
      const authorization = request.headers.get("Authorization") || "";
      const authorized = env.ADMIN_PANEL_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.ADMIN_PANEL_KEY}`) || env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.HERMES_PUBLISH_KEY}`);
      if (!authorized) return json({ erro: "Nao autorizado." }, 401);
      const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000`, { headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      if (!response.ok) return json({ erro: "Nao foi possivel listar os membros do Discord.", detalhe: await response.text() }, 502);
      const members = await response.json();
      const bots = members.filter((member) => member.user?.bot).map((member) => ({ id: member.user.id, username: member.user.username, globalName: member.user.global_name || "", roles: member.roles || [], joinedAt: member.joined_at || "" }));
      return json({ guildId: DISCORD_GUILD_ID, bots, expected: { terminalroom: DISCORD_APP_ID, concursos: "hermes-discord-concursos", jornalista: "hermes-discord-jornalista" }, note: "A lista mostra os bots instalados; a substituicao de Carlbot, Dyno ou Disboard so deve ocorrer depois de validar cada capacidade e permissao." });
    }
    if (request.method === "POST" && url.pathname === "/admin/ensure-terminalroom-public") {
      const authorization = request.headers.get("Authorization") || "";
      const authorized = env.ADMIN_PANEL_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.ADMIN_PANEL_KEY}`) || env.HERMES_PUBLISH_KEY && await timingSafeStringEqual(authorization, `Bearer ${env.HERMES_PUBLISH_KEY}`);
      if (!authorized) return json({ erro: "Nao autorizado." }, 401);
      const stateObject = await env.GAMES.get("club/bot-state.json");
      const state = stateObject ? await stateObject.json().catch(() => ({})) : {};
      const channelId = state.terminalRoomChannelId || DISCORD_CHANNELS.terminalroom;
      const everyone = await fetch(`https://discord.com/api/v10/channels/${channelId}/permissions/${DISCORD_GUILD_ID}`, { method: "PUT", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: 0, allow: "67584", deny: "2048" }) });
      if (!everyone.ok) return json({ erro: "Nao foi possivel liberar a visibilidade do canal.", detalhe: await everyone.text() }, 502);
      return json({ corrigido: true, canal: channelId, publico: true, podeEnviar: false });
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
      const rewards = await referralRewards(env, access.accountUid || access.firebaseUid || access.discordId);
      const payments = await allPayments(env);
      const identity = access.accountUid ? `account:${access.accountUid}` : access.rawDiscordId || /^\d{10,25}$/.test(String(access.discordId || "")) ? `discord:${access.rawDiscordId || access.discordId}` : "";
      return json({ conectado: true, username: profile?.name || access.username || "", avatar: profile?.avatar || "", plan: access.plan, recognition: applyBadgeGrants(supportRecognition(payments, identity, access.plan), profile?.badgeGrants), manualSaveLimit: manualSaveLimit(access.plan) === null ? null : manualSaveLimit(access.plan) + rewards.bonusManualSlots, automaticGameLimit: automaticGameLimit(access.plan) === null ? null : automaticGameLimit(access.plan) + rewards.bonusAutoGames, automaticGamesUsed: automaticGames.size, referralPoints: rewards.points, referralRewards: rewards, expiresAt: access.exp });
    }
    if (url.pathname === "/account/referrals" && ["GET", "POST"].includes(request.method)) {
      const account = await accountAccess(request, env);
      if (!account) return json({ erro: "Entre na sua conta para compartilhar e acompanhar seus bônus." }, 401);
      const profileObject = await env.GAMES.get(`profiles/v1/${account.uid}.json`);
      if (!profileObject) return json({ erro: "Complete seu perfil primeiro." }, 403);
      const code = await referralCode(env, account.uid);
      const rewardKey = `referrals/rewards/${encodeURIComponent(account.uid)}.json`;
      let rewards = await referralRewards(env, account.uid);
      let earned = [];
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const platform = String(body.platform || "").toLowerCase();
        const platforms = ["whatsapp", "facebook", "instagram", "telegram", "x", "bluesky", "threads", "linkedin", "reddit", "email", "native", "copy"];
        if (!platforms.includes(platform)) return json({ erro: "Rede social inválida." }, 400);
        const limited = await enforceRateLimit(env, account.uid, "referral-share", 20, 24 * 60 * 60 * 1e3);
        if (limited) return limited;
        const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1e3));
        const shareEvents = Object.fromEntries(Object.entries(rewards.shareEvents && typeof rewards.shareEvents === "object" ? rewards.shareEvents : {}).filter(([id]) => id.startsWith(`${week}:`)));
        const eventId = `${week}:${platform}`;
        if (!shareEvents[eventId]) {
          shareEvents[eventId] = Date.now();
          rewards = { ...rewards, shareEvents, shares: rewards.shares + 1, points: rewards.points + 1, updatedAt: Date.now() };
          ({ next: rewards, earned } = applyReferralTiers(rewards));
          await env.GAMES.put(rewardKey, JSON.stringify(rewards), { httpMetadata: { contentType: "application/json" } });
        }
      }
      return json({ code, shareUrl: `${SITE}/?ref=${code}`, rewards, earned, rules: { sharePoints: 1, signupPoints: 10, shareWindowDays: 7 } });
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
      let referrerUid = current?.referrerUid || "";
      if (!current && account.emailVerified && /^[a-f0-9]{12}$/.test(String(body.referralCode || ""))) {
        const codeObject = await env.GAMES.get(`referrals/codes/${body.referralCode}.json`);
        const codeRecord = codeObject ? await codeObject.json().catch(() => null) : null;
        if (codeRecord?.uid && codeRecord.uid !== account.uid && await env.GAMES.head(`profiles/v1/${encodeURIComponent(codeRecord.uid)}.json`)) referrerUid = codeRecord.uid;
      }
      const profile = { uid: account.uid, name, avatar, birthDate, locality, bio, phone, instagram, youtube, facebook, tiktok, provider: account.provider, discordNotifications: Boolean(body.discordNotifications ?? current?.discordNotifications), ...(referrerUid ? { referrerUid } : {}), createdAt: current?.createdAt || Date.now(), updatedAt: Date.now() };
      await env.GAMES.put(key, JSON.stringify(profile), { httpMetadata: { contentType: "application/json" } });
      if (!current) {
        await env.GAMES.put(`hall/registrations/${encodeURIComponent(account.uid)}.json`, JSON.stringify({ uid: account.uid, nome: name, avatar, mensagem: `Bem-vindo(a), ${name}! Um novo jogador entrou na sala.`, timestamp: Date.now() }), { httpMetadata: { contentType: "application/json" } });
        await discordMessage(env, DISCORD_CHANNELS.terminalroom, { content: `🎮 Bem-vindo(a) ao NeoTerminalRoom, **${name}**! Seu perfil foi criado. Jogue, salve seu progresso e traga sugestões para o NeoTerminalSec.` }).catch(() => null);
        if (/^discord-\d{10,25}$/.test(account.uid)) await discordDirectMessage(env, account.uid.slice("discord-".length), `🎮 Bem-vindo(a), ${name}! Seu perfil NeoTerminalRoom está pronto. Ative os lembretes no cadastro quando quiser e nunca compartilhe senhas ou códigos.`).catch(() => false);
        if (referrerUid) {
          const referrerKey = `referrals/rewards/${encodeURIComponent(referrerUid)}.json`;
          const claimKey = `referrals/claims/${encodeURIComponent(account.uid)}.json`;
          if (await env.GAMES.head(claimKey)) return json({ profile, created: true });
          let referrerRewards = await referralRewards(env, referrerUid);
          referrerRewards = { ...referrerRewards, referrals: referrerRewards.referrals + 1, points: referrerRewards.points + 10, updatedAt: Date.now() };
          const result = applyReferralTiers(referrerRewards);
          await Promise.all([env.GAMES.put(referrerKey, JSON.stringify(result.next), { httpMetadata: { contentType: "application/json" } }), env.GAMES.put(claimKey, JSON.stringify({ uid: account.uid, referrerUid, createdAt: Date.now() }), { httpMetadata: { contentType: "application/json" } })]);
        }
      }
      return json({ profile, created: !current });
    }
    if (url.pathname === "/account/notifications" && ["GET", "PUT"].includes(request.method)) {
      const account = await accountAccess(request, env);
      if (!account) return json({ erro: "Login expirado." }, 401);
      const key = `profiles/v1/${account.uid}.json`;
      const object = await env.GAMES.get(key);
      const profile = object ? await object.json().catch(() => null) : null;
      if (!profile) return json({ erro: "Complete seu perfil primeiro." }, 403);
      if (request.method === "GET") return json({ discordNotifications: profile.discordNotifications === true, canReceiveDiscord: /^discord-\d{10,25}$/.test(account.uid) });
      const body = await request.json().catch(() => ({}));
      const enabled = body.discordNotifications === true;
      const next = { ...profile, discordNotifications: enabled, updatedAt: Date.now() };
      await env.GAMES.put(key, JSON.stringify(next), { httpMetadata: { contentType: "application/json" } });
      return json({ discordNotifications: enabled, canReceiveDiscord: /^discord-\d{10,25}$/.test(account.uid) });
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
      const validPlayUrl = /^player-(universal|ps1)\.html\?/.test(playUrl) || /^\/?jogos\/(nes|snes|n64|gba|megadrive|ps1|atari2600)\/[a-z0-9][a-z0-9-]{0,89}\/$/.test(playUrl);
      if (!/^[a-z0-9][a-z0-9._,-]{0,119}$/.test(id) || !name || !/^[a-z0-9-]{2,20}$/.test(system) || !validPlayUrl || cover && !/^(https:\/\/pub-[a-z0-9]+\.r2\.dev\/|systems\/|assets\/)/.test(cover))
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
      const rewards = await referralRewards(env, access.accountUid || access.firebaseUid || access.discordId);
      const automaticLimit = automaticGameLimit(access.plan) === null ? null : automaticGameLimit(access.plan) + rewards.bonusAutoGames;
      const result = Array.from(games.values()).map((game) => ({ ...game, slots: game.slots.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) })).sort((a, b) => String(b.slots[0]?.updatedAt || "").localeCompare(String(a.slots[0]?.updatedAt || "")));
      return json({ games: result, automaticGameLimit: automaticLimit, automaticGamesUsed: result.filter((game) => game.slots.some((slot) => slot.slot === "auto")).length, manualSaveLimit: manualSaveLimit(access.plan) === null ? null : manualSaveLimit(access.plan) + rewards.bonusManualSlots, referralPoints: rewards.points, referralRewards: rewards });
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
      if (target.slot === "previous")
        return json({ erro: "Checkpoint anterior e somente leitura." }, 405);
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
          const rewards = await referralRewards(env, access.accountUid || access.firebaseUid || access.discordId);
          const limit = automaticGameLimit(access.plan) === null ? null : automaticGameLimit(access.plan) + rewards.bonusAutoGames;
          if (limit !== null && automaticGames.size >= limit)
            return json({ erro: "Limite de jogos com autosave atingido.", automaticGameLimit: limit, automaticGamesUsed: automaticGames.size }, 409);
        }
      }
      if (target.slot === "auto") {
        const current = await env.GAMES.get(target.key);
        if (current) {
          await env.GAMES.put(`saves/v1/${access.discordId}/${target.game}/previous.state`, current.body, {
            httpMetadata: { contentType: "application/octet-stream" },
            customMetadata: { ...(current.customMetadata || {}), slot: "previous", name: "Checkpoint anterior" }
          });
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
      const discord = /* @__PURE__ */ __name(async (path, init = {}) => {
        for (let attempt = 0; attempt < 3; attempt++) {
          const response = await fetch(`https://discord.com/api/v10${path}`, { ...init, headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json", ...init.headers || {} } });
          if (response.status !== 429 || attempt === 2)
            return response;
          const limited = await response.clone().json().catch(() => ({}));
          const retryMs = Math.min(15e3, Math.max(1e3, Number(limited.retry_after || 1) * 1e3 + 250));
          await new Promise((resolve) => setTimeout(resolve, retryMs));
        }
      }, "discord");
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
      const roleMap = { member: findRole("Membro"), continue: findRole("Continue"), cartucho: findRole("Cartucho"), arcade: findRole("Arcade") };
      const botRoles = roles.filter((role) => botMember.roles.includes(role.id));
      const channelAccess = { agradecimentos: ["continue", "cartucho", "arcade"], enquetes: ["cartucho", "arcade"], "sugestoes-prioritarias": ["arcade"] };
      const missingRoles = Object.entries(roleMap).filter(([, role]) => !role).map(([name]) => name);
      const missingChannels = Object.keys(channelAccess).filter((name) => !findChannel(name));
      if (missingRoles.length)
        return json({ erro: "Cargos do servidor nao encontrados.", missingRoles }, 409);
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
          const created = await discord(`/guilds/${guildId}/channels`, { method: "POST", body: JSON.stringify({ name, type: 0, parent_id: clubCategory.id }) });
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
        const account = isFree ? null : await accountAccess(request, env);
        if (!plan && !isFree || !amount || amount < 1 || amount > 1e4 || !/^MSG-[0-9]{10,}$/.test(id) || !isFree && (!anonymous && !name) || !isFree && !account?.uid && !discord?.discordId)
          return json({ erro: isFree ? "Informe um valor entre R$ 1 e R$ 10.000." : "Entre na sua conta NeoTerminalRoom antes de apoiar." }, 400);
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.MP_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ title: isFree ? "Apoio livre ao NeoTerminalRoom" : `Clube NeoTerminalRoom - ${plan.title}`, quantity: 1, currency_id: "BRL", unit_price: amount }], external_reference: id, notification_url: WEBHOOK, back_urls: { success: `${SITE}/apoie.html?pagamento=aprovado`, pending: `${SITE}/apoie.html?pagamento=pendente`, failure: `${SITE}/apoie.html?pagamento=falhou` }, auto_return: "approved", metadata: { plan: isFree ? "livre" : planKey } })
        });
        const preference = await mpResponse.json();
        if (!mpResponse.ok || !preference.init_point)
          return json({ erro: "Mercado Pago recusou a preferencia." }, 502);
        const pendingRecord = isFree ? { valor: amount, plano: "livre", status: "pendente", timestamp: Date.now(), exibirMural: false } : { nome: name, mensagem: message, valor: amount, plano: planKey, status: "pendente", timestamp: Date.now(), ...(account?.uid ? { accountUid:account.uid } : {}), ...(discord?.discordId ? { discordId:discord.discordId, discordUsuario:discord.username } : {}), exibirMural: body.exibirMural !== false, exibirValor: body.exibirValor !== false };
        await putPayment(env, id, pendingRecord);
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
        const record = await getPayment(env, id);
        if (!record || Math.abs(Number(record.valor) - amount) > 1e-3)
          return json({ erro: "Valor do pagamento divergente." }, 409);
        if (record.plano === "livre") {
          await patchPayment(env, id, { status: "doacao_aprovada", aprovadoEm: Date.now() });
          return json({ recebido: true });
        }
        if (!Object.values(PLANS).some((p) => p.amount === amount))
          return json({ erro: "Valor de plano invalido." }, 409);
        if (!record?.plano || !DISCORD_ROLES[record.plano] || !record.accountUid && !record.discordId)
          return json({ erro: "Apoio sem vinculacao a uma conta." }, 409);
        const approvedAt = Date.now();
        let discordStatus = record.discordId ? "falha_ao_liberar" : "nao_conectado";
        if (record.discordId) {
          for (const roleId of Object.values(DISCORD_ROLES)) if (roleId !== DISCORD_ROLES[record.plano]) await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${record.discordId}/roles/${roleId}`, { method: "DELETE", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          const roleResponse = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${record.discordId}/roles/${DISCORD_ROLES[record.plano]}`, { method: "PUT", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
          discordStatus = roleResponse.ok ? "cargo_liberado" : "falha_ao_liberar";
          if (roleResponse.ok) await discordMessage(env, DISCORD_CHANNELS.agradecimentos, { content: `\u{1F3AE} Obrigado, <@${record.discordId}>! Seu apoio **${record.plano === "cafe" ? "Apoiador" : record.plano === "cartucho" ? "Guardião" : "Patrono"}** foi confirmado. O cargo e os benef\xEDcios est\xE3o ativos por 30 dias.` });
        }
        await patchPayment(env, id, { status: "aprovado", valor: amount, aprovadoEm: approvedAt, validoAte: approvedAt + 30 * 24 * 60 * 60 * 1e3, discordStatus });
        return json({ recebido: true });
      } catch {
        return json({ erro: "Webhook invalido." }, 400);
      }
    }
    return json({ erro: "Nao encontrado." }, 404);
  },
  async scheduled(_event, env) {
    const records = await allPayments(env);
    for (const [id, record] of Object.entries(records || {})) {
      if (record.status !== "aprovado" || !record.validoAte || record.validoAte > Date.now() || !record.discordId || !record.plano)
        continue;
      await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${record.discordId}/roles/${DISCORD_ROLES[record.plano]}`, { method: "DELETE", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` } });
      await patchPayment(env, id, { status: "expirado", discordStatus: "cargo_removido" });
    }
    const now = /* @__PURE__ */ new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const stateObject = await env.GAMES.get("club/bot-state.json");
    const state = stateObject ? await stateObject.json().catch(() => ({})) : {};
    const saoPauloParts = (timestamp) => Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(timestamp).map((part) => [part.type, part.value]));
    const today = saoPauloParts(Date.now());
    const firstSupportByUid = new Map();
    for (const record of Object.values(records || {})) {
      const uid = String(record?.accountUid || "");
      const approvedAt = Number(record?.aprovadoEm || 0);
      if (!uid || !approvedAt || !["aprovado", "expirado"].includes(record?.status)) continue;
      const current = firstSupportByUid.get(uid);
      if (!current || approvedAt < current.approvedAt) firstSupportByUid.set(uid, { approvedAt, discordId: String(record.discordId || "") });
    }
    for (const [uid, support] of firstSupportByUid) {
      const started = saoPauloParts(support.approvedAt);
      const years = Number(today.year) - Number(started.year);
      if (years < 1 || today.month !== started.month || today.day !== started.day) continue;
      const anniversaryKey = `support/anniversaries/${encodeURIComponent(uid)}/${today.year}.json`;
      if (await env.GAMES.head(anniversaryKey)) continue;
      const profileObject = await env.GAMES.get(`profiles/v1/${encodeURIComponent(uid)}.json`);
      const profile = profileObject ? await profileObject.json().catch(() => ({})) : {};
      const name = cleanProfileText(profile.name, 20) || "Jogador";
      const message = `${name}, hoje seu apoio ao NeoTerminalRoom completa ${years} ${years === 1 ? "ano" : "anos"}. Obrigado por ajudar a preservar essa história conosco.`;
      await env.SOCIAL_PLAYERS.getByName(uid).fetch(new Request("https://social/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "support-anniversary", fromUid: "neo-club", fromName: "Clube NeoTerminalRoom", fromAvatar: "avatar-01", preview: message, years }) }));
      if (/^\d{10,25}$/.test(support.discordId)) await discordDirectMessage(env, support.discordId, `🎂 ${message} ${SITE}/apoie.html`).catch(() => false);
      await env.GAMES.put(anniversaryKey, JSON.stringify({ uid, years, sentAt: Date.now() }), { httpMetadata: { contentType: "application/json" } });
    }
    if (now.getUTCDay() === 1 && state.ultimaEnquete !== dayKey) {
      const start = Date.UTC(now.getUTCFullYear(), 0, 1);
      const week = Math.floor((now.getTime() - start) / 6048e5);
      const topic = WEEKLY_POLLS[week % WEEKLY_POLLS.length];
      const poll = await discordMessage(env, DISCORD_CHANNELS.enquetes, { content: `<@&${DISCORD_ROLES.cartucho}> <@&${DISCORD_ROLES.arcade}> \u2014 enquete semanal do Clube:`, poll: { question: { text: topic.question }, answers: topic.answers.map((text) => ({ poll_media: { text } })), duration: 168, allow_multiselect: false } });
      if (poll.ok) {
        state.ultimaEnquete = dayKey;
        await env.GAMES.put("club/bot-state.json", JSON.stringify(state), { httpMetadata: { contentType: "application/json" } });
      }
    }
    // Aviso semanal automático no canal público reservado ao TerminalRoom.
    // O índice gira as mensagens para não repetir sempre o mesmo texto.
    // Reaplica diariamente a visibilidade pÃºblica para evitar bloqueios herdados de categoria/cargo.
    const publicChannel = state.terminalRoomChannelId || DISCORD_CHANNELS.terminalroom;
    await fetch(`https://discord.com/api/v10/channels/${publicChannel}/permissions/${DISCORD_GUILD_ID}`, { method: "PUT", headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: 0, allow: "67584", deny: "2048" }) }).catch(() => null);
    if (now.getUTCDay() === 4) {
      const digestKey = `terminalroom-${now.getUTCFullYear()}-${Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 6048e5)}`;
      if (state.ultimoTerminalRoomDigest !== digestKey) {
        const index = Number(state.terminalRoomDigestIndex || 0) % TERMINALROOM_DIGESTS.length;
        const content = `${TERMINALROOM_DIGESTS[index]}\n\n🌐 Site: ${SITE}\n☁️ Saves e planos: ${SITE}/apoie.html#planos\n💬 Comunidade: programação, IA, segurança e hacktivismo no NeoTerminalSec.`;
        const [profileRecords, offerRecords] = await Promise.all([readJsonDirectory(env, "profiles/v1/", 1e3), readJsonDirectory(env, "affiliate/products/", 500)]);
        const activeOffers = offerRecords.filter((item) => isCompleteAffiliateProduct(item.value)).length;
        const contentWithStats = `${content}\n📊 ${profileRecords.length} perfis e ${activeOffers} achados ativos no catálogo.`;
        const sent = await discordMessage(env, state.terminalRoomChannelId || DISCORD_CHANNELS.terminalroom, { content: contentWithStats }).catch(() => null);
        if (sent?.ok) {
          state.ultimoTerminalRoomDigest = digestKey;
          state.terminalRoomDigestIndex = (index + 1) % TERMINALROOM_DIGESTS.length;
          await env.GAMES.put("club/bot-state.json", JSON.stringify(state), { httpMetadata: { contentType: "application/json" } });
        }
      }
    }
    if (now.getUTCDay() === 4 && state.ultimoTerminalRoomReminder !== dayKey) {
      const profiles = await readJsonDirectory(env, "profiles/v1/", 500);
      const optedIn = profiles.filter((record) => record.value?.discordNotifications === true && /^discord-\d{10,25}$/.test(String(record.value?.uid || ""))).slice(0, 25);
      for (const record of optedIn) {
        const discordId = String(record.value.uid).slice("discord-".length);
        const historyObject = await env.GAMES.get(`history/v1/${encodeURIComponent(record.value.uid)}.json`);
        const history = historyObject ? await historyObject.json().catch(() => []) : [];
        const recent = Array.isArray(history) ? history[0] : null;
        const target = recent?.name ? `continue **${String(recent.name).slice(0, 80)}**` : "continue sua partida";
        await discordDirectMessage(env, discordId, `🎮 ${record.value.name || "Jogador"}, seu lembrete semanal do NeoTerminalRoom: ${target} e proteja seu progresso com um save. ${SITE}`).catch(() => false);
      }
      state.ultimoTerminalRoomReminder = dayKey;
      await env.GAMES.put("club/bot-state.json", JSON.stringify(state), { httpMetadata: { contentType: "application/json" } });
    }
    await runAffiliateBot(env);
  }
};
export {
  MultiplayerRoom,
  SocialPlayer,
  src_default as default
};
//# sourceMappingURL=index.js.map
