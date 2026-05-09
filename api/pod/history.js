import { parseCookies, podFetch } from './_common.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.pod_token;
  const collegeId = cookies.pod_college_id || 'kiNdHC';

  if (!token) {
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  try {
    console.log(`[Pod.ai History] Fetching historical attendance for community ${collegeId}...`);

    // Pod.ai Discovery for Historical Logs
    // We try multiple known patterns for student attendance logs/timeline
    const fetchPromises = [
      // 1. Primary Classroom Logs (Most likely for daily present/absent)
      podFetch('https://api.pod.ai/v4/api/classrooms/student-attendance/index-list/?page_size=200', {}, token, req.headers.cookie)
        .catch(e => ({ error: e.message, type: 'attendance_logs' })),
      
      // 2. Attendance Timeline (Good for daily status)
      podFetch('https://api.pod.ai/v4/api/student/attendance/timeline/', {}, token, req.headers.cookie)
        .catch(e => ({ error: e.message, type: 'attendance_timeline' })),
      
      // 3. Alternative Logs Endpoint
      podFetch('https://api.pod.ai/v4/api/classrooms/student-attendance/attendance-logs/', {}, token, req.headers.cookie)
        .catch(e => ({ error: e.message, type: 'alternate_logs' })),

      // 4. Activity Logs (Sometimes used for attendance)
      podFetch('https://api.pod.ai/v4/api/classrooms/student-activity/attendance/index-list/', {}, token, req.headers.cookie)
        .catch(e => ({ error: e.message, type: 'activity_attendance' }))
    ];

    const results = await Promise.all(fetchPromises);
    const [logsRaw, timelineRaw, altLogsRaw, activityRaw] = results;

    const historicalRecords = [];

    // --- Processing Strategy ---
    
    // Process classrooms/student-attendance/index-list
    if (!logsRaw.error) {
      const items = Array.isArray(logsRaw) ? logsRaw : (logsRaw.results || []);
      items.forEach(item => {
        // Pod.ai fields: date, course_name, attendance_status, is_present, etc.
        const date = item.date || item.attendance_date || item.start_time || item.created_at;
        const subject = item.course_name || item.subject_name || item.name || item.classroom?.course_name || 'Unknown';
        const status = item.attendance_status === 'present' || item.is_present === true || item.status === 'present' ? 'present' : 'absent';
        
        if (date && subject) {
          historicalRecords.push({
            date: new Date(date).toISOString(),
            subject,
            status,
            type: 'classroom_log',
            id: item.id || item.token || `hist_${Math.random().toString(36).substr(2, 9)}`
          });
        }
      });
    }

    // Process attendance/timeline
    if (!timelineRaw.error) {
      const items = Array.isArray(timelineRaw) ? timelineRaw : (timelineRaw.results || []);
      items.forEach(item => {
        const date = item.date || item.day;
        const status = item.status === 'present' || item.is_present === true ? 'present' : 'absent';
        // Timeline often groups by day, might have multiple subjects
        if (item.subjects && Array.isArray(item.subjects)) {
          item.subjects.forEach(sub => {
             historicalRecords.push({
               date: new Date(date).toISOString(),
               subject: sub.name || sub.course_name || 'Unknown',
               status: sub.status || status,
               type: 'timeline_subject',
               id: sub.id || `tl_${Math.random().toString(36).substr(2, 9)}`
             });
          });
        } else if (date) {
           historicalRecords.push({
             date: new Date(date).toISOString(),
             subject: item.course_name || 'General',
             status,
             type: 'timeline_day',
             id: item.id || `tl_${Math.random().toString(36).substr(2, 9)}`
           });
        }
      });
    }

    // Process activity attendance
    if (!activityRaw.error) {
       const items = Array.isArray(activityRaw) ? activityRaw : (activityRaw.results || []);
       items.forEach(item => {
          const date = item.date || item.session_date;
          const subject = item.course_name || item.subject_name || 'Activity';
          const status = item.is_present ? 'present' : 'absent';
          if (date) {
             historicalRecords.push({
               date: new Date(date).toISOString(),
               subject,
               status,
               type: 'activity',
               id: item.id || `act_${Math.random().toString(36).substr(2, 9)}`
             });
          }
       });
    }

    // Deduplicate by date + subject
    const seen = new Set();
    const finalHistory = historicalRecords.filter(item => {
      const day = item.date.split('T')[0];
      const key = `${day}_${item.subject.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date descending
    finalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      data: finalHistory,
      debug: {
        totalFound: historicalRecords.length,
        finalCount: finalHistory.length,
        endpoints: results.map((r, i) => ({
          type: r.type || 'unknown',
          success: !r.error,
          count: !r.error ? (Array.isArray(r) ? r.length : (r.results ? r.results.length : 0)) : 0
        }))
      }
    });
  } catch (error) {
    console.error('[Pod.ai History] Fatal Error:', error);
    return res.status(error.message === 'SESSION_EXPIRED' ? 401 : 500).json({ 
      error: 'History fetch failed: ' + error.message 
    });
  }
}
