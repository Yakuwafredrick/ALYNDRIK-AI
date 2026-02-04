
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC9fz6MDck-iOESkD5d6rX_aOqz3ESRQeY",
  authDomain: "alyndrik-bee9c.firebaseapp.com",
  projectId: "alyndrik-bee9c",
  storageBucket: "alyndrik-bee9c.firebasestorage.app",
  messagingSenderId: "1065720251519",
  appId: "1:1065720251519:web:1afa7497d3853920e42b4a",
  measurementId: "G-HZN0QY9QSJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
