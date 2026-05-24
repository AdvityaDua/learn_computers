import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyD-TjFLD_pjt0m-1zv_ZO4Knj9opfIL56M',
  authDomain: 'computer-sci-c88e9.firebaseapp.com',
  projectId: 'computer-sci-c88e9',
  storageBucket: 'computer-sci-c88e9.firebasestorage.app',
  messagingSenderId: '25462936639',
  appId: '1:25462936639:android:c5f4fc389d04010ba3148a',
};

const existingApp = getApps()[0];
const app = existingApp ?? initializeApp(firebaseConfig);

export { app };
