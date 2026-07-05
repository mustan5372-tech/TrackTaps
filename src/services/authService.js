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
    localStorage.removeItem('mock_beta_user');
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
            scopes: ['profile', 'email'],
            forceCodeForRefreshToken: true
          }).catch(e => console.log("ℹ️ [Auth] GoogleAuth already initialized or skip: ", e.message)); 
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical initialization warning:", e);
        }

        // PROACTIVE DISCONNECT: Completely flush Google Play Services session cache before sign-in to guarantee account chooser popup
        try {
          await GoogleAuth.signOut().catch(() => {});
          await GoogleAuth.disconnect().catch(e => console.log("ℹ️ [Auth] Session pre-cleanup skip:", e.message));
          console.log("🧹 [Auth] Native pre-signIn session successfully flushed!");
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical native session pre-cleanup failure:", e);
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
        try {
          if (googleProvider && typeof googleProvider.setCustomParameters === 'function') {
            googleProvider.setCustomParameters({
              prompt: 'select_account'
            });
          }
        } catch (e) {
          console.warn("⚠️ [Auth] Could not set custom prompt parameter:", e);
        }
        
        if (isMobileBrowser()) {
          console.log("📱 [Auth] Mobile Browser Detected - Using Redirect Auth Flow.");
          await signInWithRedirect(auth, googleProvider);
          return new Promise(() => {}); // keeps promise pending as page redirects
        } else {
          console.log("💻 [Auth] Desktop Browser Detected - Using Popup Auth Flow.");
          const result = await signInWithPopup(auth, googleProvider);
          return result.user;
        }
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
    localStorage.removeItem('mock_beta_user');
    if (email.toLowerCase() === 'beta@tracktaps.online') {
      throw new Error("This email is reserved for the beta testing account. Please login instead.");
    }
    try {
      await authService.init(); // Ensure persistence is ready
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
    if (email.toLowerCase() === 'beta@tracktaps.online' && password === 'BetaAccess2026!') {
      console.log("🔑 [Auth] Logging in with Beta Test Account (Local Bypass)");
      localStorage.setItem('mock_beta_user', 'true');
      const mockUser = authService.getMockBetaUser();
      
      // Notify all active listeners
      if (authService._authCallbacks) {
        authService._authCallbacks.forEach(cb => {
          try { cb(mockUser); } catch(e) {}
        });
      }
      
      return mockUser;
    }
    
    localStorage.removeItem('mock_beta_user');
    try {
      await authService.init(); // Ensure persistence is ready
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
      await authService.init(); // Ensure persistence is ready
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
      // 1. NATIVE APK: Disconnect Google Auth completely
      if (isNativeAPK()) {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          
          // CRITICAL: Initialize GoogleAuth before signing out/disconnecting to prevent native NullPointerException/crash
          try {
            await GoogleAuth.initialize({
              clientId: '273530797417-bd8fuigvtn5pteccivud773ijo8s9ioe.apps.googleusercontent.com',
              scopes: ['profile', 'email'],
              forceCodeForRefreshToken: true
            }).catch(() => {});
          } catch (initErr) {
            console.warn("⚠️ [Auth] GoogleAuth init during logout warning:", initErr);
          }

          // signOut clears the current session
          await GoogleAuth.signOut().catch(() => {});
          // disconnect completely revokes authorization — forces account chooser next time
          await GoogleAuth.disconnect().catch(e => console.log("ℹ️ [Auth] GoogleAuth disconnect skip or already disconnected:", e.message));
          console.log("✅ [Auth] Native Google Auth disconnected and session cleared");
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical native GoogleAuth signout/disconnect warning:", e);
        }

        // Clear WebView cookies/cache for Google domains (APK-specific)
        try {
          if (window.Capacitor?.Plugins?.CookieManager) {
            await window.Capacitor.Plugins.CookieManager.clearAllCookies().catch(() => {});
          }
        } catch (e) {
          console.warn("⚠️ [Auth] WebView cookie clear non-critical:", e);
        }
      } else {
        // 2. WEB: Revoke Google access token to prevent auto-selection
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            // Find Google provider data and revoke the token
            const googleProviderData = currentUser.providerData?.find(p => p.providerId === 'google.com');
            if (googleProviderData) {
              // Attempt to revoke the Google OAuth token
              const accessToken = await currentUser.getIdToken().catch(() => null);
              if (accessToken) {
                // Fire-and-forget revocation request to Google
                fetch(`https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).catch(() => {});
              }
            }
          }
        } catch (e) {
          console.warn("⚠️ [Auth] Google token revocation non-critical:", e);
        }
      }

      // 3. Clear all auth-related local storage
      try {
        // Pod.ai tokens
        localStorage.removeItem('pod_auth_token');
        localStorage.removeItem('pod_username');
        localStorage.removeItem('mock_beta_user');
        localStorage.removeItem('mock_beta_user_cloud_data');
        // Referral cache (per-user keys will remain but are harmless)
        // Onboarding state — keep it so user doesn't re-see onboarding
        // Theme — already cleared by clearAppData
      } catch (e) {
        console.warn("⚠️ [Auth] localStorage cleanup non-critical:", e);
      }

      // 4. Firebase sign out (must be last — triggers onAuthStateChanged)
      await signOut(auth);
      
      console.log("✅ [Auth] Complete logout with full session cleanup");
    } catch (error) {
      console.error("❌ [Auth] Logout error:", error);
      // Still try Firebase signOut even if other steps failed
      try { await signOut(auth); } catch (e) {}
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

  _authCallbacks: new Set(),

  getMockBetaUser: () => {
    return {
      uid: 'beta_tester_uid_2026',
      email: 'beta@tracktaps.online',
      displayName: 'Beta Tester',
      emailVerified: true,
      isAnonymous: false,
      providerData: [{ providerId: 'password', email: 'beta@tracktaps.online' }]
    };
  },

  onAuthChange: (callback) => {
    if (!authService._authCallbacks) {
      authService._authCallbacks = new Set();
    }
    authService._authCallbacks.add(callback);
    
    // Check if we already have a mock session in progress
    const isMock = localStorage.getItem('mock_beta_user') === 'true';
    if (isMock) {
      setTimeout(() => {
        if (localStorage.getItem('mock_beta_user') === 'true') {
          callback(authService.getMockBetaUser());
        }
      }, 0);
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (localStorage.getItem('mock_beta_user') === 'true') {
        callback(authService.getMockBetaUser());
      } else {
        callback(user);
      }
    });

    return () => {
      if (authService._authCallbacks) {
        authService._authCallbacks.delete(callback);
      }
      unsub();
    };
  },

  getCurrentUser: () => {
    if (localStorage.getItem('mock_beta_user') === 'true') {
      return authService.getMockBetaUser();
    }
    return auth.currentUser;
  }
};

export default authService;
