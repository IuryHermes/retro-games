import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(index, /catalogMatchesSave\(item, game\)/);
assert.match(index, /segamd:'megadrive'/);
assert.match(index, /\(\?:segamd\|megadrive/);
assert.match(index, /item\.id === game\.id \|\| item\.id === catalogId/);

console.log('save library covers: 4 checks passed');
