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
  getDoc,
  setDoc
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
      const inviterSnap = await getDoc(inviterRef);
      
      if (inviterSnap.exists()) {
        const inviterData = inviterSnap.data();
        // Check if inviter already finished their campaign
        if (inviterData.referralData?.referralCampaignCompleted) {
          console.log(`⚠️ [ReferralService] Inviter ${inviterUid} has already completed the campaign.`);
          return inviterUid;
        }
      }

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
  validateReferral: async (referredUserUid, inviterUid, podEmail) => {
    try {
      if (!inviterUid || !referredUserUid || !podEmail) {
        console.warn("⚠️ [ReferralService] Validation skipped: Missing data", { referredUserUid, inviterUid, podEmail });
        return;
      }

      console.log(`🔍 [ReferralService] Validating referral for ${referredUserUid} (Inviter: ${inviterUid}, Pod: ${podEmail})`);

      // 1. ANTI-ABUSE: Check if this Pod.ai account has already been used for ANY referral
      const podRef = doc(db, 'pod_accounts', podEmail.toLowerCase());
      const podSnap = await getDoc(podRef);

      if (podSnap.exists()) {
        console.error(`🚫 [ReferralService] Abuse detected: Pod.ai account ${podEmail} already used in another referral.`);
        return;
      }

      const inviterRef = doc(db, 'users', inviterUid);
      const inviterSnap = await getDoc(inviterRef);
      
      if (!inviterSnap.exists()) return;

      const referralData = inviterSnap.data().referralData || {};
      
      // 2. CAMPAIGN LOCK: If inviter already finished campaign, don't count more
      if (referralData.referralCampaignCompleted) {
        console.log(`ℹ️ [ReferralService] Inviter already completed campaign. Validation ignored.`);
        return;
      }

      const referrals = referralData.referrals || [];
      
      // 3. Find the specific referral entry
      const referralIndex = referrals.findIndex(r => r.uid === referredUserUid);
      if (referralIndex === -1) {
        console.warn(`⚠️ [ReferralService] No join record found for ${referredUserUid} in ${inviterUid}'s list`);
        return;
      }
      
      // 4. ALREADY SYNCED CHECK
      if (referrals[referralIndex].status === 'synced') return;

      // 5. ATOMIC VALIDATION: Register Pod account and update referral status
      // In a real production app, use a Firestore transaction here
      await setDoc(podRef, {
        usedByTrackTapsUid: referredUserUid,
        inviterUid: inviterUid,
        validatedAt: new Date().toISOString()
      });

      // Update entry to 'synced' (The "REAL" validation)
      referrals[referralIndex].status = 'synced';
      referrals[referralIndex].validatedAt = new Date().toISOString();
      referrals[referralIndex].podEmail = podEmail;

      // Recalculate totals
      const validCount = referrals.filter(r => r.status === 'synced').length;

      await updateDoc(inviterRef, {
        'referralData.referrals': referrals,
        'referralData.totalValidReferrals': validCount,
        'referralData.analytics.validReferrals': validCount,
        'referralData.analytics.activeUsers': increment(1)
      });

      console.log(`✅ [ReferralService] Referral VALIDATED. New count for ${inviterUid}: ${validCount}`);
      
      // 6. AUTO-REWARD: Trigger 15 Days Premium if threshold met (10 valid)
      if (validCount >= 10 && !referralData.referralCampaignCompleted) {
        await referralService.triggerReward(inviterUid);
      }
    } catch (error) {
      console.error("❌ [ReferralService] Validation error:", error);
    }
  },

  /**
   * Triggers the REAL 15-day Premium reward using the production system
   */
  triggerReward: async (uid) => {
    try {
      console.log(`🎊 [ReferralService] Threshold reached for ${uid}! Activating reward...`);
      const userRef = doc(db, 'users', uid);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15); // 15 Days Premium Plus

      const subscriptionData = {
        plan: 'plus',
        planType: 'referral_reward',
        status: 'active',
        expiryDate: expiryDate.toISOString(),
        paymentId: 'REF_CAMPAIGN_15D_COMPLETED',
        activatedAt: new Date().toISOString(),
        paymentSource: 'referral'
      };

      await updateDoc(userRef, {
        'role': 'PREMIUM', 
        'premium': true,
        'premiumPlan': 'referral_15d',
        'premiumActivatedAt': subscriptionData.activatedAt,
        'premiumExpiresAt': subscriptionData.expiryDate,
        'subscription': subscriptionData,
        'referralData.referralCampaignCompleted': true,
        'referralData.referralRewardClaimed': true,
        'referralData.claimedRewards': arrayUnion({
          rewardId: 'launch_campaign_15d',
          date: new Date().toISOString()
        })
      });

      console.log(`💎 [ReferralService] SUCCESS: 15 Days Premium Plus activated for ${uid}.`);
    } catch (error) {
      console.error("❌ [ReferralService] Reward activation error:", error);
    }
  }
};

export default referralService;

