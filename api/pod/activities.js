import { parseCookies, podFetch } from './_common.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.pod_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated with Pod.ai' });
  }

  const { status = 'in_progress' } = req.query;

  try {
    const baseUrl = 'https://api.pod.ai/v4/api/classrooms/student-activity/assessments/index-list/';
    const url = `${baseUrl}?activity_status=${status}&class_group_type=1&include_status_stats=true&page=1`;
    
    const data = await podFetch(url, {}, token, req.headers.cookie);
    
    return res.status(200).json({
      success: true,
      data: data.results || [],
      pagination: data.pagination || {}
    });
  } catch (error) {
    console.error('Activities fetch error:', error);
    return res.status(error.message.includes('Session') ? 401 : 500).json({ 
      error: error.message 
    });
  }
}
