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
      const q = query(usersRef, where('referralData.code', '==', code.toUpperCase()));
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
   */
  trackNewReferral: async (newUserUid, invitedByCode) => {
    try {
      const inviterUid = await referralService.findUserByReferralCode(invitedByCode);
      if (!inviterUid) return null;
      if (inviterUid === newUserUid) return null; // Anti-abuse: Self-referral

      const inviterRef = doc(db, 'users', inviterUid);
      
      // Add the new user to the inviter's referral list with 'joined' status
      await updateDoc(inviterRef, {
        'referralData.referrals': arrayUnion({
          uid: newUserUid,
          status: 'joined',
          date: new Date().toISOString()
        })
      });

      console.log(`🎁 [ReferralService] User ${newUserUid} tracked as referred by ${inviterUid}`);
      return inviterUid;
    } catch (error) {
      console.error("❌ [ReferralService] Track referral error:", error);
      return null;
    }
  },

  /**
   * Validates a referral when the referred user completes a task (e.g., Pod.ai Sync)
   */
  validateReferral: async (referredUserUid, inviterUid) => {
    try {
      if (!inviterUid || !referredUserUid) return;

      const inviterRef = doc(db, 'users', inviterUid);
      const inviterSnap = await getDoc(inviterRef);
      
      if (!inviterSnap.exists()) return;

      const referralData = inviterSnap.data().referralData || {};
      const referrals = referralData.referrals || [];
      
      // Find the referral entry
      const referralIndex = referrals.findIndex(r => r.uid === referredUserUid);
      if (referralIndex === -1) return;
      
      // If already synced, skip
      if (referrals[referralIndex].status === 'synced') return;

      // Update status to 'synced' (VALID)
      referrals[referralIndex].status = 'synced';
      referrals[referralIndex].validatedAt = new Date().toISOString();

      // Increment valid count
      const newValidCount = referrals.filter(r => r.status === 'synced').length;

      await updateDoc(inviterRef, {
        'referralData.referrals': referrals,
        'referralData.totalValidReferrals': newValidCount
      });

      console.log(`✅ [ReferralService] Referral validated for user ${referredUserUid}. New count: ${newValidCount}`);
      
      // Check for reward trigger (10 valid referrals)
      if (newValidCount >= 10 && !referralData.claimedRewards?.some(r => r.rewardId === 'launch_campaign_30d')) {
        await referralService.triggerReward(inviterUid);
      }
    } catch (error) {
      console.error("❌ [ReferralService] Validation error:", error);
    }
  },

  /**
   * Triggers the 30-day Premium reward
   */
  triggerReward: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      await updateDoc(userRef, {
        'subscription.plan': 'plus',
        'subscription.status': 'active',
        'subscription.expiryDate': expiryDate.toISOString().split('T')[0],
        'subscription.type': 'referral_reward',
        'referralData.claimedRewards': arrayUnion({
          rewardId: 'launch_campaign_30d',
          date: new Date().toISOString()
        })
      });

      console.log(`💎 [ReferralService] Reward triggered for user ${uid}! 30 Days Premium unlocked.`);
    } catch (error) {
      console.error("❌ [ReferralService] Reward trigger error:", error);
    }
  }
};

export default referralService;
