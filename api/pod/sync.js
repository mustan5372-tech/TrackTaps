import { parseCookies, podFetch } from './_common.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.pod_token;
  const collegeId = cookies.pod_college_id || 'kiNdHC'; 

  if (!token) {
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  try {
    console.log(`[Pod.ai Sync] Deep Discovery for community ${collegeId}...`);

    // 1. Exhaustive Fetch from all known and suspected Pod.ai student data endpoints
    const fetchPromises = [
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'attendance_v1' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/student/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'attendance_student' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/learning/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'learning' })),
      podFetch('https://api.pod.ai/v4/api/classrooms/index-list/?class_group_type=1', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'classrooms_v1' })),
      podFetch('https://api.pod.ai/v4/api/classrooms/student-attendance/index-list/', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'classrooms_attendance' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/community-user-counts/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'stats' })),
      podFetch('https://api.pod.ai/v4/api/classrooms/student-timetable/', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'timetable' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/student/v2/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'attendance_v2' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/classroom-attendance/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'classroom_attendance_alt' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/community-student-v2/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'student_v2' })),
      podFetch('https://api.pod.ai/v4/api/student/dashboard/', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'dashboard' }))
    ];

    const results = await Promise.all(fetchPromises);
    
    // Server-side Log of Raw Responses (for debugging via Vercel logs)
    results.forEach(r => {
      if (!r.error) {
        console.log(`[Pod.ai RAW] Type: ${r.type}, Keys: ${Object.keys(r).join(', ')}`);
        // Log a snippet of the data if it's small enough
        const snippet = JSON.stringify(r).substring(0, 200);
        console.log(`[Pod.ai RAW] Data Snippet: ${snippet}`);
      }
    });

    const debugInfo = {
      endpoints: results.map((r) => ({
        type: r.type || 'unknown',
        success: !r.error,
        keys: !r.error ? Object.keys(r) : [],
        count: !r.error ? (Array.isArray(r) ? r.length : (r.results ? r.results.length : (r.data ? (Array.isArray(r.data) ? r.data.length : 1) : 1))) : 0
      }))
    };

    // 2. Extract All Potential Records using Ultra-Permissive flattening
    const rawItems = [];
    results.forEach(r => {
      if (r.error) return;
      
      // Flatten arrays from results, data, or top-level
      const items = Array.isArray(r) ? r : (r.results || r.data || r.learning_objects || r.attendance_list || []);
      if (Array.isArray(items)) {
        items.forEach(item => {
          item._source_type = r.type;
          rawItems.push(item);
        });
      } else if (typeof items === 'object' && items !== null) {
        // Handle single object responses that might contain list-like keys
        Object.keys(items).forEach(key => {
          if (Array.isArray(items[key]) && items[key].length > 0) {
            items[key].forEach(subItem => {
              subItem._source_type = `${r.type}_${key}`;
              rawItems.push(subItem);
            });
          }
        });
      }
    });

    // 3. Ultra-Aggressive Field Mapping
    const attendanceMap = new Map();

    rawItems.forEach((item, idx) => {
      // Find a subject name (exhaustive search)
      const name = 
        item.course_name || 
        item.subject_name || 
        item.name || 
        item.title || 
        item.label ||
        item.course?.name || 
        item.subject?.name || 
        item.learning_group?.name ||
        item.learning_object?.name ||
        item.classroom?.name;

      if (!name || name === 'Unknown') return;

      // Extract attendance metrics (exhaustive search)
      const attended = parseInt(
        item.attended_classes ?? 
        item.present ?? 
        item.present_count ?? 
        item.attended_count ?? 
        item.attended ?? 
        item.present_classes ?? 
        item.attendance?.present_count ?? 
        item.attendance?.attended ??
        item.attendance_count ?? 
        item.total_present ?? 
        item.stats?.present ??
        0
      );

      const total = parseInt(
        item.total_classes ?? 
        item.total_lectures ?? 
        item.total_count ?? 
        item.total ?? 
        item.attendance?.total_count ?? 
        item.attendance?.total ??
        item.total_attendance ?? 
        item.sessions ?? 
        item.stats?.total ??
        0
      );

      const percentage = parseFloat(
        item.attendance_percentage ?? 
        item.percentage ?? 
        item.avg_attendance ?? 
        item.attendance?.percentage ?? 
        item.current_attendance ?? 
        item.stats?.percentage ??
        (total > 0 ? (attended / total) * 100 : 0)
      );

      const code = item.course_code || item.code || item.subject_code || item.course?.code || '';
      const faculty = item.faculty_name || item.teacher || item.instructor || item.faculty?.name || item.faculty?.full_name || '';

      const key = name.toLowerCase().trim();
      const existing = attendanceMap.get(key);
      
      // Prefer record with more data or more specific source
      if (!existing || (total >= existing.total && total > 0)) {
        attendanceMap.set(key, {
          id: item.id || item.token || item.course?.id || `ext_${idx}`,
          name: name.trim(),
          code,
          attended,
          total,
          percentage,
          faculty
        });
      }
    });

    const finalAttendance = Array.from(attendanceMap.values());

    // 4. Timetable Extraction (Same aggressive logic)
    const timetable = [];
    results.forEach(r => {
      if (r.type === 'timetable' && !r.error) {
        const slots = Array.isArray(r) ? r : (r.results || r.data || []);
        slots.forEach(slot => {
          const dayMap = { 'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6 };
          const dayStr = (slot.day || slot.weekday || '').toLowerCase();
          const dayIndex = dayMap[dayStr];
          if (dayIndex !== undefined) {
            timetable.push({
              id: slot.id || Math.random().toString(36).substr(2, 9),
              dayIndex,
              subject: slot.course_name || slot.subject_name || slot.name || slot.title || 'Unknown',
              startTime: slot.start_time || slot.start || '09:00',
              endTime: slot.end_time || slot.end || '10:00',
              room: slot.room_number || slot.location || slot.place || slot.room || '',
              teacher: slot.faculty_name || slot.teacher || slot.instructor || ''
            });
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: results.find(r => r.type === 'stats' && !r.error) || {},
        attendance: finalAttendance,
        subjects: finalAttendance,
        timetable: timetable,
        debug: debugInfo,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Pod.ai Sync] Fatal Discovery Error:', error);
    return res.status(error.message === 'SESSION_EXPIRED' ? 401 : 500).json({ 
      error: 'Sync failed: ' + error.message 
    });
  }
}
