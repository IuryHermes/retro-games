import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const [home, host, room, player, header, social, offers, club, collections, diagnostics, flow, protocol, analytics] = await Promise.all([
  read('index.html'), read('multiplayer-v2.js'), read('multiplayer-room.html'), read('player-universal.html'), read('standalone-header.js'),
  read('social.html'), read('ofertas.html'), read('apoie.html'), read('coletaneas.html'), read('multiplayer-diagnostics.html'),
  read('docs/navigation/FLUXO-NAVEGACAO.md'), read('docs/TESTE-REAL-MULTIPLAYER.md'), read('analytics-consent.js')
]);

for (const event of ['multiplayer_hub_open','multiplayer_auth_required']) assert.match(home, new RegExp(`neoTrack\\?\\.\\('${event}'`));
assert.match(host, /neoTrack\?\.\('multiplayer_room_created'/);
assert.match(room, /neoTrack\?\.\('multiplayer_joined'/);
assert.match(analytics, /NeoPrivacy\?\.has\?\.\('analytics'\)/);
assert.doesNotMatch(host + room + home, /neoTrack[^\n]*(?:email|token|roomId|uid)/i);
assert.match(player, /privacy-consent-v2\.js[\s\S]*analytics-consent\.js[\s\S]*multiplayer-v2\.js/);

for (const [name, html] of Object.entries({social,offers,club,collections})) {
  assert.match(html, /<neo-site-header section=/, `${name} sem cabeçalho compartilhado`);
  assert.match(html, /standalone-header\.js/, `${name} não carrega o componente`);
}
for (const label of ['Biblioteca','Coletâneas','Comunidade','Achados','Clube','Jogar online','Entrar']) assert.match(header, new RegExp(label));

assert.match(diagnostics, /RTCPeerConnection/);
assert.match(diagnostics, /HTMLCanvasElement\.prototype\.captureStream/);
assert.match(diagnostics, /iPhone\/Safari/);
assert.match(protocol, /Periodicidade recomendada: mensal/);
assert.match(flow, /Atualizado em: 2026-09-01/);
assert.match(flow, /tests\/navigation-contract\.mjs/);
assert.doesNotMatch(home, /multiplayer-diagnostics\.html/, 'o diagnóstico técnico não deve aparecer na navegação pública');
assert.match(host, /multiplayer_session_feedback/);
assert.match(host, /neo_multiplayer_feedback_last_at/);

console.log('contrato de navegação: GA4, cabeçalho compartilhado, diagnóstico e fluxograma validados');
