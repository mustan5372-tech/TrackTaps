import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const communityService = {
  /**
   * Fetches the daily leaderboard.
   * In a full production env, this would be a pre-computed collection.
   * For Phase 1 (Staging), we calculate it from active users.
   */
  getLeaderboard: async () => {
    try {
      console.log("🏆 [Community] Computing daily leaderboard...");
      
      // 1. Fetch users active in the last 7 days to ensure relevance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const usersRef = collection(db, 'users');
      // Only include users who have synced recently and have a name
      const q = query(
        usersRef,
        where('lastLoginAt', '>', sevenDaysAgo.toISOString()),
        limit(50) 
      );

      const snapshot = await getDocs(q);
      const candidates = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.displayName || data.displayName === 'Anonymous') return;

        // --- RANKING FORMULA ---
        // Score = (Attendance % * 0.7) + (Activity Factor * 0.3)
        // Activity Factor is higher for very recent syncs
        
        const attendance = data.overallAttendance || 0;
        const lastSync = data.lastSyncDate ? new Date(data.lastSyncDate) : new Date(data.lastLoginAt);
        const hoursSinceSync = Math.abs(new Date() - lastSync) / 36e5;
        
        // Bonus for syncing in the last 24 hours
        const activityBonus = hoursSinceSync < 24 ? 30 : hoursSinceSync < 48 ? 15 : 0;
        
        const score = (attendance * 0.7) + activityBonus;

        candidates.push({
          uid: doc.id,
          name: data.displayName,
          photoURL: data.photoURL,
          attendance: Math.round(attendance),
          isPremium: data.premium || false,
          score: score,
          streak: data.streak || 0
        });
      });

      // 2. Sort by score and take Top 10
      return candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    } catch (error) {
      console.error("❌ [Community] Leaderboard Fetch Failed:", error);
      return [];
    }
  }
};

export default communityService;
