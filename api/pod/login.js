export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    console.log(`[TrackTaps Pod] Login attempt for ${username}`);

    const response = await fetch('https://api.pod.ai/v4/api/accounts/login/?subdomain=medicaps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://pod.ai',
        'Referer': 'https://pod.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[TrackTaps Pod] Login failed:`, errorData);
      return res.status(response.status).json({
        error: errorData.message || errorData.error || 'Login failed'
      });
    }

    const data = await response.json();
    
    if (!data.auth_token) {
      return res.status(500).json({ error: 'No auth token in response' });
    }

    console.log(`[TrackTaps Pod] Login successful for ${username}`);

    return res.status(200).json({
      success: true,
      auth_token: data.auth_token,
      user: {
        name: data.user?.name,
        email: data.user?.email,
      }
    });
  } catch (error) {
    console.error('[TrackTaps Pod Login] Error:', error.message);
    return res.status(500).json({
      error: error.message || 'Login failed'
    });
  }
}
