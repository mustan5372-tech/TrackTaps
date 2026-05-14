import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  setPersistence
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Conservative detection: Only use Native plugin if the bridge is definitely available
const isNativeAPK = () => {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform());
};

const isMobileBrowser = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const authService = {
  // Set persistence to local (session persists after window close)
  init: async () => {
    try {
      console.log("🚀 [Auth] Initializing persistent storage...");
      // IndexedDB is the gold standard for mobile/native persistence
      await setPersistence(auth, indexedDBLocalPersistence).catch(() => {
        return setPersistence(auth, browserLocalPersistence);
      });
      console.log("✅ [Auth] Persistence established");
    } catch (error) {
      console.error("❌ [Auth] Persistence error:", error);
    }
  },

  loginWithGoogle: async () => {
    try {
      if (!auth.app) throw new Error("Firebase not initialized");

      const isAPK = isNativeAPK();
      console.log(`🔐 [Auth] Initiating Login: ${isAPK ? 'NATIVE APK' : 'WEB'}`);
      
      await authService.init();

      if (isAPK) {
        // --- 1. NATIVE APK FLOW (Native Plugin) ---
        console.log("🚀 [Auth] Using Capacitor Native Auth plugin...");
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        try { await GoogleAuth.initialize(); } catch (e) {}

        const nativeUser = await GoogleAuth.signIn();
        if (nativeUser && nativeUser.authentication.idToken) {
          const { GoogleAuthProvider, signInWithCredential } = await import("firebase/auth");
          const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
          const result = await signInWithCredential(auth, credential);
          return result.user;
        }
        throw new Error("Native Auth failed to return ID Token.");

      } else {
        // --- 2. WEB FLOW (Original Stable Version) ---
        // Restore to the exact logic that was "working fine" before
        console.log("🌐 [Auth] Using standard Firebase Web Popup...");
        const { signInWithPopup } = await import("firebase/auth");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error) {
      console.error("❌ [Auth] Google Login Failure:", error);
      throw error;
    }
  },

  handleRedirectResult: async () => {
    // Only relevant for mobile browsers that used signInWithRedirect
    if (isNativeAPK()) {
      console.log("⏭️ [Auth] Skipping redirect check (Native APK environment)");
      return null;
    }
    
    try {
      console.log("🔄 [Auth] Checking getRedirectResult()...");
      const { getRedirectResult } = await import("firebase/auth");
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        console.log("✅ [Auth] Redirect Login Success:", result.user.email);
        return result.user;
      }
      
      console.log("ℹ️ [Auth] No redirect result found in current session.");
      return null;
    } catch (error) {
      console.error("❌ [Auth] getRedirectResult Error:", error.code, error.message);
      return null;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  onAuthChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};

export default authService;
