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
   * Merge local and cloud data using timestamps
   * This ensures we don't overwrite newer data
   */
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
