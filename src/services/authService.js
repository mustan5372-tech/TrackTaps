import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  setPersistence
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Enhanced native platform detection for Remote URL apps
const isNativeAPK = () => {
  const isCapacitorGlobal = !!window.Capacitor?.isNativePlatform();
  const isCapacitorUA = navigator.userAgent.includes('Capacitor');
  const isCapacitorProtocol = window.location.protocol === 'capacitor:';
  
  const isNative = isCapacitorGlobal || isCapacitorUA || isCapacitorProtocol;
  
  console.log("🔍 [Auth] Environment Detection:", {
    isCapacitorGlobal,
    isCapacitorUA,
    isCapacitorProtocol,
    isNative,
    userAgent: navigator.userAgent
  });
  
  return isNative;
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
      const isMobileWeb = isMobileBrowser();
      
      console.log(`🔐 [Auth] Initiating Login: ${isAPK ? 'NATIVE APK' : (isMobileWeb ? 'MOBILE WEB' : 'DESKTOP')}`);
      
      await authService.init();

      if (isAPK) {
        // --- 1. NATIVE APK FLOW (Native Plugin) ---
        console.log("🚀 [Auth] Using Capacitor Native Auth...");
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
        // --- 2. WEB FLOW (Popup with Redirect Fallback) ---
        console.log("🌐 [Auth] Attempting Web Popup Login...");
        const { signInWithPopup, signInWithRedirect } = await import("firebase/auth");
        
        try {
          // Popup is generally more reliable for custom domains if not blocked
          const result = await signInWithPopup(auth, googleProvider);
          console.log("✅ [Auth] Popup Login Success:", result.user.email);
          return result.user;
        } catch (error) {
          if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.warn("⚠️ [Auth] Popup failed/blocked, falling back to Redirect...");
            await signInWithRedirect(auth, googleProvider);
            return null;
          }
          throw error;
        }
      }
    } catch (error) {
      console.error("❌ [Auth] Google Login Failure:", error);
      if (error.message?.includes('10') || error.message?.includes('DEVELOPER_ERROR')) {
        alert("🔒 Auth Error: Please ensure your SHA-1 and Client ID are correctly configured in Firebase.");
      }
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
      // alert("Auth Redirect Error: " + error.message); // Helpful for mobile debugging
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
