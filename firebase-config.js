/* Firebase configuration */
(function () {
  var firebaseConfig = {
    apiKey:            "AIzaSyC-nqvD5ekYhIErjH6bzWUzWJXKjHEeLvA",
    authDomain:        "wc26-predictor-3558c.firebaseapp.com",
    databaseURL:       "https://wc26-predictor-3558c-default-rtdb.firebaseio.com",
    projectId:         "wc26-predictor-3558c",
    storageBucket:     "wc26-predictor-3558c.firebasestorage.app",
    messagingSenderId: "740708508544",
    appId:             "1:740708508544:web:6818088df26c26ea91d765",
  };
  firebase.initializeApp(firebaseConfig);
  window.fbAuth     = firebase.auth();
  window.fbDb       = firebase.database();
  window.fbProvider = new firebase.auth.GoogleAuthProvider();

  // Public Web Push (VAPID) key from Firebase Console → Cloud Messaging → Web
  // Push certificates. Public, not a secret. Until the owner pastes the real
  // key here, "Enable reminders" stays disabled (the feature is dormant).
  window.WC_VAPID = '';

  // Cloud Messaging is optional and only supported in some browsers (and only in
  // an installed PWA on iOS). Guard so a missing/old SDK never breaks startup.
  window.fbMessaging = null;
  try {
    if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) {
      window.fbMessaging = firebase.messaging();
    }
  } catch (e) { /* messaging unavailable — reminders just won't be offered */ }
})();
