import crypto from 'crypto';
import admin from 'firebase-admin';
import Razorpay from 'razorpay';
import { sendPremiumWelcomeEmail } from './services/emailService.js';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (e) {
    console.error('Firebase Admin Init Error:', e);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_CONFIG = {
  'monthly': { days: 30, amount: 2, label: 'monthly' },
  'half_yearly': { days: 180, amount: 5, label: 'half_yearly' },
  'yearly': { days: 365, amount: 9, label: 'yearly' }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    uid,
    planId,
    amount // Provided by client, but we will verify with order
  } = req.body;

  console.log(`💳 [PaymentVerification] Started for UID: ${uid}, Plan: ${planId}, Order: ${razorpay_order_id}`);

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    console.error('❌ [PaymentVerification] Razorpay secret missing in environment');
    return res.status(500).json({ message: 'Razorpay secret not configured' });
  }

  try {
    // 1. DUPLICATE CHECK: Ensure payment hasn't been processed yet
    if (db) {
      const paymentDoc = await db.collection('payments').doc(razorpay_payment_id).get();
      if (paymentDoc.exists) {
        console.warn(`⚠️ [PaymentVerification] Duplicate payment attempt: ${razorpay_payment_id}`);
        return res.status(400).json({ 
          message: 'This payment has already been processed and activated.',
          success: false 
        });
      }
    }

    // 2. VERIFY SIGNATURE
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('❌ [PaymentVerification] Signature mismatch!');
      return res.status(400).json({ 
        message: 'Invalid signature. Payment could not be verified.',
        success: false 
      });
    }

    // 3. SECURE PLAN VALIDATION: Fetch order from Razorpay to verify amount and notes
    console.log(`🔍 [PaymentVerification] Verifying order ${razorpay_order_id} with Razorpay API...`);
    const order = await razorpay.orders.fetch(razorpay_order_id);
    
    if (!order) {
      throw new Error('Order not found on Razorpay');
    }

    // Map order notes or amount to plan
    const expectedPlan = PLAN_CONFIG[planId];
    if (!expectedPlan) {
      throw new Error(`Invalid planId: ${planId}`);
    }

    const expectedAmountPaise = expectedPlan.amount * 100;
    if (order.amount !== expectedAmountPaise) {
      console.error(`❌ [PaymentVerification] Amount mismatch! Expected ${expectedAmountPaise}, got ${order.amount}`);
      return res.status(400).json({ 
        message: 'Payment amount does not match the selected plan.',
        success: false 
      });
    }

    console.log(`✅ [PaymentVerification] Payment verified for ${expectedPlan.label} plan (₹${expectedPlan.amount})`);

    // 4. CALCULATE EXPIRY
    const durationDays = expectedPlan.days;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const subscriptionData = {
      plan: 'plus',
      planType: planId,
      status: 'active',
      expiryDate: expiryDate.toISOString(),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amountPaid: order.amount / 100,
      paymentSource: 'razorpay',
      activatedAt: new Date().toISOString(),
      lastPaymentDate: new Date().toISOString()
    };

    // 5. UPDATE FIRESTORE (Production Critical)
    if (db && uid) {
      console.log(`🚀 [PaymentVerification] Activating Premium for user: ${uid}`);
      
      const batch = db.batch();
      
      // Update User Document with specific requested fields + compatibility sub object
      const userRef = db.collection('users').doc(uid);
      batch.set(userRef, {
        premium: true,
        premiumPlan: planId,
        premiumActivatedAt: subscriptionData.activatedAt,
        premiumExpiresAt: subscriptionData.expiryDate,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        role: 'PREMIUM',
        subscription: subscriptionData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Record Payment to prevent duplicates
      const paymentRef = db.collection('payments').doc(razorpay_payment_id);
      batch.set(paymentRef, {
        uid,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: subscriptionData.amountPaid,
        planId: planId,
        timestamp: new Date().toISOString(),
        status: 'verified'
      });

      await batch.commit();
      
      console.log(`✅ [PaymentVerification] Premium Activated successfully for ${uid}. Expires: ${subscriptionData.expiryDate}`);

      // --- Async Notifications ---
      try {
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const email = userData?.email;
        const userName = userData?.displayName || 'User';

        if (email) {
          sendPremiumWelcomeEmail(email, userName, subscriptionData).catch(err => {
            console.error('❌ [PaymentVerification] Welcome Email failed:', err);
          });
        }
      } catch (notifyErr) {
        console.error('❌ [PaymentVerification] Notification prep error:', notifyErr);
      }
    } else {
      throw new Error('Database or UID missing during activation');
    }

    res.status(200).json({ 
      message: 'Premium activated successfully!',
      success: true,
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('❌ [PaymentVerification] Critical Error:', error);
    res.status(500).json({ 
      message: 'Error during activation: ' + error.message, 
      success: false 
    });
  }
}

