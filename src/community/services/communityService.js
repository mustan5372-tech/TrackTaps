import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

const communityService = {
  /**
   * Fetch top premium users for the leaderboard
   * Isolated from core app logic
   */
  fetchLeaderboard: async (limitCount = 10) => {
    try {
      console.log("🏆 [CommunityService] Fetching leaderboard data...");
      
      const usersRef = collection(db, "users");
      
      // STABILITY UPGRADE:
      // To avoid Firestore index requirements (which often break queries with multiple where/orderBy),
      // we fetch active premium users and then sort them in memory.
      // This is extremely safe and prevents the "Oops" error state.
      const q = query(
        usersRef,
        where("subscription.status", "==", "active"),
        limit(limitCount * 5) // Fetch more than needed to ensure we have enough data points
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("ℹ️ [CommunityService] No premium users found.");
        return [];
      }

      const leaderboard = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include users who have attendance data synced
        if (data.overallAttendance !== undefined) {
          leaderboard.push({
            uid: doc.id,
            name: data.displayName || "Anonymous",
            attendance: Number(data.overallAttendance) || 0,
            totalClasses: data.totalClasses || 0,
            role: data.role || "PREMIUM",
            photoURL: data.photoURL || null,
            lastSynced: data.lastSyncDate || data.lastSynced
          });
        }
      });

      // Sort by attendance descending
      leaderboard.sort((a, b) => b.attendance - a.attendance);

      // Return only the requested limit
      const finalData = leaderboard.slice(0, limitCount);
      console.log(`✅ [CommunityService] Loaded ${finalData.length} leaderboard entries.`);
      return finalData;
    } catch (error) {
      console.error("❌ [CommunityService] FATAL FETCH ERROR:", error);
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      throw error;
    }
  }
};

export default communityService;
