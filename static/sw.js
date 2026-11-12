// Offline support: cache the whole game so it runs with no connection once
// installed. Bump VERSION whenever game files change.
const VERSION = 'wildbound-v3';
const FILES = [
  '/', '/static/style.css', '/manifest.webmanifest',
  '/static/fonts/pixelify-sans-latin-400-normal.woff2', '/static/fonts/pixelify-sans-latin-600-normal.woff2',
  '/static/icons/icon-192.png', '/static/icons/icon-512.png', '/static/icons/apple-touch-icon.png',
  ...['main', 'engine', 'ui', 'audio', 'state', 'data', 'mon', 'species', 'art', 'maps', 'world', 'battle', 'screens', 'story'].map((f) => `/static/js/${f}.js`),
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network first (so updates arrive), falling back to the cache when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('/')))
  );
});
