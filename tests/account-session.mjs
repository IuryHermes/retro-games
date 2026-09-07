import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const home = await readFile(new URL('../index.html',import.meta.url),'utf8');
const script = await readFile(new URL('../account-session-ui.js',import.meta.url),'utf8');
const token = uid => `header.${Buffer.from(JSON.stringify({sub:uid})).toString('base64url')}.signature`;
function fixture(entries = []) {
  const storage = new Map(entries);
  const buttons = Array.from({length:2},()=>({elements:new Map(['.account-name','.account-avatar','.account-hint'].map(k=>[k,{}])),querySelector(k){return this.elements.get(k);},setAttribute(k,v){this[k]=v;}}));
  const sandbox = {window:{},document:{querySelectorAll:()=>buttons},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{hash:''},URLSearchParams,atob,Date};
  vm.runInNewContext(script,sandbox);
  return {ui:sandbox.window.NeoAccountSessionUI,storage,buttons};
}
const profile={uid:'player-a',name:'Jogador A',avatar:'avatar-02',email:'private@example.com',birthDate:'1990-01-01'};
const first=fixture();
assert.equal(first.ui.phase,'restoring');
first.ui.show(profile);
const saved=JSON.parse(first.storage.get('neo_account_preview_v1'));
assert.deepEqual(Object.keys(saved).sort(),['avatar','name','savedAt','uid']);
first.storage.set('neo_account_access',token('player-a'));
const returned=fixture([...first.storage]);
assert.equal(returned.ui.phase,'restoring');
assert.ok(returned.buttons.every(b=>b.querySelector('.account-name').textContent==='Jogador A' && b.disabled));
returned.ui.unavailable();
assert.ok(returned.buttons.every(b=>b.querySelector('.account-name').textContent==='Jogador A' && !b.disabled));
returned.ui.restore('player-b');
assert.ok(returned.buttons.every(b=>b.querySelector('.account-name').textContent!=='Jogador A'));
returned.ui.show(profile); returned.ui.clear();
assert.equal(returned.storage.has('neo_account_preview_v1'),false);
assert.ok(returned.buttons.every(b=>b.querySelector('.account-name').textContent==='LOGIN / CADASTRO'));
const switched=fixture([...first.storage].map(([k,v])=>[k,k==='neo_account_access'?token('player-b'):v]));
assert.equal(switched.storage.has('neo_account_preview_v1'),false);
const broken=fixture([['neo_account_preview_v1','{bad json']]);assert.equal(broken.ui.phase,'restoring');
const requestSource=home.slice(home.indexOf('    async function profileRequest('),home.indexOf('    let localMigrationRunning'));
async function requestScenario(statuses) {
  const refreshes=[],requests=[];
  const sandbox={auth:{currentUser:{getIdToken:async force=>{refreshes.push(force);return 'fixture-token';}}},discordAccountToken:'',sessionStorage:{setItem(){}},ACCOUNT_API:'https://example.com',AbortSignal,fetch:async(...args)=>{requests.push(args);return new Response(JSON.stringify(statuses[0]===200?{profile}:{erro:'failed'}),{status:statuses.shift()});}};
  vm.runInNewContext(requestSource,sandbox);
  let error;try{await sandbox.profileRequest('GET');}catch(e){error=e;}
  return {refreshes,requests,error};
}
assert.deepEqual((await requestScenario([200])).refreshes,[false]);
assert.deepEqual((await requestScenario([401,200])).refreshes,[false,true]);
const outage=await requestScenario([500]);assert.equal(outage.error.status,500);assert.deepEqual(outage.refreshes,[false]);
assert.equal((await requestScenario([404])).error.status,404);
assert.equal((await requestScenario([401,401])).error.status,401);
const restoreSource=home.slice(home.indexOf('    let accountSessionRevision = 0;'),home.indexOf('    onAuthStateChanged(auth, user =>'));
function restoreFixture(fetchProfile) {
 const f=fixture([...first.storage]);
 const elements=new Map();let opened=0;
 const sandbox={accountSessionUI:f.ui,discordAccountToken:'',accountProfile:null,document:{getElementById:id=>{if(!elements.has(id))elements.set(id,{style:{}});return elements.get(id);}},sessionStorage:{getItem:()=>'',removeItem(){}},profileRequest:fetchProfile,applyProfile:()=>sandbox.accountProfile?f.ui.show(sandbox.accountProfile):f.ui.clear(true),migrateLocalProgressToProfile:async()=>{},openAuth:()=>opened++,closeAuth(){},startSocialPresence(){},refreshPersonalHero(){},resumeMultiplayerAfterAuth(){},setAuthStatus(){},location:{}};
 vm.createContext(sandbox);vm.runInContext(restoreSource,sandbox);
 return {sandbox,f,opened:()=>opened};
}
let resolveProfile;
const delayed=restoreFixture(()=>new Promise(resolve=>{resolveProfile=resolve;}));
const restoration=delayed.sandbox.restoreAccountSession({uid:'player-a'});
assert.equal(delayed.f.buttons[0].querySelector('.account-name').textContent,'Jogador A');
resolveProfile({profile:{...profile,birthDate:'1990-01-01',locality:'Brasil'}});await restoration;
assert.equal(delayed.f.ui.phase,'ready');assert.equal(delayed.opened(),0);
const network=restoreFixture(async()=>{throw Object.assign(new Error('temporary'),{status:500});});await network.sandbox.restoreAccountSession({uid:'player-a'});
assert.equal(network.f.ui.phase,'error');assert.equal(network.opened(),0);
const missing=restoreFixture(async()=>{throw Object.assign(new Error('missing'),{status:404});});await missing.sandbox.restoreAccountSession({uid:'player-a'});
assert.equal(missing.opened(),1);assert.equal(missing.f.ui.phase,'incomplete');
const expired=restoreFixture(async()=>{throw Object.assign(new Error('expired'),{status:401});});await expired.sandbox.restoreAccountSession({uid:'player-a'});
assert.equal(expired.f.ui.phase,'guest');assert.equal(expired.f.storage.has('neo_account_preview_v1'),false);
assert.ok(home.indexOf('src="account-session-ui.js') < home.indexOf('<script type="module">'));
for(const match of home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 if(/\bsrc\s*=|application\/ld\+json/.test(match[1]))continue;
 new vm.Script(match[2].replace(/^\s*import .+?;\s*$/gm,''));
}
console.log('Account restoration: immediate preview, account isolation, logout, token reuse, 401 refresh, delayed profile, network failure and missing profile passed.');
let resolveStale;
const stale=restoreFixture(()=>new Promise(resolve=>{resolveStale=resolve;}));
const old=stale.sandbox.restoreAccountSession({uid:'player-a'});
await stale.sandbox.restoreAccountSession(null);
resolveStale({profile});await old;
assert.equal(stale.f.ui.phase,'guest');assert.equal(stale.sandbox.accountProfile,null);
console.log('Late profile responses cannot restore an account after logout.');
