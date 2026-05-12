/**
 * Serverless API handler for contact form submissions
 * Sends emails via Resend API
 * Deploy to Vercel
 */

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
    const { name, email, subject, category, message, timestamp } = req.body;

    console.log('📧 Contact form submission received:', { name, email, subject, category });

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.warn('❌ Missing required fields:', { name, email, subject, message });
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

    // Check if Resend API key is available
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactReceiverEmail = process.env.CONTACT_RECEIVER_EMAIL || 'tracktaps@gmail.com';
    
    console.log('🔍 Environment check:', {
      hasApiKey: !!resendApiKey,
      apiKeyPreview: resendApiKey ? resendApiKey.substring(0, 10) + '...' : 'MISSING',
      receiverEmail: contactReceiverEmail
    });
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured in environment variables');
      return res.status(500).json({ 
        success: false,
        message: 'Email service not configured. Please contact administrator.' 
      });
    }

    // Format the email content
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
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        border-bottom: 3px solid #8b5cf6;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        margin: 0;
        color: #8b5cf6;
        font-size: 24px;
      }
      .header p {
        margin: 5px 0 0 0;
        color: #666;
        font-size: 14px;
      }
      .field {
        margin-bottom: 20px;
      }
      .field-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 5px;
        display: block;
      }
      .field-value {
        background: #f9f9f9;
        padding: 12px;
        border-left: 3px solid #8b5cf6;
        border-radius: 4px;
        color: #555;
      }
      .category-badge {
        display: inline-block;
        background: #8b5cf6;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }
      .message-box {
        background: #f0f4ff;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #8b5cf6;
        margin: 20px 0;
      }
      .footer {
        border-top: 1px solid #eee;
        padding-top: 20px;
        margin-top: 30px;
        font-size: 12px;
        color: #999;
      }
      .timestamp {
        color: #999;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📬 New Contact Form Submission</h1>
        <p>From TrackTaps Contact Form</p>
      </div>

      <div class="field">
        <span class="field-label">👤 Sender Name</span>
        <div class="field-value">${escapeHtml(name)}</div>
      </div>

      <div class="field">
        <span class="field-label">📧 Email Address</span>
        <div class="field-value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
      </div>

      <div class="field">
        <span class="field-label">📝 Subject</span>
        <div class="field-value">${escapeHtml(subject)}</div>
      </div>

      <div class="field">
        <span class="field-label">🏷️ Category</span>
        <div class="field-value">
          <span class="category-badge">${getCategoryEmoji(category)} ${getCategoryLabel(category)}</span>
        </div>
      </div>

      <div class="message-box">
        <strong>💬 Message:</strong>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(message)}</p>
      </div>

      <div class="footer">
        <p class="timestamp">⏰ Submitted: ${new Date(timestamp).toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          timeZoneName: 'short'
        })}</p>
        <p>This is an automated email from TrackTaps Contact Form. Please reply to ${escapeHtml(email)} to respond to the sender.</p>
      </div>
    </div>
  </body>
</html>
    `;

    // Send email via Resend API
    try {
      console.log('📤 Sending email via Resend API...');
      
      const emailPayload = {
        from: 'onboarding@resend.dev',
        to: contactReceiverEmail,
        replyTo: email,
        subject: `[${getCategoryLabel(category)}] ${subject}`,
        html: emailContent,
      };

      console.log('📋 Email payload:', {
        from: emailPayload.from,
        to: emailPayload.to,
        replyTo: emailPayload.replyTo,
        subject: emailPayload.subject
      });

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const responseText = await resendResponse.text();
      console.log('📨 Resend response status:', resendResponse.status);
      console.log('📨 Resend response body:', responseText);

      let resendData;
      try {
        resendData = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse Resend response:', responseText);
        return res.status(500).json({ 
          success: false,
          message: 'Email service error. Please try again later.',
          error: 'Invalid response from email service'
        });
      }

      if (!resendResponse.ok) {
        console.error('❌ Resend API error:', resendData);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to send email. Please try again later.',
          error: resendData.message || resendData.error || 'Email service error'
        });
      }

      console.log('✅ Email sent successfully via Resend:', resendData.id);

      return res.status(200).json({ 
        success: true,
        message: 'Email sent successfully',
        id: resendData.id 
      });

    } catch (resendError) {
      console.error('❌ Resend API request failed:', resendError);
      console.error('❌ Error message:', resendError.message);
      console.error('❌ Error stack:', resendError.stack);
      
      return res.status(500).json({ 
        success: false,
        message: 'Email service temporarily unavailable. Please try again later.',
        error: resendError.message
      });
    }

  } catch (error) {
    console.error('❌ Contact API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error. Please try again later.',
      error: error.message 
    });
  }
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category) {
  const emojis = {
    'support': '🆘',
    'bug': '🐛',
    'feature': '✨',
    'feedback': '💬'
  };
  return emojis[category] || '📬';
}

/**
 * Get category label
 */
function getCategoryLabel(category) {
  const labels = {
    'support': 'Support',
    'bug': 'Bug Report',
    'feature': 'Feature Request',
    'feedback': 'Feedback'
  };
  return labels[category] || 'General';
}
