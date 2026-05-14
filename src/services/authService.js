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

      } else if (isMobileWeb) {
        // --- 2. MOBILE BROWSER FLOW (Redirect) ---
        console.log("📱 [Auth] Using Firebase Redirect flow (to avoid popup blockers)...");
        const { signInWithRedirect } = await import("firebase/auth");
        // This will reload the page and redirect to Google
        await signInWithRedirect(auth, googleProvider);
        return null; // Page will redirect, execution stops here

      } else {
        // --- 3. DESKTOP BROWSER FLOW (Popup) ---
        console.log("💻 [Auth] Using Firebase Popup flow...");
        const { signInWithPopup } = await import("firebase/auth");
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ [Auth] Browser Login Success:", result.user.email);
        return result.user;
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
    if (isNativeAPK()) return null;
    
    try {
      console.log("🔄 [Auth] Checking for redirect result...");
      const { getRedirectResult } = await import("firebase/auth");
      const result = await getRedirectResult(auth);
      if (result) {
        console.log("✅ [Auth] Redirect Result Found:", result.user.email);
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
