import assert from 'node:assert/strict';
import { SocialPlayer } from '../worker/src/index.js';

const values = new Map();
const ctx = { storage:{ async get(key){ return values.get(key); }, async put(key,value){ values.set(key,value); } } };
const social = new SocialPlayer(ctx, {});
let response = await social.fetch(new Request('https://social/event', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'invite', fromName:'Jogador', roomId:'abcdef123456' }) }));
assert.equal(response.status, 200);
response = await social.fetch(new Request('https://social/events?since=0'));
const events = await response.json();
assert.equal(events.events.length, 1);
assert.equal(events.events[0].type, 'invite');

response = await social.fetch(new Request('https://social/message', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:'m1', withUid:'player-2', fromName:'Jogador', text:'Vamos jogar?', createdAt:Date.now() }) }));
assert.equal(response.status, 200);
response = await social.fetch(new Request('https://social/messages?with=player-2'));
const messages = await response.json();
assert.equal(messages.messages.length, 1);
assert.equal(messages.messages[0].text, 'Vamos jogar?');
console.log('social player: 7 checks passed');
