import { readdir } from 'node:fs/promises';

const base = 'https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/systems/gba';
const groups = [
  ['capas', '.gba-media-staging/capas', '.png', 'image/png'],
  ['previews', '.gba-media-staging/previews', '.gif', 'image/gif'],
];
const failures = [];
let checked = 0;
for (const [remoteDirectory, localDirectory, extension, expectedType] of groups) {
  const names = (await readdir(localDirectory)).filter(name => name.endsWith(extension));
  await Promise.all(names.map(async name => {
    const url = `${base}/${remoteDirectory}/${encodeURIComponent(name)}`;
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const length = Number(response.headers.get('content-length') || 0);
    const type = response.headers.get('content-type') || '';
    if (!response.ok || length < 1000 || !type.startsWith(expectedType)) failures.push({ name, status: response.status, length, type });
    checked++;
  }));
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log(`R2 GBA media: ${checked} public objects verified.`);
