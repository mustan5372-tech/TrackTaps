/**
 * Email Service for TrackTaps
 * Sends transactional emails via Resend API
 */

/**
 * Send a welcome email to new premium users
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {object} subscription - Subscription details
 */
export const sendPremiumWelcomeEmail = async (email, name, subscription) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('❌ [EmailService] RESEND_API_KEY not configured');
    return { success: false, error: 'Config missing' };
  }

  const planName = subscription.planType === 'yearly' ? 'Mega Saver (Yearly)' : 
                   subscription.planType === 'half_yearly' ? 'Super Saver (6-Month)' : 'Starter (Monthly)';

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to TrackTaps Premium</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .button { display: inline-block; padding: 14px 28px; background: #8b5cf6; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 20px 0; }
    .feature-list { list-style: none; padding: 0; margin: 20px 0; }
    .feature-item { display: flex; align-items: center; margin-bottom: 12px; font-size: 15px; }
    .feature-icon { margin-right: 12px; font-size: 18px; }
    .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 30px; }
    .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .receipt-label { color: #64748b; }
    .receipt-value { font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 28px; letter-spacing: -0.02em;">TrackTaps <span style="font-weight: 300;">Plus</span></h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your academic superpower is now active.</p>
    </div>
    
    <div class="content">
      <h2 style="font-size: 22px; margin-top: 0;">Hi ${name || 'there'}!</h2>
      <p>Great news! Your <strong>TrackTaps Premium</strong> plan has been successfully activated. You've officially upgraded to a smarter way of managing your attendance.</p>
      
      <div style="text-align: center;">
        <a href="https://tracktaps.online" class="button">Go to Dashboard</a>
      </div>

      <h3 style="font-size: 18px; margin-top: 30px;">What's new in your toolkit:</h3>
      <ul class="feature-list">
        <li class="feature-item"><span class="feature-icon">⚡</span> <strong>Automated Pod.ai Sync</strong> — No more manual entries.</li>
        <li class="feature-item"><span class="feature-icon">🏖️</span> <strong>Smart Bunk Calculator</strong> — Know exactly when you can relax.</li>
        <li class="feature-item"><span class="feature-icon">🎨</span> <strong>Premium Themes</strong> — AMOLED, Cyberpunk, and more.</li>
        <li class="feature-item"><span class="feature-icon">📊</span> <strong>Advanced Insights</strong> — Semester progress & predictions.</li>
      </ul>

      <div class="receipt-box">
        <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 12px; letter-spacing: 0.05em;">Subscription Details</div>
        <div class="receipt-row">
          <span class="receipt-label">Plan</span>
          <span class="receipt-value">${planName}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Status</span>
          <span class="receipt-value" style="color: #10b981;">Active</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Expiry Date</span>
          <span class="receipt-value">${new Date(subscription.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Amount Paid</span>
          <span class="receipt-value">₹${subscription.amountPaid}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin-bottom: 10px;">TrackTaps — Built for students, by students.</p>
      <p>&copy; 2026 TrackTaps. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrackTaps <onboarding@resend.dev>', // Use verified domain if you have one
        to: email,
        subject: '🚀 TrackTaps Premium Activated!',
        html: emailContent,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ [EmailService] Welcome email sent successfully:', data.id);
      return { success: true, id: data.id };
    } else {
      console.error('❌ [EmailService] Resend API error:', data);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ [EmailService] Network error:', error);
    return { success: false, error: error.message };
  }
};
