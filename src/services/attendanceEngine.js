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
  static generateCalendarEventsFromTimetable(timetableData, subjects) {
    const events = [];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    Object.entries(timetableData).forEach(([cellKey, subjectData]) => {
      const [dayIdx, timeSlot] = cellKey.split('-');
      const dayNum = parseInt(dayIdx);
      const dayName = days[dayNum];

      // Find subject details
      const subject = subjects.find(s => s.name === subjectData.name);

      // Generate events for next 12 months
      const today = new Date();
      const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

      let currentDate = new Date(today);
      // Find first occurrence of this day
      while (currentDate.getDay() !== (dayNum + 1) % 7) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= endDate) {
        const dateStr = this.formatDate(currentDate);
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
          attendance: null, // Will be set when marked
          isRecurring: true
        });

        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }
    });

    return events;
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
  static calculateSubjectStats(subjectName, calendarEvents, attendanceData) {
    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);

    let present = 0;
    let absent = 0;
    let off = 0;
    let unmarked = 0;

    subjectEvents.forEach(event => {
      const state = this.getAttendanceState(event.id, attendanceData);
      if (state === 'present') present++;
      else if (state === 'absent') absent++;
      else if (state === 'off') off++;
      else unmarked++;
    });

    const total = present + absent; // Off days don't count
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      subjectName,
      present,
      absent,
      off,
      unmarked,
      total,
      percentage,
      status: percentage >= 75 ? 'safe' : percentage >= 65 ? 'warning' : 'critical'
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
      const stats = this.calculateSubjectStats(subject.name, calendarEvents, attendanceData);

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
        const needed = Math.ceil((75 * stat.total - 75 * stat.present) / (100 - 75));
        insights.push({
          type: 'critical',
          subject: stat.subjectName,
          message: `${stat.subjectName} is at ${stat.percentage}%. Need ${needed} more classes to reach 75%.`,
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
