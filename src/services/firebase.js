import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if config is valid
let app, auth, db, googleProvider, storage;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing. Check your environment variables.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Enable persistent local cache for offline attendance tracking and offline loading
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  
  storage = getStorage(app);
  
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Fallback to avoid crashing the whole app
  const disabledFn = () => {
    alert("🔐 Google Login is currently unavailable on this environment. Please check if Firebase API keys are configured in Vercel.");
    return Promise.reject("Firebase not initialized");
  };
  auth = { 
    onAuthStateChanged: (cb) => { cb(null); return () => {}; },
    signInWithPopup: disabledFn,
    signOut: disabledFn
  };
  db = {};
  storage = {};
  googleProvider = {};
}

export { app, auth, db, googleProvider, storage };
