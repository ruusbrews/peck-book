import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyAEghABUGzoHDzvJ74f7EMSEGcRsAhoI1I',
  authDomain: 'peck-book.firebaseapp.com',
  projectId: 'peck-book',
  storageBucket: 'peck-book.firebasestorage.app',
  messagingSenderId: '975292809570',
  appId: '1:975292809570:web:04470db9210e9a5b822c3b',
};

export const app = initializeApp(firebaseConfig);