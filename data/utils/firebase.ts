// import firebase from 'firebase/app';
// import { messaging } from 'firebase/messaging/dist/index.cjs.js';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyDOJyfibmwuwzna09oIW1hZQRMNWYJAKaQ',
  authDomain: 'dhcr-e616f.firebaseapp.com',
  projectId: 'dhcr-e616f',
  storageBucket: 'dhcr-e616f.appspot.com',
  messagingSenderId: '912958375395',
  appId: '1:912958375395:web:e551178497f5a5c36accd6',
};
const app = initializeApp(firebaseConfig);

export default app;
