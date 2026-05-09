import { parseCookies, podFetch } from './_common.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.pod_token;
  const collegeId = cookies.pod_college_id || 'kiNdHC';

  if (!token) {
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  try {
    console.log(`[Pod.ai Subjects] Discovery for community ${collegeId}...`);
    
    const [learningRaw, classroomsRaw] = await Promise.all([
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/learning/`, {}, token, req.headers.cookie).catch(() => ({ results: [] })),
      podFetch('https://api.pod.ai/v4/api/classrooms/index-list/?class_group_type=1', {}, token, req.headers.cookie).catch(() => ({ results: [] }))
    ]);

    const rawItems = [
      ...(Array.isArray(learningRaw) ? learningRaw : (learningRaw.results || [])),
      ...(Array.isArray(classroomsRaw) ? classroomsRaw : (classroomsRaw.results || []))
    ];

    const subjectMap = new Map();
    rawItems.forEach(item => {
      const name = item.name || item.course_name || item.subject_name || item.title || item.course?.name;
      if (!name) return;

      const key = name.toLowerCase().trim();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          id: item.id || item.token || item.course?.id || Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          code: item.code || item.course_code || item.subject_code || '',
          type: item.type || 'Lecture',
          faculty: item.faculty_name || item.teacher || item.instructor || item.faculty?.name || ''
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: Array.from(subjectMap.values())
    });
  } catch (error) {
    console.error('[Pod.ai Subjects] Error:', error.message);
    return res.status(error.message === 'SESSION_EXPIRED' ? 401 : 500).json({ 
      error: error.message 
    });
  }
}
