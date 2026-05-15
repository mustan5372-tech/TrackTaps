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
        // --- 1. NATIVE APK FLOW ---
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        try { await GoogleAuth.initialize(); } catch (e) {}
        const nativeUser = await GoogleAuth.signIn();
        
        if (nativeUser && nativeUser.authentication.idToken) {
          const { GoogleAuthProvider, signInWithCredential } = await import("firebase/auth");
          const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
          return (await signInWithCredential(auth, credential)).user;
        }
        throw new Error("Native Auth failed.");

      } else {
        // --- 2. WEB FLOW (Standard Popup for both Desktop & Mobile) ---
        console.log("🌐 [Auth] Using standard Firebase Web Popup...");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error) {
      console.error("❌ [Auth] Google Login Failure:", error);
      // Fallback for blocked popups on mobile
      if (error.code === 'auth/popup-blocked') {
        alert("🔒 Popup Blocked: Please enable popups for this site or try Email Login.");
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
