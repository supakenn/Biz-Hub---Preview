// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase SDK initialization for Angel's POS
// Project: angels-pos  |  Console: https://console.firebase.google.com
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace these placeholder values with your real Firebase project config.
// You can find them at:
//   Firebase Console → Project Settings → General → Your Apps → Web app → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyAM9JnzMfKfPRNQVgFkSTpTdcIGlg7SdvY",
  authDomain: "angels-pos.firebaseapp.com",
  projectId: "angels-pos",
  storageBucket: "angels-pos.firebasestorage.app",
  messagingSenderId: "636580035181",
  appId: "1:636580035181:web:54537b2111714816195d64"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
