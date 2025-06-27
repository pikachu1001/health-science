// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAgH3uDdLf2bowG3hYjXfHLW_tHYsJjPLE",
  authDomain: "supportor-belt.firebaseapp.com",
  projectId: "supportor-belt",
  storageBucket: "supportor-belt.firebasestorage.app",
  messagingSenderId: "103170289237",
  appId: "1:103170289237:web:3894277cf891c2a27a2edc",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || '通知';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon-192x192.png',
  };  
  self.registration.showNotification(notificationTitle, notificationOptions);
}); 