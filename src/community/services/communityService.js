import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../services/firebase";
import { calculateAttendanceStats, calculateActivityScore } from "../../utils/attendanceUtils";

const communityService = {
  /**
   * Fetch top premium users for the leaderboard
   * Isolated from core app logic
   */
  fetchLeaderboard: async (limitCount = 20) => {
    try {
      console.log("🏆 [CommunityService] Initializing global leaderboard fetch...");
      
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("subscription.status", "==", "active"),
        limit(100) 
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn("⚠️ [CommunityService] No premium users found in database.");
        return [];
      }

      const rawUsers = [];
      const seenEmails = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;
        const email = data.email?.toLowerCase();

        // DEDUPLICATION LOGIC
        if (email && seenEmails.has(email)) return;
        if (email) seenEmails.add(email);

        console.log(`🔍 [CommunityService] Processing data for: ${data.displayName || 'Anonymous'} (${uid})`);

        // REAL ATTENDANCE CALCULATION (Multi-user safety)
        // We reuse the SHARED utility to ensure consistency across the entire app.
        // If 'subjects' are present in the user doc, we calculate fresh stats.
        let attendance = Number(data.overallAttendance) || 0;
        let totalClasses = Number(data.totalClasses) || 0;
        let activityScore = Number(data.activityScore) || 0;

        if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
          const stats = calculateAttendanceStats(
            data.subjects, 
            data.calendarEvents || [], 
            data.attendanceData || {}
          );
          attendance = stats.overallPercentage;
          totalClasses = stats.totalClasses;
          
          // Re-calculate activity score if not present
          if (!activityScore) {
            activityScore = calculateActivityScore(data.subjects, data.attendanceData || {});
          }

          console.log(`✅ [CommunityService] Real attendance calculated for ${data.displayName}: ${attendance}% (${totalClasses} classes)`);
        } else {
          console.log(`ℹ️ [CommunityService] No subjects found for ${data.displayName}, using cached values.`);
        }

        rawUsers.push({
          uid: uid,
          name: data.displayName || "TrackTaps User",
          attendance: attendance,
          totalClasses: totalClasses,
          activityScore: activityScore,
          photoURL: data.photoURL || null,
          lastSynced: data.lastSyncDate || data.lastSynced
        });
      });

      console.log(`📊 [CommunityService] Fetched ${rawUsers.length} raw premium records.`);

      // RANKING LOGIC (Activity-Aware)
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
      console.log("🏁 [CommunityService] Final Rankings:", finalRankings.map(u => `${u.name} (${u.attendance}%)`));
      
      return finalRankings;
    } catch (error) {
      console.error("❌ [CommunityService] Critical Leaderboard Error:", error);
      throw error;
    }
  }
};

export default communityService;
