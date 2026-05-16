import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

const communityService = {
  /**
   * Fetch top premium users for the leaderboard
   * Isolated from core app logic
   */
  fetchLeaderboard: async (limitCount = 20) => {
    try {
      console.log("🏆 [CommunityService] Initializing global leaderboard fetch...");
      
      const usersRef = collection(db, "users");
      
      // We fetch all users who have an active subscription
      // Note: We avoid orderBy in the query to prevent index errors
      const q = query(
        usersRef,
        where("subscription.status", "==", "active"),
        limit(100) // Fetch top 100 premium users to rank
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn("⚠️ [CommunityService] No premium users found in database.");
        return [];
      }

      const rawUsers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rawUsers.push({
          uid: doc.id,
          name: data.displayName || "TrackTaps User",
          attendance: Number(data.overallAttendance) || 0,
          totalClasses: Number(data.totalClasses) || 0,
          activityScore: Number(data.activityScore) || 0,
          photoURL: data.photoURL || null,
          lastSynced: data.lastSyncDate || data.lastSynced
        });
      });

      console.log(`📊 [CommunityService] Fetched ${rawUsers.length} raw premium records.`);

      // RANKING LOGIC (Activity-Aware)
      // 1. Primary: Attendance Percentage (desc)
      // 2. Secondary (Tie-breaker): Activity Score (desc)
      // 3. Tertiary: Total Classes (desc)
      const sortedLeaderboard = rawUsers.sort((a, b) => {
        if (b.attendance !== a.attendance) {
          return b.attendance - a.attendance;
        }
        if (b.activityScore !== a.activityScore) {
          return b.activityScore - a.activityScore;
        }
        return b.totalClasses - a.totalClasses;
      });

      const finalRankings = sortedLeaderboard.slice(0, limitCount);
      console.log("✅ [CommunityService] Final rankings calculated:", finalRankings.map(u => u.name));
      
      return finalRankings;
    } catch (error) {
      console.error("❌ [CommunityService] Critical Leaderboard Error:", error);
      throw error;
    }
  }
};

export default communityService;
