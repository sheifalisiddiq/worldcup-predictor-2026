/* FCM background handler. Registered by the Firebase Messaging SDK at its own
   narrow scope, so it coexists with the app's caching SW (sw.js at "/").
   Self-hosted compat SDK (v9.23.0), same origin — no third-party fetch at boot.

   The server (api/remind.js) sends DATA-ONLY messages so this handler always
   fires and we render the notification ourselves (one notification, with a
   deep link). */
importScripts('/dist/vendor/firebase-app-compat.js');
importScripts('/dist/vendor/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyC-nqvD5ekYhIErjH6bzWUzWJXKjHEeLvA',
  authDomain:        'wc26-predictor-3558c.firebaseapp.com',
  projectId:         'wc26-predictor-3558c',
  messagingSenderId: '740708508544',
  appId:             '1:740708508544:web:6818088df26c26ea91d765',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const d = (payload && payload.data) || {};
  self.registration.showNotification(d.title || '⚽ WC26 Predictor', {
    body:  d.body || 'Predict before kickoff!',
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    tag:   d.match ? 'wc26-match-' + d.match : 'wc26',
    data:  { match: d.match || '' },
  });
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const match = event.notification.data && event.notification.data.match;
  const url = match ? '/?match=' + match : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (wins) {
      for (const w of wins) {
        if ('focus' in w) {
          w.focus();
          if (match && w.navigate) { try { w.navigate(url); } catch (e) {} }
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
