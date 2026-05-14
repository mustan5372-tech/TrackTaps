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

      const isMobile = isMobileApp();
      console.log(`🔐 [Auth] Starting Google Auth (${isMobile ? 'Redirect' : 'Popup'} Flow)...`);
      
      // Ensure persistence is definitely set before starting auth
      await authService.init();

      if (isMobile) {
        // Mobile flow: Redirect is much more reliable in WebViews
        // Capacitor will stay in-app thanks to allowNavigation in config
        // NOTE: User must configure deep links in AndroidManifest.xml
        const { signInWithRedirect } = await import("firebase/auth");
        console.log("🚀 [Auth] Calling signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        return null; // The page will redirect
      } else {
        // Desktop flow: Popup is better UX
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ [Auth] Login Success:", result.user.email);
        return result.user;
      }
    } catch (error) {
      console.error("❌ [Auth] Login error:", error);
      throw error;
    }
  },

  handleRedirectResult: async () => {
    try {
      const { getRedirectResult } = await import("firebase/auth");
      const result = await getRedirectResult(auth);
      if (result) {
        console.log("✅ [Auth] Redirect Login Success:", result.user.email);
        return result.user;
      }
      return null;
    } catch (error) {
      console.error("❌ [Auth] Redirect result error:", error);
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
