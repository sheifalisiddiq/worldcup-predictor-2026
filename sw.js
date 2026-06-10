const CACHE = 'wc26-v3';
const PRECACHE = ['/', '/data.js', '/rings.jsx', '/components.jsx', '/screens.jsx', '/screens2.jsx', '/app.jsx', '/icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept Firebase or API calls — let the browser handle them.
  if (url.includes('firebase') || url.includes('/api/') || url.includes('football-data')) {
    return;
  }
  // Network-first: always try the live version, fall back to cache when offline.
  // This guarantees new deploys reach users instead of being pinned to a stale
  // cached build (the bug that left old clients on a blank, pre-CSP-fix page).
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
