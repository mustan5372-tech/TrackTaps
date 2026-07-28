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
    
    console.log("========== LOGIN STARTED ==========");
    console.log("Google Sign In button clicked");
    console.log("Step: Environment Check -> isNativeAPK:", isAPK);
    console.log("Step: Firebase Auth configuration:", {
      apiKey: auth.config?.apiKey ? "Exposed" : "Missing",
      authDomain: auth.config?.authDomain,
      projectId: auth.config?.projectId
    });
    
    try {
      if (!auth.app) {
        console.log("FAILED STEP: Firebase initialization check");
        throw new Error("Firebase app not initialized");
      }
      
      console.log("Step: Initializing persistence");
      await authService.init();
      
      if (isAPK) {
        // --- 1. NATIVE APK FLOW ---
        console.log("Step: Loading native Capacitor Google Auth");
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

        try {
          await GoogleAuth.signOut().catch(() => {});
          await GoogleAuth.disconnect().catch(e => console.log("ℹ️ [Auth] Session pre-cleanup skip:", e.message));
          console.log("🧹 [Auth] Native pre-signIn session successfully flushed!");
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical native session pre-cleanup failure:", e);
        }

        console.log("Step: Calling GoogleAuth.signIn()");
        const nativeUser = await GoogleAuth.signIn();
        
        if (!nativeUser || !nativeUser.authentication?.idToken) {
          console.log("FAILED STEP: Native sign-in response invalid");
          throw new Error("Google Sign-In was cancelled or failed to return a valid token.");
        }

        console.log("Step: Creating Firebase Credential");
        const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
        
        console.log("Step: signInWithCredential");
        const result = await signInWithCredential(auth, credential);
        
        if (!result || !result.user) {
          console.log("FAILED STEP: signInWithCredential returned null/undefined user");
          throw new Error("Firebase signInWithCredential returned no user.");
        }

        console.log("Credential received");
        console.log("Firebase signIn completed");
        console.log("User UID:", result.user.uid);
        console.log("User Email:", result.user.email);
        console.log("Firebase current user:", auth.currentUser?.email);
        console.log("========== LOGIN COMPLETE ==========");
        return result.user;

      } else {
        // --- 2. WEB FLOW (Mobile & Desktop Web Browsers) ---
        console.log("Step: Web Flow detected");
        try {
          if (googleProvider && typeof googleProvider.setCustomParameters === 'function') {
            googleProvider.setCustomParameters({
              prompt: 'select_account'
            });
          }
        } catch (e) {
          console.warn("⚠️ [Auth] Could not set custom prompt parameter:", e);
        }
        
        console.log("🌐 [Auth] Attempting Popup Auth Flow (Works on Mobile & Desktop)...");
        try {
          console.log("Popup started: signInWithPopup");
          const result = await signInWithPopup(auth, googleProvider);
          console.log("Popup resolved successfully");
          
          if (!result || !result.user) {
            console.log("FAILED STEP: Popup resolved but result.user is null/undefined");
            throw new Error("Google Sign-In popup returned no user");
          }
          
          console.log("Credential received");
          console.log("Firebase signIn completed");
          console.log("User UID:", result.user.uid);
          console.log("User Email:", result.user.email);
          console.log("Firebase current user:", auth.currentUser?.email);
          console.log("========== LOGIN COMPLETE ==========");
          return result.user;
        } catch (popupErr) {
          console.warn("⚠️ [Auth] Popup auth error:", popupErr);
          
          // Handle user cancellation cleanly
          if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
            throw new Error("Google Sign-In was cancelled.");
          }
          
          // Fallback to redirect flow ONLY if popup was explicitly blocked by browser settings
          if (popupErr.code === 'auth/popup-blocked') {
            console.log("📱 [Auth] Popup blocked by browser! Falling back to Redirect Auth Flow...");
            await signInWithRedirect(auth, googleProvider);
            return new Promise(() => {}); // keep promise pending while page redirects
          }
          
          throw popupErr;
        }
      }
    } catch (error) {
      console.log("FAILED STEP: loginWithGoogle exception caught");
      console.log("Exact error:", error);
      console.log("Stack trace:", error.stack);
      console.log("Firebase error code:", error.code);
      console.log("Firebase error message:", error.message);
      console.log("========== LOGIN FAILED ==========");
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
    
    console.log("Step: handleRedirectResult invoked");
    try {
      const result = await getRedirectResult(auth);
      console.log("getRedirectResult completed, result:", result);
      
      if (result && result.user) {
        console.log("Redirect Result Received successfully");
        console.log("User UID:", result.user.uid);
        console.log("User Email:", result.user.email);
        return result.user;
      }
      return null;
    } catch (error) {
      console.log("FAILED STEP: getRedirectResult exception caught");
      console.log("Exact error:", error);
      console.log("Stack trace:", error.stack);
      console.log("Firebase error code:", error.code);
      console.log("Firebase error message:", error.message);
      
      window.lastAuthError = {
        step: "getRedirectResult",
        error: error.message || String(error),
        code: error.code,
        stack: error.stack
      };
      
      throw error;
    }
  },

  logout: async () => {
    try {
      // 1. NATIVE APK: Disconnect Google Auth completely
      if (isNativeAPK()) {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          
          try {
            await GoogleAuth.initialize({
              clientId: '273530797417-bd8fuigvtn5pteccivud773ijo8s9ioe.apps.googleusercontent.com',
              scopes: ['profile', 'email'],
              forceCodeForRefreshToken: true
            }).catch(() => {});
          } catch (initErr) {
            console.warn("⚠️ [Auth] GoogleAuth init during logout warning:", initErr);
          }

          await GoogleAuth.signOut().catch(() => {});
          await GoogleAuth.disconnect().catch(e => console.log("ℹ️ [Auth] GoogleAuth disconnect skip or already disconnected:", e.message));
          console.log("✅ [Auth] Native Google Auth disconnected and session cleared");
        } catch (e) {
          console.warn("⚠️ [Auth] Non-critical native GoogleAuth signout/disconnect warning:", e);
        }

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
            const googleProviderData = currentUser.providerData?.find(p => p.providerId === 'google.com');
            if (googleProviderData) {
              const accessToken = await currentUser.getIdToken().catch(() => null);
              if (accessToken) {
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
        localStorage.removeItem('pod_auth_token');
        localStorage.removeItem('pod_username');
        localStorage.removeItem('mock_beta_user');
        localStorage.removeItem('mock_beta_user_cloud_data');
      } catch (e) {
        console.warn("⚠️ [Auth] localStorage cleanup non-critical:", e);
      }

      // 4. Firebase sign out
      await signOut(auth);
      console.log("✅ [Auth] Complete logout with full session cleanup");
    } catch (error) {
      console.error("❌ [Auth] Logout error:", error);
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
          console.log("📢 [Auth] Mock onAuthStateChanged fired!");
          const mockUser = authService.getMockBetaUser();
          console.log("UID:", mockUser.uid);
          console.log("Email:", mockUser.email);
          console.log("Current Route:", window.location.pathname);
          callback(mockUser);
        }
      }, 0);
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("📢 [Auth] onAuthStateChanged fired!");
      if (user) {
        console.log("UID:", user.uid);
        console.log("Email:", user.email);
      } else {
        console.log("User: null");
      }
      console.log("Current Route:", window.location.pathname);

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
