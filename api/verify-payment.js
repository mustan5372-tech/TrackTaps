import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'Razorpay secret not configured' });
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      res.status(200).json({ 
        message: 'Payment verified successfully',
        success: true 
      });
    } else {
      res.status(400).json({ 
        message: 'Invalid signature',
        success: false 
      });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
}
