import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider
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
        console.log("🌐 [Auth] Using standard Firebase Web Popup...");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error) {
      console.error("❌ [Auth] Google Login Failure:", error);
      throw error;
    }
  },

  // --- Email Authentication ---
  signupWithEmail: async (email, password, fullName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await updateProfile(result.user, { displayName: fullName });
      return result.user;
    } catch (error) {
      console.error("❌ [Auth] Email Signup Failure:", error);
      throw error;
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("❌ [Auth] Email Login Failure:", error);
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("❌ [Auth] Password Reset Failure:", error);
      throw error;
    }
  },

  // --- Phone Authentication ---
  setupRecaptcha: async (containerId) => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      console.log("🛠️ [Auth] Setting up Recaptcha on:", containerId);
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': (response) => {
          console.log("✅ [Auth] Recaptcha verified");
        },
        'expired-callback': () => {
          console.warn("⚠️ [Auth] Recaptcha expired");
        }
      });
      
      // Explicitly render to ensure it's ready
      await window.recaptchaVerifier.render();
      return window.recaptchaVerifier;
    } catch (error) {
      console.error("❌ [Auth] Recaptcha setup failed:", error);
      throw error;
    }
  },

  sendOTP: async (phoneNumber, verifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      return confirmationResult;
    } catch (error) {
      console.error("❌ [Auth] Send OTP Failure:", error);
      throw error;
    }
  },

  verifyOTP: async (confirmationResult, code) => {
    try {
      const result = await confirmationResult.confirm(code);
      return result.user;
    } catch (error) {
      console.error("❌ [Auth] OTP Verification Failure:", error);
      throw error;
    }
  },

  handleRedirectResult: async () => {
    if (isNativeAPK()) {
      return null;
    }
    
    try {
      const { getRedirectResult } = await import("firebase/auth");
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        return result.user;
      }
      return null;
    } catch (error) {
      console.error("❌ [Auth] getRedirectResult Error:", error);
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
