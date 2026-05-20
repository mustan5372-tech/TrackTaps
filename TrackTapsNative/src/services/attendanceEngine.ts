/**
 * Attendance Engine Service
 * Manages the complete calendar ↔ timetable ↔ attendance workflow
 * Handles recurring schedule generation, attendance marking, and real-time stats
 */

export interface SemesterSettings {
  startDate?: string;
  endDate?: string;
  holidays?: Array<{ id: string; date: string; name: string; type: string }>;
  examPeriods?: Array<{ id: string; name: string; startDate: string; endDate: string }>;
  workingSaturdays?: Array<{ id: string; date: string; followsDay: number }>;
}

export interface AttendanceSettings {
  defaultTarget?: number;
  warningLevel?: number;
  criticalLevel?: number;
}

export interface TimetableEntry {
  name: string;
  color?: string;
  criteria?: number;
}

export interface TimetableData {
  [cellKey: string]: TimetableEntry;
}

export interface Subject {
  name: string;
  subjectCode?: string;
  color?: string;
  criteria?: number;
  present?: number;
  total?: number;
  initialPresent?: number;
  initialTotal?: number;
  lastSyncDate?: string | null;
}

export interface CalendarEvent {
  id: string;
  date: string;
  dayOfWeek: number;
  dayName: string;
  timeSlot: string;
  subjectName: string;
  subjectCode?: string;
  color: string;
  criteria: number;
  attendance: string | null;
  isRecurring: boolean;
  isWorkingSaturday?: boolean;
}

export interface AttendanceRecord {
  state: string | null;
  timestamp: string;
  markedAt: string;
}

export interface AttendanceData {
  [eventId: string]: AttendanceRecord;
}

export interface SubjectStats {
  subjectName: string;
  present: number;
  absent: number;
  off: number;
  unmarked: number;
  total: number;
  percentage: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface OverallStats {
  subjectStats: SubjectStats[];
  totalPresent: number;
  totalAbsent: number;
  totalOff: number;
  totalUnmarked: number;
  totalClasses: number;
  overallPercentage: number;
  safeSubjects: number;
  warningSubjects: number;
  criticalSubjects: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface SubjectMetrics extends SubjectStats {
  totalPlanned: number;
  remainingClasses: number;
  bunkableNow: number;
  mustAttend: number;
  target: number;
  prediction: {
    ifMissNext1: number;
    ifAttendNext1: number;
    ifMissNext2: number;
    ifAttendNext2: number;
  };
}

export interface InsightItem {
  type: 'streak' | 'warning' | 'safe' | 'critical';
  title: string;
  icon: string;
  subject?: string;
  message: string;
  priority: 'high' | 'medium';
}

class AttendanceEngine {
  /**
   * Generate calendar events from timetable
   */
  static generateCalendarEventsFromTimetable(
    timetableData: TimetableData,
    subjects: Subject[],
    semesterSettings: SemesterSettings = {},
    attendanceSettings: AttendanceSettings = {}
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const semesterStartStr = semesterSettings?.startDate;
    const semesterEndStr = semesterSettings?.endDate;

    if (!timetableData || typeof timetableData !== 'object') return [];

    const startDate = semesterStartStr ? this.parseDate(semesterStartStr) : new Date();
    const endDate = semesterEndStr ? this.parseDate(semesterEndStr) : new Date(startDate.getFullYear(), startDate.getMonth() + 4, startDate.getDate());

    const holidays = semesterSettings.holidays || [];
    const examPeriods = semesterSettings.examPeriods || [];
    const workingSaturdays = semesterSettings.workingSaturdays || [];

    Object.entries(timetableData).forEach(([cellKey, subjectData]) => {
      const [dayIdx, timeSlot] = cellKey.split('-');
      const dayNum = parseInt(dayIdx);
      const dayName = days[dayNum];

      const subject = (subjects || []).find(s => s.name === subjectData.name);

      let currentDate = new Date(startDate);
      const targetDay = (dayNum + 1) % 7;

      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= endDate) {
        const dateStr = this.formatDate(currentDate);

        const isHoliday = holidays.some(h => h.date === dateStr);
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
            criteria: subjectData.criteria || attendanceSettings?.defaultTarget || 75,
            attendance: null,
            isRecurring: true
          });
        }

        currentDate.setDate(currentDate.getDate() + 7);
      }

      workingSaturdays.forEach(ws => {
        if (ws.followsDay === dayNum) {
          const dateStr = ws.date;
          const eventId = `${dateStr}-${dayNum}-${timeSlot}-ws`;
          events.push({
            id: eventId,
            date: dateStr,
            dayOfWeek: 5,
            dayName: 'SAT',
            timeSlot: timeSlot,
            subjectName: subjectData.name,
            subjectCode: subject?.subjectCode || '',
            color: subjectData.color || '#8b5cf6',
            criteria: subjectData.criteria || attendanceSettings?.defaultTarget || 75,
            attendance: null,
            isRecurring: false,
            isWorkingSaturday: true
          });
        }
      });
    });

    return events.sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
  }

  /**
   * Calculate semester-wide metrics for a subject
   */
  static calculateSemesterSubjectMetrics(
    subjectName: string,
    semesterSettings: SemesterSettings,
    timetableData: TimetableData,
    calendarEvents: CalendarEvent[],
    attendanceData: AttendanceData,
    subjects: Subject[] = [],
    attendanceSettings: AttendanceSettings = {}
  ): SubjectMetrics {
    const defaultStats: SubjectMetrics = {
      subjectName: subjectName || 'Unknown',
      present: 0,
      absent: 0,
      off: 0,
      unmarked: 0,
      total: 0,
      percentage: 0,
      status: 'critical',
      totalPlanned: 0,
      remainingClasses: 0,
      bunkableNow: 0,
      mustAttend: 0,
      target: 75,
      prediction: { ifMissNext1: 0, ifAttendNext1: 0, ifMissNext2: 0, ifAttendNext2: 0 }
    };

    if (!subjectName || !Array.isArray(calendarEvents)) {
      return defaultStats;
    }

    const subject = (subjects || []).find(s => s.name === subjectName);
    const stats = this.calculateSubjectStats(subjectName, calendarEvents, attendanceData, subjects, attendanceSettings);

    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);
    const totalPlanned = subjectEvents.length;

    const today = this.formatDate(new Date());
    const remainingClasses = subjectEvents.filter(e => e.date >= today && !this.getAttendanceState(e.id, attendanceData)).length;

    const target = Number(subject?.criteria) || attendanceSettings?.defaultTarget || 75;
    const conducted = Number(stats.total) || 0;
    const present = Number(stats.present) || 0;

    const safeBunks = Math.max(0, Math.floor((present * 100) / target - conducted));
    const bunkableNow = safeBunks;

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
  static getEventsForDate(dateStr: string, calendarEvents: CalendarEvent[]): CalendarEvent[] {
    return calendarEvents.filter(event => event.date === dateStr);
  }

  /**
   * Mark attendance for a specific event
   */
  static markAttendance(eventId: string, state: string | null, attendanceData: AttendanceData): AttendanceData {
    const newData = { ...attendanceData };
    if (state === null) {
      delete newData[eventId];
    } else {
      newData[eventId] = {
        state: state,
        timestamp: new Date().toISOString(),
        markedAt: new Date().toLocaleString()
      };
    }
    return newData;
  }

  /**
   * Mark all events for a date with same state
   */
  static markAllForDate(dateStr: string, state: string | null, calendarEvents: CalendarEvent[], attendanceData: AttendanceData): AttendanceData {
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
  static clearAttendance(eventId: string, attendanceData: AttendanceData): AttendanceData {
    const newData = { ...attendanceData };
    delete newData[eventId];
    return newData;
  }

  /**
   * Get attendance state for an event
   */
  static getAttendanceState(eventId: string, attendanceData: AttendanceData): string | null {
    return attendanceData[eventId]?.state || null;
  }

  /**
   * Calculate attendance statistics for a subject
   */
  static calculateSubjectStats(
    subjectName: string,
    calendarEvents: CalendarEvent[],
    attendanceData: AttendanceData,
    subjects: Subject[] = [],
    attendanceSettings: AttendanceSettings = {}
  ): SubjectStats {
    if (!subjectName || !Array.isArray(calendarEvents)) {
      return { subjectName: subjectName || 'Unknown', present: 0, absent: 0, off: 0, unmarked: 0, total: 0, percentage: 0, status: 'critical' };
    }
    const subjectEvents = calendarEvents.filter(e => e.subjectName === subjectName);
    const subject = (subjects || []).find(s => s.name === subjectName);

    const parseValue = (val: any): number => {
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
      const isPostSync = !lastSyncDate || event.date > lastSyncDate;

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
    const threshold = subject?.criteria || attendanceSettings?.defaultTarget || 75;
    const critLimit = attendanceSettings?.criticalLevel || 65;

    let status: 'safe' | 'warning' | 'critical' = 'critical';
    if (percentage >= threshold) status = 'safe';
    else if (percentage >= critLimit) status = 'warning';

    return {
      subjectName,
      present,
      absent: total - present,
      off,
      unmarked,
      total,
      percentage,
      status
    };
  }

  /**
   * Calculate overall attendance statistics
   */
  static calculateOverallStats(
    subjects: Subject[],
    calendarEvents: CalendarEvent[],
    attendanceData: AttendanceData,
    attendanceSettings: AttendanceSettings = {}
  ): OverallStats {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalOff = 0;
    let totalUnmarked = 0;
    let safeSubjects = 0;
    let warningSubjects = 0;
    let criticalSubjects = 0;

    const subjectStats = (subjects || []).map(subject => {
      const stats = this.calculateSubjectStats(subject.name, calendarEvents, attendanceData, subjects, attendanceSettings);

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
    const threshold = attendanceSettings?.defaultTarget || 75;
    const critLimit = attendanceSettings?.criticalLevel || 65;

    let status: 'safe' | 'warning' | 'critical' = 'critical';
    if (overallPercentage >= threshold) status = 'safe';
    else if (overallPercentage >= critLimit) status = 'warning';

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
      status
    };
  }

  /**
   * Format date as YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse date string to Date object
   */
  static parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get day name from date string
   */
  static getDayName(dateStr: string): string {
    const date = this.parseDate(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Format date string for display
   */
  static formatDateForDisplay(dateStr: string): string {
    const date = this.parseDate(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /**
   * Check if date is today
   */
  static isToday(dateStr: string): boolean {
    const today = this.formatDate(new Date());
    return dateStr === today;
  }

  /**
   * Check if date is in the past
   */
  static isPast(dateStr: string): boolean {
    const date = this.parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Get next 7 days from today
   */
  static getNext7Days(): string[] {
    const days: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(this.formatDate(date));
    }
    return days;
  }

  /**
   * Calculate attendance streaks
   */
  static calculateAttendanceStreak(attendanceData: AttendanceData): number {
    if (!attendanceData || Object.keys(attendanceData).length === 0) return 0;

    const dates = Object.keys(attendanceData)
      .map(id => id.split('-').slice(0, 3).join('-'))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newestDate = this.parseDate(dates[0]);
    const diffDays = Math.floor((today.getTime() - newestDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return 0;

    for (let i = 0; i < dates.length - 1; i++) {
      const current = this.parseDate(dates[i]);
      const next = this.parseDate(dates[i+1]);
      const diff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) streak++;
      else break;
    }

    return streak + 1;
  }

  /**
   * Get impact of today's attendance on safety windows
   */
  static getDailyAttendanceImpact(
    subjects: Subject[],
    calendarEvents: CalendarEvent[],
    attendanceData: AttendanceData,
    attendanceSettings: AttendanceSettings = {}
  ): { classesCount: number; criticalSubject: string | null; totalSafeBunks: number } | null {
    const today = this.formatDate(new Date());
    const todayClasses = this.getEventsForDate(today, calendarEvents);

    if (todayClasses.length === 0) return null;

    const subjectsInvolved = [...new Set(todayClasses.map(c => c.subjectName))];
    const impact = subjectsInvolved.map(subName => {
      const metrics = this.calculateSemesterSubjectMetrics(subName, {}, {}, calendarEvents, attendanceData, subjects, attendanceSettings);
      return {
        subject: subName,
        safeBunks: metrics.bunkableNow,
        willDropIfAbsent: metrics.prediction.ifMissNext1 < metrics.target
      };
    });

    return {
      classesCount: todayClasses.length,
      criticalSubject: impact.find(i => i.willDropIfAbsent)?.subject || null,
      totalSafeBunks: impact.reduce((sum, i) => sum + i.safeBunks, 0)
    };
  }

  /**
   * Get insights based on attendance
   */
  static generateInsights(
    subjects: Subject[] = [],
    calendarEvents: CalendarEvent[] = [],
    attendanceData: AttendanceData = {},
    attendanceSettings: AttendanceSettings = {}
  ): InsightItem[] {
    if (!Array.isArray(subjects) || !Array.isArray(calendarEvents)) return [];

    const stats = this.calculateOverallStats(subjects, calendarEvents, attendanceData, attendanceSettings);
    const insights: InsightItem[] = [];

    const streak = this.calculateAttendanceStreak(attendanceData);
    if (streak >= 3) {
      insights.push({
        type: 'streak',
        title: `${streak}-Day Streak! 🔥`,
        icon: '🔥',
        message: `You've been consistent for ${streak} days. Keep the momentum going!`,
        priority: 'high'
      });
    }

    const dailyImpact = this.getDailyAttendanceImpact(subjects, calendarEvents, attendanceData, attendanceSettings);
    if (dailyImpact) {
      if (dailyImpact.criticalSubject) {
        insights.push({
          type: 'warning',
          title: 'Critical Day 🚨',
          icon: '🚨',
          subject: dailyImpact.criticalSubject,
          message: `Missing ${dailyImpact.criticalSubject} today will drop you below your target!`,
          priority: 'high'
        });
      } else if (dailyImpact.totalSafeBunks > 3) {
        insights.push({
          type: 'safe',
          title: 'Relax Today 🏖️',
          icon: '🏖️',
          message: `You have ${dailyImpact.totalSafeBunks} safe bunks today. You're in total control.`,
          priority: 'medium'
        });
      }
    }

    (stats.subjectStats || []).forEach(stat => {
      if (stat && stat.status === 'critical') {
        const target = attendanceSettings?.defaultTarget || 75;
        const total = stat.total || 0;
        const present = stat.present || 0;
        const needed = Math.ceil((target * total - 100 * present) / (100 - target));
        const finalNeeded = Math.max(0, total === 0 ? 1 : (isNaN(needed) ? 0 : needed));

        insights.push({
          type: 'critical',
          subject: stat.subjectName || 'Unknown',
          title: 'Risk Alert ⚠',
          icon: '⚠',
          message: `${stat.subjectName} needs ${finalNeeded} more classes to hit ${target}%.`,
          priority: 'high'
        });
      }
    });

    if (stats.overallPercentage >= 85) {
      insights.push({
        type: 'safe',
        title: 'Academic Elite 💎',
        icon: '💎',
        message: `Your ${stats.overallPercentage}% attendance puts you in the top 10% of students.`,
        priority: 'medium'
      });
    }

    return insights;
  }
}

export default AttendanceEngine;
