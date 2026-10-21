/* MP-1 offline shell. The page registers sw.js?v=<app version>: a new
   version installs a new worker with a new cache and the old one is
   dropped, so updates arrive silently on the next launch. Songs live in
   IndexedDB and never pass through here. */
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `mp1-shell-${VERSION}`;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('mp1-shell-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// only the app's own files are handled: cache first, refreshed in the
// background (stale-while-revalidate). Everything else goes to the network.
const shellPaths = () => new Set(SHELL.map(u => new URL(u, self.registration.scope).pathname));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !shellPaths().has(url.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit || Response.error());
    return hit || net;
  }));
});
