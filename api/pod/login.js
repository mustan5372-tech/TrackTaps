import { createPodClient } from './_common.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const { client, jar } = createPodClient();
    
    const response = await client.post('https://api.pod.ai/v4/api/accounts/login/?subdomain=medicaps', {
      username,
      password
    });

    const data = response.data;

    if (!data.auth_token) {
      return res.status(500).json({ error: 'Authentication token not found in response' });
    }

    // Try to find community ID
    const collegeId = data.user?.community?.token || data.user?.community_id || data.community?.token || 'kiNdHC';
    const collegeName = data.user?.community?.name || data.community?.name || 'Medi-Caps University';

    // Capture cookies from the jar
    const podaiCookies = jar.getCookiesSync('https://api.pod.ai');
    
    console.log(`[Pod.ai Login] Success for ${username}. College: ${collegeId}. Captured ${podaiCookies.length} cookies.`);

    const isProd = process.env.NODE_ENV === 'production';
    const cookiesToSet = [];

    // 1. Our primary auth token and college ID cookies
    cookiesToSet.push(`pod_token=${data.auth_token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict${isProd ? '; Secure' : ''}`);
    cookiesToSet.push(`pod_college_id=${collegeId}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict${isProd ? '; Secure' : ''}`);

    // 2. Proxy Pod.ai cookies
    podaiCookies.forEach(cookie => {
      const sanitized = `pod_${cookie.key}=${cookie.value}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${isProd ? '; Secure' : ''}`;
      cookiesToSet.push(sanitized);
    });

    res.setHeader('Set-Cookie', cookiesToSet);

    return res.status(200).json({
      success: true,
      user: {
        name: data.user?.name,
        email: data.user?.email,
        college: collegeName,
        collegeId: collegeId
      }
    });
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      console.error('[Pod.ai Login] Error:', data);
      return res.status(error.response.status).json({ 
        error: data?.message || data?.error || 'Authentication failed' 
      });
    }
    console.error('[Pod.ai Login] System Error:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
