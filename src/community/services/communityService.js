import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

const communityService = {
  /**
   * Fetch top premium users for the leaderboard
   * Isolated from core app logic
   */
  fetchLeaderboard: async (limitCount = 10) => {
    try {
      console.log("🏆 [CommunityService] Fetching leaderboard...");
      
      const usersRef = collection(db, "users");
      
      // Query criteria:
      // 1. Must be active premium user
      // 2. Must have shared data (overallAttendance exists)
      // 3. Ordered by attendance percentage descending
      const q = query(
        usersRef,
        where("subscription.status", "==", "active"),
        where("overallAttendance", ">=", 0),
        orderBy("overallAttendance", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const leaderboard = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaderboard.push({
          uid: doc.id,
          name: data.displayName || "Anonymous",
          attendance: data.overallAttendance || 0,
          totalClasses: data.totalClasses || 0,
          role: data.role || "PREMIUM",
          photoURL: data.photoURL || null,
          lastSynced: data.lastSyncDate || data.lastSynced
        });
      });

      console.log(`✅ [CommunityService] Loaded ${leaderboard.length} users`);
      return leaderboard;
    } catch (error) {
      console.error("❌ [CommunityService] Leaderboard fetch failed:", error);
      throw error; // Let the UI handle it via try/catch
    }
  }
};

export default communityService;
