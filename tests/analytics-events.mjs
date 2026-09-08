import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../analytics-consent.js',import.meta.url),'utf8');
function setup(initial,readyState='complete'){
 let consent=initial;const listeners={},scripts=[];
 const window={NeoPrivacy:{has:()=>consent},addEventListener:(name,fn)=>listeners[name]=fn};
 const document={readyState,head:{appendChild:s=>scripts.push(s)},createElement:()=>({}),addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{window,document});
 return {window,scripts,events:()=>Array.from(window.dataLayer||[]).filter(a=>a[0]==='event').map(a=>a[1]),grant(value){consent=value;listeners['neo:consent-changed']({detail:{analytics:value}});},ready(){listeners.DOMContentLoaded?.();}};
}
const existing=setup(true);
existing.window.neoTrack('game_start',{game_system:'snes'});
existing.window.neoTrack('multiplayer_joined');
assert.deepEqual(existing.events(),['game_start','multiplayer_joined']);
assert.equal(existing.scripts.length,1);
const late=setup(false);
late.window.neoTrack('before_consent');assert.equal(late.scripts.length,0);
late.grant(true);late.window.neoTrack('first');late.window.neoTrack('second');
assert.deepEqual(late.events(),['first','second']);
late.grant(false);late.window.neoTrack('revoked');
assert.deepEqual(late.events(),['first','second']);
late.grant(true);late.window.neoTrack('resumed');
assert.deepEqual(late.events(),['first','second','resumed']);assert.equal(late.scripts.length,1);
const loading=setup(true,'loading');loading.window.neoTrack('early');loading.ready();loading.window.neoTrack('later');
assert.deepEqual(loading.events(),['early','later']);assert.equal(loading.scripts.length,1);
console.log('Analytics events: existing/late consent, consecutive events, no replay before consent, custom-event revocation, regrant and early events passed.');
