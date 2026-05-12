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

    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'X-College-Id': 'kiNdHC',
      'Origin': 'https://pod.ai',
      'Referer': 'https://pod.ai/',
    };

    const classroomsRes = await fetch('https://api.pod.ai/v4/api/classrooms/index-list/?class_group_type=1', {
      headers
    });

    console.log('[TrackTaps Pod] Classrooms response status:', classroomsRes.status);

    if (!classroomsRes.ok) {
      const contentType = classroomsRes.headers.get('content-type');
      let errorData = {};
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await classroomsRes.json();
        } else {
          const text = await classroomsRes.text();
          console.error('[TrackTaps Pod] Non-JSON error response:', text.substring(0, 200));
        }
      } catch (e) {
        console.error('[TrackTaps Pod] Error parsing error response:', e.message);
      }
      
      console.error('[TrackTaps Pod] Failed to fetch classrooms:', classroomsRes.status, errorData);
      return res.status(classroomsRes.status).json({
        error: errorData.detail || errorData.error || 'Failed to fetch classrooms'
      });
    }

    const contentType = classroomsRes.headers.get('content-type');
    let data;
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await classroomsRes.json();
      } else {
        console.error('[TrackTaps Pod] Response is not JSON:', contentType);
        return res.status(500).json({ error: 'Pod.ai API returned non-JSON response' });
      }
    } catch (e) {
      console.error('[TrackTaps Pod] Error parsing JSON response:', e.message);
      return res.status(500).json({ error: 'Failed to parse Pod.ai response' });
    }

    const classrooms = (data.results || []).map(c => ({
      token: c.token,
      title: c.title || c.name || 'Untitled',
      creatorDetails: c.creator_details ? { name: c.creator_details.name } : undefined
    }));

    return res.status(200).json({ success: true, classrooms });
  } catch (error) {
    console.error('[TrackTaps Pod] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
