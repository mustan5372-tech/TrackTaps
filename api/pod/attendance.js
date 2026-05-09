import { parseCookies, podFetch } from './_common.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.pod_token;
  const collegeId = cookies.pod_college_id || 'kiNdHC';

  if (!token) {
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  try {
    console.log(`[Pod.ai Attendance] Exhaustive search for community ${collegeId}...`);
    
    // Try all possible endpoints where attendance or course stats might hide
    const [primaryRaw, studentRaw, learningRaw, classroomsRaw] = await Promise.all([
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/`, {}, token, req.headers.cookie).catch(() => ({ results: [] })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/student/`, {}, token, req.headers.cookie).catch(() => ({ results: [] })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/learning/`, {}, token, req.headers.cookie).catch(() => ({ results: [] })),
      podFetch('https://api.pod.ai/v4/api/classrooms/index-list/?class_group_type=1', {}, token, req.headers.cookie).catch(() => ({ results: [] }))
    ]);

    const rawItems = [
      ...(Array.isArray(primaryRaw) ? primaryRaw : (primaryRaw.results || [])),
      ...(Array.isArray(studentRaw) ? studentRaw : (studentRaw.results || [])),
      ...(Array.isArray(learningRaw) ? learningRaw : (learningRaw.results || [])),
      ...(Array.isArray(classroomsRaw) ? classroomsRaw : (classroomsRaw.results || []))
    ];

    console.log(`[Pod.ai Attendance] Collected ${rawItems.length} potential records.`);
    
    const attendanceMap = new Map();

    rawItems.forEach((item, idx) => {
      const name = item.course_name || item.subject_name || item.name || item.title || item.course?.name;
      if (!name) return;

      const attended = parseInt(item.present_count ?? item.attended_count ?? item.attended ?? item.present_classes ?? item.attendance?.present_count ?? 0);
      const total = parseInt(item.total_count ?? item.total_lectures ?? item.total ?? item.total_classes ?? item.attendance?.total_count ?? 0);
      const percentage = parseFloat(item.percentage ?? item.attendance_percentage ?? item.avg_attendance ?? item.attendance?.percentage ?? (total > 0 ? (attended / total) * 100 : 0));

      // Skip if it has no data and we already have a better one
      const key = name.toLowerCase().trim();
      if (!attendanceMap.has(key) || (total >= attendanceMap.get(key).total && total > 0)) {
        attendanceMap.set(key, {
          id: item.id || item.token || item.course?.id || `att_${idx}`,
          name: name.trim(),
          code: item.course_code || item.code || item.subject_code || '',
          attended,
          total,
          percentage,
          faculty: item.faculty_name || item.teacher || item.instructor || item.faculty?.name || ''
        });
      }
    });

    return res.status(200).json({ 
      success: true,
      data: Array.from(attendanceMap.values()) 
    });
  } catch (error) {
    console.error('[Pod.ai Attendance] Error:', error.message);
    return res.status(error.message === 'SESSION_EXPIRED' ? 401 : 500).json({ 
      error: error.message 
    });
  }
}
