export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    console.log('[TrackTaps Pod] Fetching classrooms');

    // Try primary endpoint with subdomain
    const apiUrl = 'https://api.pod.ai/v4/api/classrooms/index-list/?class_group_type=1&subdomain=medicaps';
    
    console.log('[DEBUG POD] Classroom Fetch Request:', apiUrl);

    const fetchPod = async (url) => {
      return await fetch(url, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-College-Id': 'kiNdHC',
          'Origin': 'https://medicaps.pod.ai',
          'Referer': 'https://medicaps.pod.ai/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
    };

    let classroomsRes = await fetchPod(apiUrl);
    let responseText = await classroomsRes.text();
    let status = classroomsRes.status;
    let contentType = classroomsRes.headers.get('content-type') || '';

    console.log(`[DEBUG POD] Primary Response: ${status}, ${contentType}`);

    // Fallback if primary fails or returns HTML
    if (!classroomsRes.ok || !contentType.includes('application/json')) {
      console.log('[DEBUG POD] Primary failed, trying fallback endpoint...');
      const fallbackUrl = 'https://api.pod.ai/v4/api/classrooms/?subdomain=medicaps';
      classroomsRes = await fetchPod(fallbackUrl);
      status = classroomsRes.status;
      contentType = classroomsRes.headers.get('content-type') || '';
      responseText = await classroomsRes.text();
      console.log(`[DEBUG POD] Fallback Response: ${status}, ${contentType}`);
    }

    if (!classroomsRes.ok) {
      return res.status(status).json({
        success: false,
        error: `Pod.ai Error (${status})`,
        details: responseText.substring(0, 200)
      });
    }

    if (!contentType.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Pod.ai returned non-JSON response.',
        details: responseText.substring(0, 200)
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse JSON response' });
    }

    // Parse results flexibly
    const results = Array.isArray(data) ? data : (data.results || []);
    const classrooms = results.map(c => ({
      token: c.token,
      title: c.title || c.name || 'Untitled',
      creatorDetails: c.creator_details ? { name: c.creator_details.name } : undefined
    }));

    console.log(`[DEBUG POD] Success: Found ${classrooms.length} classrooms`);
    return res.status(200).json({ success: true, classrooms });
  } catch (error) {
    console.error('[TrackTaps Pod] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
