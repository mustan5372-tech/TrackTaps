/**
 * Mobile Service for TrackTaps
 * Sends transactional SMS and WhatsApp confirmations via Twilio API
 */

// Dynamically load Twilio if configured
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    return null;
  }
  
  try {
    // Dynamic import to avoid errors if twilio package is not resolved locally
    const twilio = require('twilio');
    return twilio(accountSid, authToken);
  } catch (e) {
    console.warn('⚠️ [MobileService] Twilio library or credentials not fully resolved.');
    return null;
  }
};

/**
 * Send a premium welcome alert via SMS or WhatsApp
 * @param {string} phone - User's mobile number
 * @param {string} name - User's name
 * @param {object} subscription - Subscription details
 */
export const sendMobileConfirmation = async (phone, name, subscription) => {
  if (!phone) {
    console.log('⚠️ [MobileService] No phone number provided for mobile alert.');
    return { success: false, error: 'No phone' };
  }

  // Normalize phone number (Ensure it has country code, default to +91 for India if 10 digits)
  let normalizedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
  if (normalizedPhone.length === 10) {
    normalizedPhone = '+91' + normalizedPhone;
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+' + normalizedPhone;
  }

  const planName = subscription.planType === 'yearly' ? 'Mega Saver (Yearly)' : 
                   subscription.planType === 'half_yearly' ? 'Super Saver (6-Month)' : 'Starter (Monthly)';
  
  const expiryStr = new Date(subscription.expiryDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const messageText = `🚀 TrackTaps Premium Activated!\n\nHi ${name || 'User'},\nYour TrackTaps Plus plan (${planName}) is now active until ${expiryStr}.\n\nThank you for choosing TrackTaps!`;

  // 1. Check Twilio integration
  const client = getTwilioClient();
  if (client) {
    const whatsappSender = process.env.TWILIO_SENDER_WHATSAPP || 'whatsapp:+14155238886'; // Default Twilio Sandbox WhatsApp number
    const smsSender = process.env.TWILIO_SENDER_SMS; // e.g. +1234567890

    // Send WhatsApp if configured
    if (whatsappSender) {
      console.log(`📡 [MobileService] Attempting Twilio WhatsApp to ${normalizedPhone}`);
      try {
        const message = await client.messages.create({
          body: messageText,
          from: whatsappSender.startsWith('whatsapp:') ? whatsappSender : `whatsapp:${whatsappSender}`,
          to: `whatsapp:${normalizedPhone}`
        });
        console.log('✅ [MobileService] WhatsApp alert dispatched via Twilio:', message.sid);
        return { success: true, type: 'whatsapp', sid: message.sid };
      } catch (err) {
        console.error('❌ [MobileService] Twilio WhatsApp failed:', err.message);
      }
    }

    // Send SMS as fallback or primary
    if (smsSender) {
      console.log(`📡 [MobileService] Attempting Twilio SMS to ${normalizedPhone}`);
      try {
        const message = await client.messages.create({
          body: messageText,
          from: smsSender,
          to: normalizedPhone
        });
        console.log('✅ [MobileService] SMS alert dispatched via Twilio:', message.sid);
        return { success: true, type: 'sms', sid: message.sid };
      } catch (err) {
        console.error('❌ [MobileService] Twilio SMS failed:', err.message);
      }
    }
  }

  // 2. Generic HTTP Webhook Fallback
  // If you are using a third-party WhatsApp gateway, you can specify WEBHOOK_MOBILE_ALERT in Vercel settings!
  const customWebhook = process.env.WEBHOOK_MOBILE_ALERT;
  if (customWebhook) {
    console.log(`📡 [MobileService] Attempting custom webhook mobile alert to ${normalizedPhone}`);
    try {
      const response = await fetch(customWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: name,
          message: messageText,
          plan: planName,
          expiry: expiryStr
        })
      });
      if (response.ok) {
        console.log('✅ [MobileService] Custom webhook mobile alert success!');
        return { success: true, type: 'webhook' };
      }
    } catch (e) {
      console.error('❌ [MobileService] Custom webhook failed:', e.message);
    }
  }

  console.log(`ℹ️ [MobileService] Twilio/Custom Gateway not configured. Text content prepared:\n---\n${messageText}\n---`);
  return { success: false, message: 'Gateways not configured' };
};
