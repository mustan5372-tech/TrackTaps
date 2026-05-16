import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  arrayUnion,
  increment,
  getDoc
} from 'firebase/firestore';

const referralService = {
  /**
   * Finds a user UID by their unique referral code
   */
  findUserByReferralCode: async (code) => {
    try {
      if (!code) return null;
      const usersRef = collection(db, 'users');
      // Search for the 6-character code
      const q = query(usersRef, where('referralData.referralCode', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error("❌ [ReferralService] Find user error:", error);
      return null;
    }
  },

  /**
   * Tracks a new referral when a user joins
   * This is the 'Joined' stage of the funnel
   */
  trackNewReferral: async (newUserUid, invitedByCode) => {
    try {
      const inviterUid = await referralService.findUserByReferralCode(invitedByCode);
      if (!inviterUid) return null;
      if (inviterUid === newUserUid) return null; // ANTI-ABUSE: Self-referral block

      const inviterRef = doc(db, 'users', inviterUid);
      const newUserRef = doc(db, 'users', newUserUid);
      
      // Verification: Check if the new user has already been referred or is an old user
      // (In a real backend this would be a more complex check)

      // Add to inviter's referral list and update analytics
      await updateDoc(inviterRef, {
        'referralData.referrals': arrayUnion({
          uid: newUserUid,
          status: 'joined',
          date: new Date().toISOString()
        }),
        'referralData.analytics.totalSignups': increment(1)
      });

      console.log(`🎁 [ReferralService] User ${newUserUid} joined via invite from ${inviterUid}`);
      return inviterUid;
    } catch (error) {
      console.error("❌ [ReferralService] Track referral error:", error);
      return null;
    }
  },

  /**
   * Validates a referral when the referred user completes a task (e.g., Pod.ai Sync)
   * This is the 'Synced/Active' stage of the funnel (THE ONLY ONE THAT COUNTS)
   */
  validateReferral: async (referredUserUid, inviterUid) => {
    try {
      if (!inviterUid || !referredUserUid) return;

      const inviterRef = doc(db, 'users', inviterUid);
      const inviterSnap = await getDoc(inviterRef);
      
      if (!inviterSnap.exists()) return;

      const referralData = inviterSnap.data().referralData || {};
      const referrals = referralData.referrals || [];
      
      // Find the specific referral entry
      const referralIndex = referrals.findIndex(r => r.uid === referredUserUid);
      if (referralIndex === -1) {
        console.warn(`⚠️ [ReferralService] No join record found for ${referredUserUid} in ${inviterUid}'s list`);
        return;
      }
      
      // ANTI-ABUSE: If already synced/validated, don't double count
      if (referrals[referralIndex].status === 'synced') return;

      // Update entry to 'synced' (The "REAL" validation)
      referrals[referralIndex].status = 'synced';
      referrals[referralIndex].validatedAt = new Date().toISOString();

      // Recalculate totals from the source of truth
      const validCount = referrals.filter(r => r.status === 'synced').length;

      await updateDoc(inviterRef, {
        'referralData.referrals': referrals,
        'referralData.totalValidReferrals': validCount,
        'referralData.analytics.validReferrals': validCount,
        'referralData.analytics.activeUsers': increment(1)
      });

      console.log(`✅ [ReferralService] Referral VALIDATED for ${referredUserUid}. New count: ${validCount}`);
      
      // AUTO-REWARD: Trigger 30 Days Premium if threshold met (10 valid)
      if (validCount >= 10 && !referralData.claimedRewards?.some(r => r.rewardId === 'launch_campaign_30d')) {
        await referralService.triggerReward(inviterUid);
      }
    } catch (error) {
      console.error("❌ [ReferralService] Validation error:", error);
    }
  },

  /**
   * Triggers the REAL 30-day Premium reward using the production system
   */
  triggerReward: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 Days precisely

      await updateDoc(userRef, {
        'role': 'PREMIUM', // PRODUCTION ROLE
        'subscription.plan': 'plus',
        'subscription.status': 'active',
        'subscription.expiryDate': expiryDate.toISOString().split('T')[0],
        'subscription.type': 'referral_reward',
        'subscription.paymentId': 'REF_CAMPAIGN_EARNED',
        'referralData.claimedRewards': arrayUnion({
          rewardId: 'launch_campaign_30d',
          date: new Date().toISOString()
        })
      });

      console.log(`💎 [ReferralService] REWARD ACTIVATED for ${uid}! 30 Days Premium Plus unlocked.`);
    } catch (error) {
      console.error("❌ [ReferralService] Reward activation error:", error);
    }
  }
};

export default referralService;
