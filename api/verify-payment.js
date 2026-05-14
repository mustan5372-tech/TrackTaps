import crypto from 'crypto';
import admin from 'firebase-admin';

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

const PLAN_DURATIONS = {
  'monthly': 30,
  'half_yearly': 180,
  'yearly': 365
};

const PLAN_NAMES = {
  'monthly': 'Starter (Monthly)',
  'half_yearly': 'Super Saver (6-Month)',
  'yearly': 'Mega Saver (Yearly)'
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
    amount
  } = req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'Razorpay secret not configured' });
  }

  try {
    // 1. Verify Signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        message: 'Invalid signature. Payment could not be verified.',
        success: false 
      });
    }

    // 2. Calculate Subscription Details
    const durationDays = PLAN_DURATIONS[planId] || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const subscriptionData = {
      plan: 'plus',
      planType: planId,
      status: 'active',
      expiryDate: expiryDate.toISOString(),
      paymentId: razorpay_payment_id,
      amountPaid: amount || 0,
      paymentSource: 'razorpay',
      activatedAt: new Date().toISOString(),
      lastPaymentDate: new Date().toISOString()
    };

    // 3. Update Firestore (Instant Activation)
    if (db && uid) {
      console.log(`🚀 [Backend] Activating Premium for user: ${uid}`);
      await db.collection('users').doc(uid).set({
        subscription: subscriptionData,
        role: 'PREMIUM', // Promote to Premium role
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`✅ [Backend] Premium Activated successfully for ${uid}`);
    } else {
      console.warn('⚠️ [Backend] Firestore update skipped: db or uid missing');
      if (!db) {
        return res.status(500).json({ 
          message: 'Server error: Database connection failed. Please contact admin.',
          success: false 
        });
      }
    }

    res.status(200).json({ 
      message: 'Payment verified and Premium activated!',
      success: true,
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('Verification/Activation Error:', error);
    res.status(500).json({ 
      message: 'Error during activation: ' + error.message, 
      success: false 
    });
  }
}
