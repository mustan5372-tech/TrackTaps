/**
 * Safe Attendance Calculation Utilities
 * Shared across Dashboard, Insights, and Community modules
 */

export const calculateAttendanceStats = (subjects, calendarEvents, attendanceData) => {
  try {
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return {
        overallPercentage: 0,
        totalPresent: 0,
        totalClasses: 0,
        status: 'critical'
      };
    }

    let totalPresent = 0;
    let totalAbsent = 0;

    // Helper to parse values safely
    const parseValue = (val) => {
      if (typeof val === 'string' && val.includes('%')) {
        return parseFloat(val.replace('%', ''));
      }
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    subjects.forEach(subject => {
      // 1. Get baseline from Pod.ai / Initial values
      let present = parseValue(subject.initialPresent ?? subject.present ?? 0);
      let total = parseValue(subject.initialTotal ?? subject.total ?? 0);
      
      const lastSyncDate = subject.lastSyncDate || null;

      // 2. Add manual marks from TrackTaps (Date Barrier)
      const subjectEvents = calendarEvents.filter(e => e.subjectName === subject.name);
      
      subjectEvents.forEach(event => {
        const state = attendanceData[event.id]?.state;
        // Only count manual marks AFTER the last sync date
        const isPostSync = !lastSyncDate || event.date > lastSyncDate;

        if (state === 'present' && isPostSync) {
          present++;
          total++;
        } else if (state === 'absent' && isPostSync) {
          total++;
        }
      });

      totalPresent += present;
      totalAbsent += (total - present);
    });

    const totalClasses = totalPresent + totalAbsent;
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    return {
      overallPercentage,
      totalPresent,
      totalClasses,
      status: overallPercentage >= 75 ? 'safe' : overallPercentage >= 65 ? 'warning' : 'critical'
    };
  } catch (error) {
    console.error("❌ [AttendanceUtils] Critical calculation error:", error);
    return { overallPercentage: 0, totalPresent: 0, totalClasses: 0, status: 'critical' };
  }
};

/**
 * Calculate simple activity score (total classes marked/synced)
 */
export const calculateActivityScore = (subjects, attendanceData) => {
  try {
    const manualMarks = Object.keys(attendanceData || {}).length;
    const subjectsCount = subjects?.length || 0;
    return manualMarks + (subjectsCount * 5); // Base score for having subjects
  } catch (err) {
    return 0;
  }
};
