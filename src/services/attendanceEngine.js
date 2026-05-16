/**
 * Attendance Engine Service
 * Manages the complete calendar ↔ timetable ↔ attendance workflow
 * Handles recurring schedule generation, attendance marking, and real-time stats
 */

class AttendanceEngine {
  /**
   * Generate calendar events from timetable
   * Creates recurring weekly events for each timetable entry
   * FIX: Ensures that events are generated for the ENTIRE semester range
   * independently of when a subject was added to the system.
   */
  static generateCalendarEventsFromTimetable(timetableData, subjects, semesterSettings = {}) {
    const events = [];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const semesterStartStr = semesterSettings?.startDate;
    const semesterEndStr = semesterSettings?.endDate;
    
    if (!timetableData || typeof timetableData !== 'object') return [];

    if (!semesterStartStr) {
      console.warn("⚠️ [AttendanceEngine] semesterSettings.startDate is missing! Defaulting to today.");
    }

    const startDate = semesterStartStr ? this.parseDate(semesterStartStr) : new Date();
    const endDate = semesterEndStr ? this.parseDate(semesterEndStr) : new Date(startDate.getFullYear(), startDate.getMonth() + 4, startDate.getDate());
    
    const holidays = semesterSettings.holidays || [];
    const examPeriods = semesterSettings.examPeriods || [];
    const workingSaturdays = semesterSettings.workingSaturdays || [];

    console.log("📅 [AttendanceEngine] Generating events from", this.formatDate(startDate), "to", this.formatDate(endDate));

    Object.entries(timetableData).forEach(([cellKey, subjectData]) => {
      const [dayIdx, timeSlot] = cellKey.split('-');
      const dayNum = parseInt(dayIdx);
      const dayName = days[dayNum];

      // Find subject details for metadata (color, code, etc.)
      const subject = subjects.find(s => s.name === subjectData.name);

      // We start from the absolute beginning of the semester
      let currentDate = new Date(startDate);
      
      // Find first occurrence of this weekday starting from semester start
      // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
      // our dayNum: 0=Mon, 1=Tue, ..., 6=Sun
      const targetDay = (dayNum + 1) % 7; 
      
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate events for every week until the end of the semester
      while (currentDate <= endDate) {
        const dateStr = this.formatDate(currentDate);
        
        // 1. Skip Holidays
        const isHoliday = holidays.some(h => h.date === dateStr);
        
        // 2. Skip Exam Periods
        const isExamPeriod = examPeriods.some(p => {
          const pStart = this.parseDate(p.startDate);
          const pEnd = this.parseDate(p.endDate);
          return currentDate >= pStart && currentDate <= pEnd;
        });

        if (!isHoliday && !isExamPeriod) {
          const eventId = `${dateStr}-${dayNum}-${timeSlot}`;
          
          // CRITICAL FIX: We do NOT check subject.createdAt here.
          // The event is created as long as it's in the timetable and within semester dates.
          events.push({
            id: eventId,
            date: dateStr,
            dayOfWeek: dayNum,
            dayName: dayName,
            timeSlot: timeSlot,
            subjectName: subjectData.name,
            subjectCode: subject?.subjectCode || '',
            color: subjectData.color || '#8b5cf6',
            criteria: subjectData.criteria || 75,
            attendance: null,
            isRecurring: true
          });
        }

        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }

      // 3. Handle Working Saturdays
      workingSaturdays.forEach(ws => {
        if (ws.followsDay === dayNum) {
          const dateStr = ws.date;
          const eventId = `${dateStr}-${dayNum}-${timeSlot}-ws`;
          events.push({
            id: eventId,
            date: dateStr,
            dayOfWeek: 5, // Saturday
            dayName: 'SAT',
            timeSlot: timeSlot,
            subjectName: subjectData.name,
            subjectCode: subject?.subjectCode || '',
            color: subjectData.color || '#8b5cf6',
            criteria: subjectData.criteria || 75,
            attendance: null,
            isRecurring: false,
            isWorkingSaturday: true
          });
        }
      });
    });

    // Sort events by date and time for consistency
    return events.sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
  }

  /**
   * Calculate semester-wide metrics for a subject
   */
  static calculateSemesterSubjectMetrics(subjectName, semesterSettings, timetableData, calendarEvents, attendanceData, subjects = []) {
    if (!subjectName || !Array.isArray(calendarEvents)) {
      return { present: 0, total: 0, absent: 0, percentage: 0, bunkableNow: 0, mustAttend: 0 };
    }

    const subject = (subjects || []).find(s => s.name === subjectName);
    const stats = this.calculateSubjectStats(subjectName, calendarEvents, attendanceData, subjects);
    
    // Total planned classes in the entire semester for this subject
    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);
    const totalPlanned = subjectEvents.length;
    
    // Classes remaining in the future
    const today = this.formatDate(new Date());
    const remainingClasses = subjectEvents.filter(e => e.date >= today && !this.getAttendanceState(e.id, attendanceData)).length;
    
    const target = Number(subject?.criteria) || 75;
    const conducted = Number(stats.total) || 0;
    const present = Number(stats.present) || 0;

    // ─── SAFE BUNK CALCULATION (USER FORMULA) ───────────────────────────────
    // Formula: floor((attended * 100) / threshold - total)
    const safeBunks = Math.max(0, Math.floor((present * 100) / target - conducted));

    const bunkableNow = safeBunks;
    
    // ─── MUST ATTEND CALCULATION ───────────────────────────────────────────
    let mustAttend = 0;
    if (conducted > 0 && (present / conducted) * 100 < target) {
      mustAttend = Math.ceil((target * conducted - 100 * present) / (100 - target));
    }

    return {
      ...stats,
      totalPlanned,
      remainingClasses,
      bunkableNow,
      mustAttend,
      target,
      prediction: {
        ifMissNext1: (conducted + 1) > 0 ? Math.round((present / (conducted + 1)) * 100) : 0,
        ifAttendNext1: (conducted + 1) > 0 ? Math.round(((present + 1) / (conducted + 1)) * 100) : 0,
        ifMissNext2: (conducted + 2) > 0 ? Math.round((present / (conducted + 2)) * 100) : 0,
        ifAttendNext2: (conducted + 2) > 0 ? Math.round(((present + 2) / (conducted + 2)) * 100) : 0
      }
    };
  }

  /**
   * Get all scheduled events for a specific date
   */
  static getEventsForDate(dateStr, calendarEvents) {
    return calendarEvents.filter(event => event.date === dateStr);
  }

  /**
   * Mark attendance for a specific event
   */
  static markAttendance(eventId, state, attendanceData) {
    const newData = { ...attendanceData };
    if (!newData[eventId]) {
      newData[eventId] = {};
    }

    newData[eventId] = {
      state: state,
      timestamp: new Date().toISOString(),
      markedAt: new Date().toLocaleString()
    };

    return newData;
  }

  /**
   * Mark all events for a date with same state
   */
  static markAllForDate(dateStr, state, calendarEvents, attendanceData) {
    const newData = { ...attendanceData };
    const eventsForDate = this.getEventsForDate(dateStr, calendarEvents);

    eventsForDate.forEach(event => {
      if (state === null) {
        delete newData[event.id];
      } else {
        newData[event.id] = {
          state: state,
          timestamp: new Date().toISOString(),
          markedAt: new Date().toLocaleString()
        };
      }
    });

    return newData;
  }

  /**
   * Clear attendance for a specific event
   */
  static clearAttendance(eventId, attendanceData) {
    const newData = { ...attendanceData };
    delete newData[eventId];
    return newData;
  }

  /**
   * Get attendance state for an event
   */
  static getAttendanceState(eventId, attendanceData) {
    return attendanceData[eventId]?.state || null;
  }

  /**
   * Calculate attendance statistics for a subject
   */
  static calculateSubjectStats(subjectName, calendarEvents, attendanceData, subjects = []) {
    if (!subjectName || !Array.isArray(calendarEvents)) {
      return { subjectName: subjectName || 'Unknown', present: 0, absent: 0, off: 0, unmarked: 0, total: 0, percentage: 0, status: 'critical' };
    }
    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);
    const subject = (subjects || []).find(s => s.name === subjectName);

    // Baseline stats - ensure numeric and handle potential string formats from Pod.ai
    const parseValue = (val) => {
      if (typeof val === 'string' && val.includes('%')) {
        return parseFloat(val.replace('%', ''));
      }
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    let present = parseValue(subject?.initialPresent ?? subject?.present ?? 0);
    let total = parseValue(subject?.initialTotal ?? subject?.total ?? 0);
    
    let tracktapsPresent = 0;
    let tracktapsAbsent = 0;
    let off = 0;
    let unmarked = 0;
    const lastSyncDate = subject?.lastSyncDate || null;

    subjectEvents.forEach(event => {
      const state = this.getAttendanceState(event.id, attendanceData);
      
      // DATE BARRIER: Only count manual marks if they are AFTER the last sync
      // If no lastSyncDate exists (local user), we count everything.
      const isPostSync = !lastSyncDate || event.date > lastSyncDate;

      // DEBUG LOG: Verification of the Date Barrier logic
      if (state && !isPostSync) {
        console.log(`🛡️ [AttendanceEngine] Filtering old mark: ${event.subjectName} on ${event.date} (Synced up to ${lastSyncDate})`);
      }

      if (state === 'present') {
        if (isPostSync) tracktapsPresent++;
      } else if (state === 'absent') {
        if (isPostSync) tracktapsAbsent++;
      } else if (state === 'off') {
        off++;
      } else {
        unmarked++;
      }
    });

    present += tracktapsPresent;
    total += (tracktapsPresent + tracktapsAbsent);

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      subjectName,
      present,
      absent: total - present,
      off,
      unmarked,
      total,
      percentage,
      status: percentage >= (subject?.criteria || 75) ? 'safe' : percentage >= 65 ? 'warning' : 'critical'
    };
  }

  /**
   * Calculate overall attendance statistics
   */
  static calculateOverallStats(subjects, calendarEvents, attendanceData) {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalOff = 0;
    let totalUnmarked = 0;
    let safeSubjects = 0;
    let warningSubjects = 0;
    let criticalSubjects = 0;

    const subjectStats = subjects.map(subject => {
      const stats = this.calculateSubjectStats(subject.name, calendarEvents, attendanceData, subjects);

      totalPresent += stats.present;
      totalAbsent += stats.absent;
      totalOff += stats.off;
      totalUnmarked += stats.unmarked;

      if (stats.status === 'safe') safeSubjects++;
      else if (stats.status === 'warning') warningSubjects++;
      else if (stats.status === 'critical') criticalSubjects++;

      return stats;
    });

    const totalClasses = totalPresent + totalAbsent;
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    return {
      subjectStats,
      totalPresent,
      totalAbsent,
      totalOff,
      totalUnmarked,
      totalClasses,
      overallPercentage,
      safeSubjects,
      warningSubjects,
      criticalSubjects,
      status: overallPercentage >= 75 ? 'safe' : overallPercentage >= 65 ? 'warning' : 'critical'
    };
  }

  /**
   * Get visual state for a date (for calendar highlighting)
   */
  static getDateVisualState(dateStr, calendarEvents, attendanceData) {
    const eventsForDate = this.getEventsForDate(dateStr, calendarEvents);

    if (eventsForDate.length === 0) {
      return { type: 'empty', color: 'transparent', label: 'No classes' };
    }

    let presentCount = 0;
    let absentCount = 0;
    let offCount = 0;
    let unmarkedCount = 0;

    eventsForDate.forEach(event => {
      const state = this.getAttendanceState(event.id, attendanceData);
      if (state === 'present') presentCount++;
      else if (state === 'absent') absentCount++;
      else if (state === 'off') offCount++;
      else unmarkedCount++;
    });

    if (unmarkedCount > 0) {
      return { type: 'unmarked', color: '#94a3b8', label: `${unmarkedCount} unmarked` };
    }

    if (presentCount > 0 && absentCount === 0) {
      return { type: 'present', color: '#10b981', label: 'All present' };
    }

    if (absentCount > 0 && presentCount === 0) {
      return { type: 'absent', color: '#ef4444', label: 'All absent' };
    }

    if (presentCount > 0 && absentCount > 0) {
      return { type: 'mixed', color: '#f59e0b', label: 'Mixed' };
    }

    if (offCount === eventsForDate.length) {
      return { type: 'off', color: '#8b5cf6', label: 'Off day' };
    }

    return { type: 'empty', color: 'transparent', label: 'No classes' };
  }

  /**
   * Get attendance color based on state
   */
  static getStateColor(state) {
    if (state === 'present') return '#10b981';
    if (state === 'absent') return '#ef4444';
    if (state === 'off') return '#8b5cf6';
    return '#94a3b8'; // unmarked
  }

  /**
   * Get attendance icon based on state
   */
  static getStateIcon(state) {
    if (state === 'present') return '✓';
    if (state === 'absent') return '✗';
    if (state === 'off') return '◯';
    return '○'; // unmarked
  }

  /**
   * Format date as YYYY-MM-DD
   */
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse date string to Date object
   */
  static parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get day name from date string
   */
  static getDayName(dateStr) {
    const date = this.parseDate(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Get formatted date string for display
   */
  static formatDateForDisplay(dateStr) {
    const date = this.parseDate(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /**
   * Check if date is today
   */
  static isToday(dateStr) {
    const today = this.formatDate(new Date());
    return dateStr === today;
  }

  /**
   * Check if date is in the past
   */
  static isPast(dateStr) {
    const date = this.parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Get next 7 days from today
   */
  static getNext7Days() {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(this.formatDate(date));
    }
    return days;
  }

  /**
   * Export attendance data as CSV
   */
  static exportAsCSV(subjects, calendarEvents, attendanceData) {
    const stats = this.calculateOverallStats(subjects, calendarEvents, attendanceData);
    let csv = 'Subject,Present,Absent,Off,Unmarked,Total,Percentage,Status\n';

    stats.subjectStats.forEach(stat => {
      csv += `${stat.subjectName},${stat.present},${stat.absent},${stat.off},${stat.unmarked},${stat.total},${stat.percentage}%,${stat.status}\n`;
    });

    return csv;
  }

  /**
   * Get insights based on attendance
   */
  static generateInsights(subjects = [], calendarEvents = [], attendanceData = {}) {
    if (!Array.isArray(subjects) || !Array.isArray(calendarEvents)) return [];

    const stats = this.calculateOverallStats(subjects, calendarEvents, attendanceData);
    const insights = [];

    (stats.subjectStats || []).forEach(stat => {
      if (stat && stat.status === 'critical') {
        const target = 75;
        const total = stat.total || 0;
        const present = stat.present || 0;
        const needed = Math.ceil((target * total - 100 * present) / (100 - target));
        const finalNeeded = Math.max(0, total === 0 ? 1 : (isNaN(needed) ? 0 : needed));
        insights.push({
          type: 'critical',
          subject: stat.subjectName || 'Unknown',
          title: 'Critical Attention',
          icon: '🚨',
          message: `${stat.subjectName || 'Subject'} is at ${stat.percentage}%. Attend ${finalNeeded} more to reach 75%.`,
          priority: 'high'
        });
      }
    });

    const safeCount = (stats.subjectStats || []).filter(s => s && s.status === 'safe').length;
    if (safeCount > 0) {
      insights.push({
        type: 'safe',
        title: 'Safety Zone',
        icon: '🛡️',
        message: `${safeCount} subject(s) are above threshold. Great job!`,
        priority: 'low'
      });
    }

    if (stats.overallPercentage < 65) {
      insights.push({
        type: 'warning',
        title: 'Efficiency Warning',
        icon: '⚠️',
        message: `Overall attendance is ${stats.overallPercentage}%. Focus on next week.`,
        priority: 'high'
      });
    }

    return insights;
  }
}

export default AttendanceEngine;
