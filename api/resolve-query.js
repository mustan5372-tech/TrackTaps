import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { name, email, trackingId } = req.body;

    console.log('📬 Query resolution email request received:', { name, email, trackingId });

    // Validate required fields
    if (!name || !email || !trackingId) {
      console.warn('❌ Missing required fields for resolution:', { name, email, trackingId });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('❌ Invalid email format:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email address' 
      });
    }

    // Check if Email credentials are available
    const resendApiKey = process.env.RESEND_API_KEY;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const contactReceiverEmail = process.env.CONTACT_RECEIVER_EMAIL || 'tracktaps@gmail.com';

    if (!resendApiKey && !gmailAppPassword) {
      console.error('❌ Neither RESEND_API_KEY nor GMAIL_APP_PASSWORD configured in environment variables');
      return res.status(500).json({ 
        success: false,
        message: 'Email service not configured.' 
      });
    }

    // Format HTML email content
    const emailContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      .header {
        border-bottom: 2px solid #8b5cf6;
        padding-bottom: 20px;
        margin-bottom: 20px;
        text-align: center;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #8b5cf6;
        letter-spacing: 0.5px;
      }
      .title {
        font-size: 20px;
        color: #111;
        margin-top: 10px;
        font-weight: 700;
      }
      .content {
        margin-bottom: 30px;
        color: #4b5563;
      }
      .tid-box {
        background: #ecfdf5;
        border-left: 4px solid #10b981;
        padding: 16px;
        margin: 24px 0;
        font-family: monospace;
        font-size: 16px;
        color: #065f46;
        border-radius: 0 8px 8px 0;
      }
      .footer {
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
        border-top: 1px solid #f3f4f6;
        padding-top: 20px;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">TrackTaps Support</div>
        <div class="title">Query Resolved Successfully</div>
      </div>
      <div class="content">
        <p>Hello <strong>${name}</strong>,</p>
        <p>We are writing to inform you that your support query has been successfully resolved by our administration team.</p>
        <div class="tid-box">
          <strong>Tracking ID (T.ID):</strong> ${trackingId}
        </div>
        <p>If you have any further questions or if you feel your issue was not fully resolved, feel free to contact us again via the app's Guide Center or reply directly to this email.</p>
        <p>Thank you for using TrackTaps!</p>
      </div>
      <div class="footer">
        <p>This is an automated notification. TrackTaps Attendance Companion.</p>
      </div>
    </div>
  </body>
</html>
    `;

    const gmailUser = process.env.GMAIL_USER || 'tracktaps@gmail.com';

    // 1. SMTP / GMAIL SENDER MODE
    if (gmailAppPassword) {
      console.log(`📧 [ResolveAPI] Attempting to deliver query resolution email via Gmail SMTP to: ${email}`);
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailAppPassword
          }
        });

        const mailOptions = {
          from: `"TrackTaps Support" <${gmailUser}>`,
          to: email,
          subject: `[RESOLVED] Support Query - T.ID: ${trackingId}`,
          html: emailContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [ResolveAPI] Resolution email sent successfully via Gmail SMTP:', info.messageId);
        return res.status(200).json({ 
          success: true,
          message: 'Resolution email sent successfully',
          id: info.messageId 
        });
      } catch (smtpError) {
        console.error('❌ [ResolveAPI] Gmail SMTP transport failed, checking fallback...', smtpError);
      }
    }

    // 2. RESEND API FALLBACK MODE
    try {
      console.log('📤 Sending resolution email via Resend API to:', email);
      
      const emailPayload = {
        from: 'onboarding@resend.dev',
        to: email,
        subject: `[RESOLVED] Support Query - T.ID: ${trackingId}`,
        html: emailContent,
      };

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const resendData = await resendResponse.json();

      if (resendResponse.ok) {
        console.log('✅ [ResolveAPI] Resolution email sent successfully via Resend API:', resendData.id);
        return res.status(200).json({ 
          success: true, 
          message: 'Resolution email sent successfully',
          id: resendData.id 
        });
      } else {
        console.error('❌ [ResolveAPI] Resend API failed:', resendData);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send email via Resend API' 
        });
      }
    } catch (resendError) {
      console.error('❌ [ResolveAPI] Resend API fetch call crashed:', resendError);
      return res.status(500).json({ 
        success: false, 
        message: 'Resend API service error' 
      });
    }

  } catch (error) {
    console.error('❌ [ResolveAPI] Server error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
