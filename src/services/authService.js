import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  setPersistence
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Enhanced mobile environment detection
const isMobileApp = () => {
  const isCapacitor = window.location.origin.includes('localhost') || 
                      window.location.protocol.includes('caps') ||
                      window.location.protocol.includes('capacitor');
  
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log("🔍 [Auth] Env Detection:", { origin: window.location.origin, proto: window.location.protocol, isCapacitor, isMobileUA });
  return isCapacitor || isMobileUA;
};

const authService = {
  // Set persistence to local (session persists after window close)
  init: async () => {
    try {
      console.log("🚀 [Auth] Initializing persistent storage...");
      // Try IndexedDB first (most reliable for mobile), then fallback to LocalStorage
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

      // STOP using redirect for mobile - it breaks in WebViews
      // Use signInWithPopup which is more stable for Capacitor/TWA 
      // if configured correctly in Firebase Console
      console.log("🔐 [Auth] Starting Google Auth (Popup Flow)...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("✅ [Auth] Login Success:", result.user.email);
      return result.user;
    } catch (error) {
      console.error("❌ [Auth] Login error:", error);
      // Fallback for some WebViews that might block popups but allow redirects
      // ONLY if user explicitly wants to try it as a last resort
      throw error;
    }
  },

  handleRedirectResult: async () => {
    // Deprecated for now as we are moving away from redirect flow
    return null;
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
