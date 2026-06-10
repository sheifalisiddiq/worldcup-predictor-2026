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
})();
