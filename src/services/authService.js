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
      console.log(`🔐 [Auth] Starting Google Auth (${isMobile ? 'Native' : 'Web'} Flow)...`);
      
      await authService.init();

      if (isMobile) {
        // NATIVE FLOW: No browser redirects, just a native account chooser popup
        console.log("🚀 [Auth] Triggering Native Google Sign-In Popup...");
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        
        // This opens the native Android/iOS account picker
        const nativeUser = await GoogleAuth.signIn();
        
        if (nativeUser && nativeUser.authentication.idToken) {
          console.log("✅ [Auth] Native Sign-In Success, linking with Firebase...");
          const { GoogleAuthProvider, signInWithCredential } = await import("firebase/auth");
          
          const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
          const result = await signInWithCredential(auth, credential);
          
          console.log("🎉 [Auth] Firebase Native Auth Success:", result.user.email);
          return result.user;
        }
        throw new Error("Native Google Sign-In failed to return an ID Token.");
      } else {
        // WEB FLOW: Standard popup for desktop
        const { signInWithPopup } = await import("firebase/auth");
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ [Auth] Web Login Success:", result.user.email);
        return result.user;
      }
    } catch (error) {
      console.error("❌ [Auth] Login error:", error);
      throw error;
    }
  },

  handleRedirectResult: async () => {
    // Redirect flow is now DEPRECATED for mobile in favor of Native Popup
    // We only keep this for web fallback scenarios if needed
    try {
      if (isMobileApp()) return null; // Native flow doesn't use redirects
      
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
