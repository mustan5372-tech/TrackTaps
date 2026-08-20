import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Service for Pod.ai data processing and syncing
 */
class PodAiService {
  /**
   * Validates if a Pod.ai account can be synced by the current user.
   * If on a 10-day trial (or free tier), prevents the same Pod.ai account from being used across multiple TrackTaps accounts within 10 days.
   * Paid users can sync across multiple accounts without restriction.
   */
  static async validateAndRegisterTrialSync(podUsername, user, subscription, role) {
    if (!podUsername || !user) return true;

    const podId = podUsername.toLowerCase().trim();
    const isOwnerOrCore = role === 'owner' || role === 'core_admin';
    const isPaidUser = isOwnerOrCore || (subscription?.status === 'active' && subscription?.planType !== 'trial' && subscription?.paymentId !== 'MANUAL_ADMIN_ASSIGNMENT' && (subscription?.amountPaid > 0 || subscription?.paymentSource === 'razorpay'));

    try {
      const docRef = doc(db, 'podai_trial_syncs', podId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const record = docSnap.data();
        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
        const syncedAtMs = record.syncedAt ? new Date(record.syncedAt).getTime() : 0;
        const isWithin10Days = (Date.now() - syncedAtMs) < TEN_DAYS_MS;

        // If another user account synced this Pod.ai account within 10 days and current user is NOT paid
        if (record.uid !== user.uid && isWithin10Days && !isPaidUser) {
          throw new Error(
            `🚫 This Pod.ai account (${podUsername}) has already been synced on another TrackTaps account for a 10-Day Free Trial. Upgrade to a paid plan to sync this Pod.ai account across multiple accounts!`
          );
        }
      }

      // If user is on trial, register this Pod.ai account to lock it for this account's 10-day trial
      if (!isPaidUser && !isOwnerOrCore) {
        await setDoc(docRef, {
          uid: user.uid,
          userEmail: user.email || '',
          username: podUsername,
          syncedAt: new Date().toISOString()
        }, { merge: true });
      }

      return true;
    } catch (err) {
      console.error("⚠️ [PodAi Validation] Trial sync check:", err.message);
      throw err;
    }
  }

  /**
   * Merges fetched Pod.ai subjects with existing subjects in the store
   * @param {Array} existingSubjects - Current subjects in the store
   * @param {Array} podaiSubjects - Subjects fetched from Pod.ai
   * @returns {Array} - Merged subjects array
   */
  static mergeSubjects(existingSubjects, podaiSubjects) {
    const merged = [...existingSubjects];

    podaiSubjects.forEach(podSub => {
      // Sanitize all numeric values upfront
      const attended = Number(podSub.attended) || 0;
      const total = Number(podSub.total) || 0;
      const missed = Number(podSub.missed) || 0;
      const avgAtt = Number(podSub.avgAttendance) || (total > 0 ? Math.round((attended / total) * 100) : 0);

      // Find if this subject already exists (by name or podaiToken)
      const existingIdx = merged.findIndex(s =>
        s.podaiToken === podSub.token ||
        s.name.toLowerCase() === podSub.title.toLowerCase()
      );

      if (existingIdx >= 0) {
        // Update existing subject
        merged[existingIdx] = {
          ...merged[existingIdx],
          podaiToken: podSub.token,
          podaiSynced: true,
          // Standard fields for the rest of the app
          present: attended,
          total: total,
          attendance: avgAtt,
          // Store Pod.ai values as baseline for continuation
          initialPresent: attended,
          initialTotal: total,
          initialMissed: missed,
          // Store last sync info to prevent double-counting deltas
          lastSyncDate: new Date().toISOString().split('T')[0],
          podaiPercentage: avgAtt
        };
      } else {
        // Add new subject
        merged.push({
          id: `subject_pod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: podSub.title,
          podaiToken: podSub.token,
          podaiSynced: true,
          // Standard fields
          present: attended,
          total: total,
          attendance: avgAtt,
          // Baseline fields for continuation tracking
          initialPresent: attended,
          initialTotal: total,
          initialMissed: missed,
          podaiPercentage: avgAtt,
          lastSyncDate: new Date().toISOString().split('T')[0],
          criteria: 75,
          color: this.getRandomColor(),
          createdAt: new Date().toISOString()
        });
      }
    });

    return merged;
  }

  static getRandomColor() {
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default PodAiService;
