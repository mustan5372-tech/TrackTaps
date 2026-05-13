import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const authService = {
  // Set persistence to local (session persists after window close)
  init: async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.error("Auth persistence error:", error);
    }
  },

  loginWithGoogle: async () => {
    try {
      if (!auth.app) {
        alert("🔐 Google Login is currently unavailable. Please ensure Firebase keys are added to Vercel environment variables.");
        return null;
      }
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
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
