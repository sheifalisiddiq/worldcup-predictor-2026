const CACHE = 'wc26-v16';
const PRECACHE = ['/', '/data.js', '/firebase-config.js',
  '/dist/vendor/react.production.min.js', '/dist/vendor/react-dom.production.min.js',
  '/dist/vendor/firebase-app-compat.js', '/dist/vendor/firebase-auth-compat.js', '/dist/vendor/firebase-database-compat.js',
  '/dist/rings.js', '/dist/components.js', '/dist/screens.js', '/dist/screens2.js', '/dist/app.js', '/icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
});

// Page asks a waiting SW to take over immediately (used by the update flow).
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only ever handle our OWN origin. Cross-origin requests (React/Babel on
  // unpkg, Firebase on gstatic, Google Fonts, flagcdn) must go straight to the
  // network untouched — re-fetching them inside the SW failed with
  // net::ERR_FAILED and blanked the app on every second load.
  if (url.origin !== self.location.origin) return;

  // Don't cache API calls.
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for same-origin assets, cache fallback when offline.
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
