import { parseCookies, podFetch } from './_common.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.pod_token;
  const collegeId = cookies.pod_college_id || 'kiNdHC'; 

  if (!token) {
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  try {
    console.log(`[Pod.ai Sync] Critical Discovery for community ${collegeId}...`);

    // 1. Exhaustive Fetch from all known Pod.ai student data endpoints
    const fetchPromises = [
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'attendance_v1' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/attendance/student/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'attendance_student' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/learning/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'learning' })),
      podFetch('https://api.pod.ai/v4/api/classrooms/index-list/?class_group_type=1', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'classrooms_v1' })),
      podFetch('https://api.pod.ai/v4/api/classrooms/student-attendance/index-list/', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'classrooms_attendance' })),
      podFetch(`https://api.pod.ai/v4/api/community/${collegeId}/community-user-counts/`, {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'stats' })),
      podFetch('https://api.pod.ai/v4/api/classrooms/student-timetable/', {}, token, req.headers.cookie).catch(e => ({ error: e.message, type: 'timetable' }))
    ];

    const results = await Promise.all(fetchPromises);
    
    const [
      attendanceRaw, 
      attendanceStudentRaw, 
      learningRaw, 
      classroomsRaw, 
      classroomsAttendanceRaw, 
      statsRaw, 
      timetableRaw
    ] = results;

    // Discovery Debugging - help identify which endpoint actually has the data
    const debugInfo = {
      endpoints: results.map((r, i) => ({
        type: r.type || 'unknown',
        success: !r.error,
        keys: !r.error ? Object.keys(r) : [],
        count: !r.error ? (Array.isArray(r) ? r.length : (r.results ? r.results.length : 1)) : 0
      }))
    };

    console.log('[Pod.ai Sync] Discovery Debug:', JSON.stringify(debugInfo));

    // 2. Extract All Potential Records
    const rawItems = [
      ...(Array.isArray(attendanceRaw) ? attendanceRaw : (attendanceRaw.results || [])),
      ...(Array.isArray(attendanceStudentRaw) ? attendanceStudentRaw : (attendanceStudentRaw.results || [])),
      ...(Array.isArray(learningRaw) ? learningRaw : (learningRaw.results || [])),
      ...(Array.isArray(classroomsRaw) ? classroomsRaw : (classroomsRaw.results || [])),
      ...(Array.isArray(classroomsAttendanceRaw) ? classroomsAttendanceRaw : (classroomsAttendanceRaw.results || []))
    ];

    // 3. Ultra-Aggressive Field Mapping
    const attendanceMap = new Map();

    rawItems.forEach((item, idx) => {
      // Find a subject name (check every possible field variant)
      const name = item.course_name || item.subject_name || item.name || item.title || item.course?.name || item.subject?.name || item.learning_group?.name;
      if (!name || name === 'Unknown') return;

      // Extract attendance metrics (check every possible field variant)
      const attended = parseInt(
        item.attended_classes ?? 
        item.present ?? 
        item.present_count ?? 
        item.attended_count ?? 
        item.attended ?? 
        item.present_classes ?? 
        item.attendance?.present_count ?? 
        item.attendance_count ?? 
        item.total_present ?? 
        0
      );

      const total = parseInt(
        item.total_classes ?? 
        item.total_lectures ?? 
        item.total_count ?? 
        item.total ?? 
        item.attendance?.total_count ?? 
        item.total_attendance ?? 
        item.sessions ?? 
        0
      );

      const percentage = parseFloat(
        item.attendance_percentage ?? 
        item.percentage ?? 
        item.avg_attendance ?? 
        item.attendance?.percentage ?? 
        item.current_attendance ?? 
        (total > 0 ? (attended / total) * 100 : 0)
      );

      const code = item.course_code || item.code || item.subject_code || item.course?.code || '';
      const faculty = item.faculty_name || item.teacher || item.instructor || item.faculty?.name || item.faculty?.full_name || '';

      const key = name.toLowerCase().trim();
      const existing = attendanceMap.get(key);
      
      // Keep the record that has the most data (highest total classes)
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

    // 4. Timetable Extraction
    const timetable = [];
    if (!timetableRaw.error) {
      const slots = Array.isArray(timetableRaw) ? timetableRaw : (timetableRaw.results || []);
      slots.forEach(slot => {
        const dayMap = { 'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6 };
        const dayIndex = dayMap[(slot.day || '').toLowerCase()];
        if (dayIndex !== undefined) {
          timetable.push({
            id: slot.id || Math.random().toString(36).substr(2, 9),
            dayIndex,
            subject: slot.course_name || slot.subject_name || slot.name || 'Unknown',
            startTime: slot.start_time || '09:00',
            endTime: slot.end_time || '10:00',
            room: slot.room_number || slot.location || slot.place || '',
            teacher: slot.faculty_name || slot.teacher || ''
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: statsRaw.error ? {} : statsRaw,
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
