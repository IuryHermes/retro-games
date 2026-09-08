import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../ops/admin-console/server.mjs', import.meta.url), 'utf8');
const calls = [];
const context = vm.createContext({ URL, execFile: async (...args) => { calls.push(args); return {stdout:'active'}; }, readFile:async()=> 'RADIO_URL=https://youtu.be/old\n', writeFile:async(...args)=>calls.push(['write',...args]), join:(...parts)=>parts.join('/'), gatewayEnv:'/test/gateway.env', journalistDir:'/test/journalist', proxyAdmin:async()=>({status:200,data:{ok:true}}) });
vm.runInContext(source.slice(source.indexOf('async function serviceState'), source.indexOf('function send(')), context);
for (const target of ['gateway','journalista','concursos']) {
  for (const command of ['start','stop','restart']) {
    calls.length=0;
    await context.botAction(`${target}-${command}`);
    assert.equal(calls[0][0],'systemctl');
    assert.equal(calls[0][1][1],command);
  }
}
await assert.rejects(context.botAction('gateway-delete'));
for (const url of ['https://youtube.com.evil.test/watch','https://evilyoutu.be/watch','http://youtube.com/watch']) {
  calls.length=0;
  await assert.rejects(context.botAction('radio-restart',url));
  assert.equal(calls.length,0);
}
for (const url of ['https://youtube.com/watch?v=test','https://www.youtube.com/watch?v=test','https://youtu.be/test']) {
  calls.length=0;
  await context.botAction('radio-restart',url);
  assert.equal(calls[0][0],'write');
  assert.equal(calls[1][0],'systemctl');
}
calls.length=0;
await context.restoreBotServices();
assert.equal(calls[0][0],'curl');
assert.ok(!calls.some(call=>call[0]==='sudo'));
assert.ok(calls.some(call=>call[0]==='systemctl' && call[1][1]==='restart'));
console.log('Admin bots: service controls, invalid actions, radio host validation and unprivileged recovery passed.');
