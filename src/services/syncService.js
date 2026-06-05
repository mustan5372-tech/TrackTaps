import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "./firebase";

const syncService = {
  /**
   * Save user data to Firestore
   * @param {string} userId 
   * @param {object} data 
   */
  saveToCloud: async (userId, data) => {
    if (userId === 'beta_tester_uid_2026') {
      console.log("💾 [SyncService] Mock Beta User: Saving to localStorage");
      localStorage.setItem('mock_beta_user_cloud_data', JSON.stringify(data));
      return true;
    }
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
    if (userId === 'beta_tester_uid_2026') {
      console.log("💾 [SyncService] Mock Beta User: Fetching from localStorage");
      const localData = localStorage.getItem('mock_beta_user_cloud_data');
      if (localData) {
        return JSON.parse(localData);
      }
      // Default cloud data for the beta tester, containing lifetime subscription and owner role
      return {
        uid: 'beta_tester_uid_2026',
        displayName: 'Beta Tester',
        email: 'beta@tracktaps.online',
        role: 'owner',
        subscription: {
          plan: 'plus',
          planType: 'lifetime',
          status: 'active',
          expiryDate: '2099-12-31'
        }
      };
    }
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
