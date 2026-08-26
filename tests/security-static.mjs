import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  "index.html",
  "apoie.html",
  "player-ps1.html",
  "player-universal.html",
  "multiplayer-room.html",
  "social.html",
];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(html, /http-equiv=["']Content-Security-Policy/i, `${page}: CSP meta`);
  assert.match(html, /object-src\s+'none'/i, `${page}: object-src restriction`);
  assert.match(html, /name=["']referrer["']/i, `${page}: referrer policy`);
}

const worker = fs.readFileSync(path.join(root, "worker", "src", "index.js"), "utf8");
assert.match(worker, /timingSafeStringEqual/, "constant-time token comparison");
assert.match(worker, /enforceRateLimit/, "endpoint rate limiting");
assert.match(worker, /X-Content-Type-Options/, "security response headers");
assert.match(worker, /X-Frame-Options/, "clickjacking protection");
assert.doesNotMatch(worker, /bdb7a0bac8313c7f0539070ad322fff5|ec498c826635c9b5e3e59175b37a1cfb0e3d1f09346bd86cf42d4754f5be1a3e/, "private credentials are not committed");

console.log(`static security: ${pages.length} pages and worker checks passed`);
