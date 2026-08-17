/* Lightweight Discord Gateway monitor for the live-arcade channel.
 * Run with: DISCORD_BOT_TOKEN=... WORKER_URL=... MONITOR_SECRET=... node discord-live-monitor.mjs
 */
const token = process.env.DISCORD_BOT_TOKEN;
const worker = (process.env.WORKER_URL || "https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev").replace(/\/$/, "");
const secret = process.env.MONITOR_SECRET;
const liveChannel = process.env.DISCORD_LIVE_CHANNEL_ID || "1537280728922849332";
if (!token || !secret) throw new Error("DISCORD_BOT_TOKEN e MONITOR_SECRET sao obrigatorios.");
let socket;
let heartbeat;
let sequence = null;
let reconnectTimer;
const intents = 1 | (1 << 7); // GUILDS + GUILD_VOICE_STATES
async function report(payload) {
  const response = await fetch(`${worker}/internal/discord-live`, { method: "POST", headers: { "Content-Type": "application/json", "X-Monitor-Secret": secret }, body: JSON.stringify(payload) });
  if (!response.ok) console.error("Worker live report:", response.status, await response.text());
}
function connect(url = "wss://gateway.discord.gg/?v=10&encoding=json") {
  socket = new WebSocket(url);
  socket.addEventListener("open", () => console.log("Discord Gateway conectado"));
  socket.addEventListener("message", async (event) => {
    const packet = JSON.parse(String(event.data));
    if (packet.s !== null && packet.s !== undefined) sequence = packet.s;
    if (packet.op === 10) {
      clearInterval(heartbeat);
      heartbeat = setInterval(() => socket?.send(JSON.stringify({ op: 1, d: sequence })), packet.d.heartbeat_interval);
      socket.send(JSON.stringify({ op: 2, d: { token, intents, properties: { os: "linux", browser: "neo-live-monitor", device: "neo-live-monitor" } } }));
    } else if (packet.op === 1) socket.send(JSON.stringify({ op: 1, d: sequence }));
    else if (packet.op === 7 || packet.op === 9) reconnect();
    else if (packet.op === 0 && packet.t === "VOICE_STATE_UPDATE") {
      const state = packet.d;
      await report({ discordId: state.user_id, channelId: state.channel_id || "", streaming: Boolean(state.self_stream), updatedAt: Date.now() });
    }
  });
  socket.addEventListener("close", reconnect);
  socket.addEventListener("error", () => socket?.close());
}
function reconnect() {
  clearInterval(heartbeat);
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(), 5000);
}
connect();
