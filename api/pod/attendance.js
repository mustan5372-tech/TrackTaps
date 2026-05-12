export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Token ')) {
    console.log('[Pod Attendance] Missing or invalid auth header:', authHeader);
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const { classroom } = req.query;
  if (!classroom) {
    console.log('[Pod Attendance] Missing classroom parameter');
    return res.status(400).json({ error: 'Classroom token required' });
  }

  try {
    console.log(`[Pod Attendance] Fetching attendance for classroom: ${classroom}`);
    console.log(`[Pod Attendance] Auth header: ${authHeader.substring(0, 20)}...`);

    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-College-Id': 'kiNdHC',
      'Origin': 'https://medicaps.pod.ai',
      'Referer': 'https://medicaps.pod.ai/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const apiUrl = `https://api.pod.ai/v4/api/classrooms/classroom/${classroom}/student-stats/?subdomain=medicaps`;
    console.log('[Pod Attendance] Calling Pod.ai API:', apiUrl);
    const statsRes = await fetch(
      apiUrl,
      { headers }
    );

    console.log('[Pod Attendance] Pod.ai response status:', statsRes.status);
    console.log('[Pod Attendance] Pod.ai response headers:', Object.fromEntries(statsRes.headers));

    // Check content type
    const contentType = statsRes.headers.get('content-type');
    console.log('[Pod Attendance] Response content-type:', contentType);

    if (!statsRes.ok) {
      let errorData = {};
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await statsRes.json();
        } else {
          const text = await statsRes.text();
          console.error('[Pod Attendance] Non-JSON error response:', text.substring(0, 200));
          errorData = { detail: 'Pod.ai API returned an error' };
        }
      } catch (e) {
        console.error('[Pod Attendance] Error parsing error response:', e.message);
      }
      
      console.error(`[Pod Attendance] Failed to fetch attendance:`, statsRes.status, errorData);
      return res.status(statsRes.status).json({
        error: errorData.detail || errorData.error || 'Failed to fetch attendance from Pod.ai'
      });
    }

    let stats;
    try {
      if (contentType && contentType.includes('application/json')) {
        stats = await statsRes.json();
      } else {
        console.error('[Pod Attendance] Response is not JSON:', contentType);
        return res.status(500).json({ error: 'Pod.ai API returned non-JSON response' });
      }
    } catch (e) {
      console.error('[Pod Attendance] Error parsing JSON response:', e.message);
      return res.status(500).json({ error: 'Failed to parse Pod.ai response' });
    }

    console.log(`[Pod Attendance] Attendance stats received:`, stats);

    const classAttendance = stats?.class_attendance_stats || {};
    const total = classAttendance.total || 0;
    const attended = classAttendance.attended || 0;
    const averagePercent = classAttendance.average_percent || (total > 0 ? (attended / total) * 100 : 0);

    const response = {
      success: true,
      total,
      attended,
      averagePercent: Math.round(averagePercent * 100) / 100,
      missed: total - attended
    };

    console.log('[Pod Attendance] Returning response:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('[Pod Attendance] Error:', error.message, error.stack);
    return res.status(500).json({ error: error.message || 'Failed to fetch attendance' });
  }
}
