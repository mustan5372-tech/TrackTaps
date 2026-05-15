import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

const syncService = {
  /**
   * Save user data to Firestore
   * @param {string} userId 
   * @param {object} data 
   */
  saveToCloud: async (userId, data) => {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        ...data,
        lastSynced: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Cloud save error:", error);
      throw error;
    }
  },

  /**
   * Fetch user data from Firestore
   * @param {string} userId 
   */
  fetchFromCloud: async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Cloud fetch error:", error);
      throw error;
    }
  },

  /**
   * Fetch user data from Firestore by email
   * @param {string} email 
   */
  fetchByEmail: async (email) => {
    try {
      const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error("Cloud fetch by email error:", error);
      return null;
    }
  },

  /**
   * Submit a user report for moderation
   */
  reportUser: async (reportData) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const reportsRef = collection(db, "reports");
      await addDoc(reportsRef, {
        ...reportData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Failed to submit report:", error);
      throw error;
    }
  },

  /**
   * Fetch all moderation reports
   */
  fetchReports: async () => {
    try {
      const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const reportsRef = collection(db, "reports");
      const q = query(reportsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      return [];
    }
  },
  mergeData: (localData, cloudData) => {
    if (!cloudData) return localData;
    
    // Strategy: If cloud data is newer or local is empty, use cloud
    // This is a simple implementation. In a real app, we'd compare individual timestamps.
    const cloudLastSynced = new Date(cloudData.lastSynced || 0);
    const localLastSynced = new Date(localStorage.getItem('tracktaps_last_local_update') || 0);

    if (cloudLastSynced > localLastSynced) {
      return { ...localData, ...cloudData };
    }
    
    return localData;
  }
};

export default syncService;
