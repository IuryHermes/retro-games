import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const social = await readFile(new URL('../social.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../social.js', import.meta.url), 'utf8');

assert.doesNotMatch(index, /id="chat-container"/);
assert.match(index, /href="social\.html#global-chat"/);
assert.match(social, /id="global-chat"/);
assert.match(social, /id="global-messages"/);
assert.match(script, /ref\(getDatabase\(app\), 'mensagens'\)/);
assert.match(script, /onChildAdded\(query\(globalChat, limitToLast\(100\)\)/);
assert.match(script, /await push\(globalChat/);

console.log('global chat community: 7 checks passed');
