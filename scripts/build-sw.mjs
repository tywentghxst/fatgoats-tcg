import { readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const assets = (await readdir("dist/assets")).map((f) => "/assets/" + f);
const thumbs = (await readdir("dist/cards_thumb")).map(
  (f) => "/cards_thumb/" + encodeURIComponent(f),
);
const files = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/clash-icon.svg",
  ...assets,
  ...thumbs,
];
const version = createHash("sha256")
  .update(JSON.stringify(assets))
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "dist/sw.js",
  `const CACHE='clash-${version}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('clash-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});`,
);
