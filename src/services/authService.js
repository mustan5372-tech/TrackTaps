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
  EmailAuthProvider,
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithCredential,
  getRedirectResult
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Robust detection: Check for Capacitor bridge and specific platform properties
const isNativeAPK = () => {
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform());
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  // Also check for the bridge existence even if isNativePlatform isn't ready
  const hasCapacitorBridge = !!(window.Capacitor?.Plugins);
  
  return isNative || (isAndroid && hasCapacitorBridge);
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
      // We force this early to ensure session recovery is stable
      await setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
        console.warn("⚠️ [Auth] IndexedDB persistence failed, falling back to LocalStorage", err);
        return setPersistence(auth, browserLocalPersistence);
      });
      console.log("✅ [Auth] Persistence established");
    } catch (error) {
      console.error("❌ [Auth] Persistence error:", error);
    }
  },

  loginWithGoogle: async () => {
    const isAPK = isNativeAPK();
    console.log(`🔐 [Auth] Initiating Login: ${isAPK ? 'NATIVE APK' : 'WEB'}`);
    
    // Detection for internal logging
    if (isAPK) {
      console.log("📱 [Auth] APK Mode Detected - Native flow active.");
    }

    try {
      if (!auth.app) throw new Error("Firebase not initialized");
      
      // Ensure persistence is ready before login
      await authService.init();

      if (isAPK) {
        // --- 1. NATIVE APK FLOW ---
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        
        try { 
          await GoogleAuth.initialize({
            clientId: '273530797417-bd8fuigvtn5pteccivud773ijo8s9ioe.apps.googleusercontent.com',
          }).catch(e => console.log("ℹ️ [Auth] GoogleAuth already initialized or skip: ", e.message)); 
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical initialization warning:", e);
        }

        const nativeUser = await GoogleAuth.signIn();
        
        if (!nativeUser || !nativeUser.authentication?.idToken) {
          throw new Error("Google Sign-In was cancelled or failed to return a valid token.");
        }

        const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        return result.user;

      } else {
        // --- 2. WEB FLOW (Browser Only) ---
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error) {
      console.error("❌ [Auth] Login Lifecycle Error:", error);
      
      const isCancellation = error.message?.includes('cancel') || error.code?.includes('cancel') || error.message?.includes('12501');
      if (!isCancellation && isAPK) {
        console.error("🏁 [Auth] Final Native Error:", error.message || error.code);
      }
      
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

  setupRecaptcha: async (containerId) => {
    try {
      // 1. Rigorous Cleanup
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {}
      }
      
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = ''; 

      console.log("🛠️ [Auth] Re-initializing reCAPTCHA on:", containerId);
      
      // 2. Initialize with specific settings for mobile stability
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': () => {
          console.log("✅ [Auth] reCAPTCHA solved");
        }
      });
      
      await window.recaptchaVerifier.render();
      return window.recaptchaVerifier;
    } catch (error) {
      console.error("❌ [Auth] reCAPTCHA Init Error:", error);
      throw new Error("Security check failed. Please refresh the page and try again.");
    }
  },

  sendOTP: async (phoneNumber, verifier) => {
    try {
      console.log(`📡 [Auth] Requesting OTP for: ${phoneNumber}`);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      console.log("📧 [Auth] OTP sent successfully!");
      return confirmationResult;
    } catch (error) {
      console.error("❌ [Auth] Firebase OTP Send Failure:", error);
      
      // Handle common Firebase phone auth errors
      if (error.code === 'auth/captcha-check-failed') {
        throw new Error("Security check failed. Please refresh the page.");
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error("The phone number provided is invalid.");
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error("Too many attempts today. Please try again in 24 hours or use Google Login.");
      }
      
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
      if (isNativeAPK()) {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          await GoogleAuth.signOut().catch(e => console.log("ℹ️ [Auth] GoogleAuth signOut skip or already signed out:", e.message));
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical native GoogleAuth signOut warning:", e);
        }
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  updateUserProfile: async (user, profileData) => {
    try {
      await updateProfile(user, profileData);
      return true;
    } catch (error) {
      console.error("❌ [Auth] Update Profile Failure:", error);
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
