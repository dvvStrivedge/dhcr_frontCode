//scripts for firebase messaging and notifications
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

const firebaseConfig = {
  apiKey: 'AIzaSyDOJyfibmwuwzna09oIW1hZQRMNWYJAKaQ',
  authDomain: 'dhcr-e616f.firebaseapp.com',
  projectId: 'dhcr-e616f',
  storageBucket: 'dhcr-e616f.appspot.com',
  messagingSenderId: '912958375395',
  appId: '1:912958375395:web:e551178497f5a5c36accd6',
  measurementId: 'G-DVZC91KNWJ',
};

const firebaseapp = initializeApp(firebaseConfig);

const messaging = getMessaging(firebaseapp);

messaging.onBackgroundMessage(messaging, (payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('public/firebase-messaging-sw.js')
    .then(function (registration) {
      console.log('Registration successful, scope is:', registration.scope);
    })
    .catch(function (err) {
      console.log('Service worker registration failed, error:', err);
    });
}
