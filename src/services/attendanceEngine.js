/**
 * Attendance Engine Service
 * Manages the complete calendar ↔ timetable ↔ attendance workflow
 * Handles recurring schedule generation, attendance marking, and real-time stats
 */

class AttendanceEngine {
  /**
   * Generate calendar events from timetable
   * Creates recurring weekly events for each timetable entry
   */
  static generateCalendarEventsFromTimetable(timetableData, subjects, semesterSettings = {}) {
    const events = [];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const startDate = semesterSettings.startDate ? this.parseDate(semesterSettings.startDate) : new Date();
    const endDate = semesterSettings.endDate ? this.parseDate(semesterSettings.endDate) : new Date(startDate.getFullYear(), startDate.getMonth() + 4, startDate.getDate());
    const holidays = semesterSettings.holidays || [];
    const examPeriods = semesterSettings.examPeriods || [];
    const workingSaturdays = semesterSettings.workingSaturdays || [];

    Object.entries(timetableData).forEach(([cellKey, subjectData]) => {
      const [dayIdx, timeSlot] = cellKey.split('-');
      const dayNum = parseInt(dayIdx);
      const dayName = days[dayNum];

      // Find subject details
      const subject = subjects.find(s => s.name === subjectData.name);

      let currentDate = new Date(startDate);
      // Find first occurrence of this day
      while (currentDate.getDay() !== (dayNum + 1) % 7) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

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

      // 3. Handle Working Saturdays (if the day index corresponds to Saturday)
      // Actually, if it's a working Saturday, we usually follow a specific day's timetable (e.g., "Monday Timetable on Saturday")
      // But for simplicity, we'll assume classes on Saturdays are added explicitly to the timetable if they are regular
      // If they are one-offs, we check workingSaturdays.
      workingSaturdays.forEach(ws => {
        const wsDate = this.parseDate(ws.date);
        // If this ws follows this day's schedule
        if (ws.followsDay === dayNum) {
          const dateStr = ws.date;
          const eventId = `${dateStr}-${dayNum}-${timeSlot}-ws`;
          events.push({
            id: eventId,
            date: dateStr,
            dayOfWeek: 5, // Saturday is 5 in 0-6 Mon-Sun
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

    return events;
  }

  /**
   * Calculate semester-wide metrics for a subject
   */
  static calculateSemesterSubjectMetrics(subjectName, semesterSettings, timetableData, calendarEvents, attendanceData, subjects = []) {
    const subject = subjects.find(s => s.name === subjectName);
    const stats = this.calculateSubjectStats(subjectName, calendarEvents, attendanceData, subjects);
    
    // Total planned classes in the entire semester for this subject
    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);
    const totalPlanned = subjectEvents.length;
    
    // Classes remaining in the future
    const today = this.formatDate(new Date());
    const remainingClasses = subjectEvents.filter(e => e.date >= today && !this.getAttendanceState(e.id, attendanceData)).length;
    
    const target = subject?.criteria || 75;
    
    // Bunk Calculation: How many future classes can be missed while staying above target?
    // Formula: (Present) / (Conducted + Remaining - Missable) >= Target%
    // Let M be missable classes: M <= Conducted + Remaining - (Present / Target)
    
    const conducted = stats.total;
    const present = stats.present;
    
    // Max missable classes total in semester to stay at target
    // target = present / (totalPlanned - missable)
    // missable = totalPlanned - (present / (target/100))
    const maxMissableTotal = Math.floor(totalPlanned - (present / (target / 100)));
    
    // Bunkable now = maxMissableTotal - (conducted - present)
    const bunkableNow = Math.max(0, maxMissableTotal - stats.absent);
    
    // Must attend: If bunkable is 0, how many more must be attended to reach target?
    let mustAttend = 0;
    if (stats.percentage < target) {
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
        ifMissNext1: conducted > 0 ? Math.round((present / (conducted + 1)) * 100) : 0,
        ifMissNext2: conducted > 0 ? Math.round((present / (conducted + 2)) * 100) : 0,
        ifAttendNext1: Math.round(((present + 1) / (conducted + 1)) * 100),
        ifAttendNext2: Math.round(((present + 2) / (conducted + 2)) * 100)
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
   * States: 'present', 'absent', 'off', null (unmarked)
   */
  static markAttendance(eventId, state, attendanceData) {
    const newData = { ...attendanceData };
    if (!newData[eventId]) {
      newData[eventId] = {};
    }

    newData[eventId] = {
      state: state, // 'present', 'absent', 'off', null
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
    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);
    const subject = subjects.find(s => s.name === subjectName);

    // Baseline from Pod.ai or other imports - ensure numeric
    let present = Number(subject?.initialPresent) || 0;
    let total = Number(subject?.initialTotal) || 0;
    
    let tracktapsPresent = 0;
    let tracktapsAbsent = 0;
    let off = 0;
    let unmarked = 0;

    subjectEvents.forEach(event => {
      const state = this.getAttendanceState(event.id, attendanceData);
      if (state === 'present') tracktapsPresent++;
      else if (state === 'absent') tracktapsAbsent++;
      else if (state === 'off') off++;
      else unmarked++;
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

    // Determine visual state
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
  static generateInsights(subjects, calendarEvents, attendanceData) {
    const stats = this.calculateOverallStats(subjects, calendarEvents, attendanceData);
    const insights = [];

    // Critical subjects
    stats.subjectStats.forEach(stat => {
      if (stat.status === 'critical') {
        const target = 75;
        const needed = Math.ceil((target * stat.total - 100 * stat.present) / (100 - target));
        const finalNeeded = Math.max(0, stat.total === 0 ? 1 : needed);
        insights.push({
          type: 'critical',
          subject: stat.subjectName,
          message: `${stat.subjectName} is at ${stat.percentage}%. Need ${finalNeeded} more classes to reach 75%.`,
          priority: 'high'
        });
      }
    });

    // Safe subjects
    const safeCount = stats.subjectStats.filter(s => s.status === 'safe').length;
    if (safeCount > 0) {
      insights.push({
        type: 'safe',
        message: `${safeCount} subject(s) are safe. Great job!`,
        priority: 'low'
      });
    }

    // Overall status
    if (stats.overallPercentage < 65) {
      insights.push({
        type: 'warning',
        message: `Overall attendance is ${stats.overallPercentage}%. Focus on attending more classes.`,
        priority: 'high'
      });
    }

    return insights;
  }
}

export default AttendanceEngine;
