// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase SDK initialization for Angel's POS
// Project: angels-pos  |  Console: https://console.firebase.google.com
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "../demo-services/cloud-provider";
import { getAuth, GoogleAuthProvider } from "../demo-services/cloud-provider";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "../demo-services/cloud-provider";

// TODO: Replace these placeholder values with your real Firebase project config.
// You can find them at:
//   Firebase Console → Project Settings → General → Your Apps → Web app → SDK setup
const demoConfig = {
  demoKey: "AIzaSyBXKvBMuyK-vJlyiO5nClbbPG_PYsfPz8I",
  authDomain: "biz-hub-suite.firebaseapp.com",
  projectId: "biz-hub-suite",
  storageBucket: "biz-hub-suite.firebasestorage.app",
  messagingSenderId: "476681014629",
  appId: "1:476681014629:web:acc85551ccc4842e8aa58c"
};

const app      = initializeApp(demoConfig);
export const demoAuth     = getAuth(app);

// Initialize Firestore with the persistent cache explicitly enabled
export const demoDb = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const googleProvider = new GoogleAuthProvider();

