// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase SDK initialization for Angel's POS
// Project: angels-pos  |  Console: https://console.firebase.google.com
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// TODO: Replace these placeholder values with your real Firebase project config.
// You can find them at:
//   Firebase Console → Project Settings → General → Your Apps → Web app → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyBXKvBMuyK-vJlyiO5nClbbPG_PYsfPz8I",
  authDomain: "biz-hub-suite.firebaseapp.com",
  projectId: "biz-hub-suite",
  storageBucket: "biz-hub-suite.firebasestorage.app",
  messagingSenderId: "476681014629",
  appId: "1:476681014629:web:acc85551ccc4842e8aa58c"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);

// Initialize Firestore with the persistent cache explicitly enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const googleProvider = new GoogleAuthProvider();

