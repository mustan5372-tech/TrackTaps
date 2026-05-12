# 📧 TrackTaps Email Setup Guide

To enable direct email sending from your website (without exposing your email address or opening the user's email app), follow these 2 simple steps:

### 1. Get a Free API Key
1. Go to [Resend.com](https://resend.com) and sign up for a free account.
2. Go to **API Keys** and create a new key.
3. Copy that key (it looks like `re_123...`).

### 2. Add to Vercel (Production)
1. Go to your **Vercel Dashboard**.
2. Select your **TrackTaps** project.
3. Go to **Settings** > **Environment Variables**.
4. Add a new variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: `(Paste your key here)`
5. Click **Save**.
6. **Redeploy** your app (or trigger a new build) for the changes to take effect.

---

### How it works now:
- The website sends data to `/api/contact` (Secure Backend).
- The backend uses your `RESEND_API_KEY` to send the mail to `tracktaps@gmail.com`.
- **Privacy**: The user never sees your email address in the code.
- **Direct**: The user just clicks "Send" and it's done instantly.

*Note: For local testing, you can also add this key to your `.env.local` file.*
