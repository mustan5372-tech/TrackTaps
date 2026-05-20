import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with client credentials
try {
  GoogleSignin.configure({
    webClientId: '273530797417-bd8fuigvtn5pteccivud773ijo8s9ioe.apps.googleusercontent.com', // Kept matching current web project client ID
    offlineAccess: true,
  });
} catch (e) {
  console.warn("⚠️ [AuthService Native] Google SDK configuration skip: ", e);
}

const authService = {
  init: async (): Promise<void> => {
    // React Native Firebase SDK handles persistence automatically in native keychain
    console.log("✅ [Auth Native] Persistence handled natively by iOS/Android key store");
  },

  loginWithGoogle: async (): Promise<FirebaseAuthTypes.User | null> => {
    console.log("🔐 [Auth Native] Initiating Native Google Authentication Bridge...");
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Proactive session cleanup to force account selection dialog
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      const signInResult = await GoogleSignin.signIn();
      // Handle GoogleSignin v11+ (data object) vs v10- (direct property) API structure
      const idToken = (signInResult as any).data?.idToken || (signInResult as any).idToken;

      if (!idToken) {
        throw new Error("Native Google Sign-In did not return an ID token.");
      }

      // Create a credential with the token
      const credential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(credential);
      console.log("👤 [Auth Native] Native Auth login success: ", userCredential.user.email);
      return userCredential.user;
    } catch (error: any) {
      console.error("❌ [Auth Native] Google Login Failure:", error);
      throw error;
    }
  },

  signupWithEmail: async (email: string, password: string,fullName: string): Promise<FirebaseAuthTypes.User> => {
    try {
      const result = await auth().createUserWithEmailAndPassword(email, password);
      if (result.user) {
        await result.user.updateProfile({ displayName: fullName });
      }
      return result.user;
    } catch (error) {
      console.error("❌ [Auth Native] Email Signup Failure:", error);
      throw error;
    }
  },

  loginWithEmail: async (email: string, password: string): Promise<FirebaseAuthTypes.User> => {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      console.error("❌ [Auth Native] Email Login Failure:", error);
      throw error;
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error("❌ [Auth Native] Password Reset Failure:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    console.log("🧹 [Auth Native] Initiating complete signout session cleanup...");
    try {
      // 1. Sign out of Google native SDK
      try {
        await GoogleSignin.signOut();
        await GoogleSignin.revokeAccess();
      } catch (e) {
        console.warn("⚠️ [Auth Native] Non-critical Google SDK signout skip: ", e);
      }

      // 2. Clear Firebase native authentication persistence
      await auth().signOut();
      console.log("✅ [Auth Native] Native logout lifecycle completed");
    } catch (error) {
      console.error("❌ [Auth Native] Logout failure: ", error);
      throw error;
    }
  },

  updateUserProfile: async (user: FirebaseAuthTypes.User, profileData: { displayName?: string; photoURL?: string }): Promise<boolean> => {
    try {
      await user.updateProfile(profileData);
      return true;
    } catch (error) {
      console.error("❌ [Auth Native] Update Profile Failure:", error);
      throw error;
    }
  },

  onAuthChange: (callback: (user: FirebaseAuthTypes.User | null) => void): () => void => {
    return auth().onAuthStateChanged(callback);
  },

  getCurrentUser: (): FirebaseAuthTypes.User | null => {
    return auth().currentUser;
  }
};

export default authService;
