/**
 * Analytics Engine
 * Generates real insights and analytics from attendance data
 */

class AnalyticsEngine {
  /**
   * Generate actionable insights
   */
  static generateInsights(subjects, calendarEvents, attendanceData) {
    const insights = [];
    const AttendanceEngine = require('./attendanceEngine').default;

    // Calculate overall stats
    const stats = AttendanceEngine.calculateOverallStats(subjects, calendarEvents, attendanceData);

    // 1. Critical subjects needing attention
    stats.subjectStats.forEach(stat => {
      if (stat.status === 'critical') {
        const needed = Math.ceil(
          (75 * stat.total - 75 * stat.present) / (100 - 75)
        );
        insights.push({
          id: `critical_${stat.subjectName}`,
          type: 'critical',
          priority: 'high',
          icon: '⚠️',
          title: `${stat.subjectName} is Critical`,
          message: `${stat.subjectName} is at ${stat.percentage}%. You need ${needed} more consecutive classes to reach 75%.`,
          action: 'Attend next classes',
          subject: stat.subjectName
        });
      }
    });

    // 2. Warning subjects
    stats.subjectStats.forEach(stat => {
      if (stat.status === 'warning') {
        insights.push({
          id: `warning_${stat.subjectName}`,
          type: 'warning',
          priority: 'medium',
          icon: '⚡',
          title: `${stat.subjectName} Below Target`,
          message: `${stat.subjectName} is at ${stat.percentage}%. Keep attending to maintain above 75%.`,
          action: 'Maintain attendance',
          subject: stat.subjectName
        });
      }
    });

    // 3. Safe subjects
    if (stats.safeSubjects > 0) {
      insights.push({
        id: 'safe_subjects',
        type: 'safe',
        priority: 'low',
        icon: '✅',
        title: `${stats.safeSubjects} Subject(s) Safe`,
        message: `Great! ${stats.safeSubjects} subject(s) have attendance above 75%. Keep it up!`,
        action: 'Maintain performance'
      });
    }

    // 4. Overall attendance trend
    if (stats.overallPercentage < 65) {
      insights.push({
        id: 'overall_critical',
        type: 'critical',
        priority: 'high',
        icon: '📉',
        title: 'Overall Attendance Critical',
        message: `Your overall attendance is ${stats.overallPercentage}%. Focus on attending more classes.`,
        action: 'Increase attendance'
      });
    } else if (stats.overallPercentage < 75) {
      insights.push({
        id: 'overall_warning',
        type: 'warning',
        priority: 'medium',
        icon: '📊',
        title: 'Overall Attendance Below Target',
        message: `Your overall attendance is ${stats.overallPercentage}%. Aim for 75% or higher.`,
        action: 'Improve attendance'
      });
    } else {
      insights.push({
        id: 'overall_safe',
        type: 'safe',
        priority: 'low',
        icon: '📈',
        title: 'Overall Attendance Good',
        message: `Your overall attendance is ${stats.overallPercentage}%. Excellent work!`,
        action: 'Maintain performance'
      });
    }

    // 5. Skip predictions
    const today = AttendanceEngine.formatDate(new Date());
    const todayEvents = AttendanceEngine.getEventsForDate(today, calendarEvents);
    
    if (todayEvents.length > 0) {
      const canSkip = todayEvents.filter(event => {
        const subjectStats = stats.subjectStats.find(s => s.subjectName === event.subjectName);
        return subjectStats && subjectStats.percentage >= 80;
      });

      if (canSkip.length > 0) {
        insights.push({
          id: 'skip_prediction',
          type: 'info',
          priority: 'low',
          icon: '🎯',
          title: 'Safe to Skip',
          message: `You can safely skip ${canSkip.map(e => e.subjectName).join(', ')} today and maintain 75%+.`,
          action: 'Plan accordingly'
        });
      }
    }

    // 6. Attendance consistency
    const recentDays = this.getRecentAttendancePattern(calendarEvents, attendanceData, 7);
    if (recentDays.length > 0) {
      const presentDays = recentDays.filter(d => d.present > 0).length;
      const consistency = Math.round((presentDays / recentDays.length) * 100);

      if (consistency >= 80) {
        insights.push({
          id: 'consistency_high',
          type: 'safe',
          priority: 'low',
          icon: '🔥',
          title: 'Great Consistency',
          message: `You've been attending ${consistency}% of days this week. Keep up the streak!`,
          action: 'Maintain streak'
        });
      } else if (consistency < 50) {
        insights.push({
          id: 'consistency_low',
          type: 'warning',
          priority: 'medium',
          icon: '📉',
          title: 'Low Attendance This Week',
          message: `You've only attended ${consistency}% of days this week. Try to attend more.`,
          action: 'Increase attendance'
        });
      }
    }

    // 7. Upcoming deadlines
    const criticalSubjects = stats.subjectStats.filter(s => s.status === 'critical');
    if (criticalSubjects.length > 0) {
      insights.push({
        id: 'upcoming_deadline',
        type: 'critical',
        priority: 'high',
        icon: '⏰',
        title: 'Urgent Action Needed',
        message: `${criticalSubjects.length} subject(s) need immediate attention. Attend the next classes.`,
        action: 'Attend next classes'
      });
    }

    return insights;
  }

  /**
   * Get recent attendance pattern (last N days)
   */
  static getRecentAttendancePattern(calendarEvents, attendanceData, days = 7) {
    const AttendanceEngine = require('./attendanceEngine').default;
    const pattern = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = AttendanceEngine.formatDate(date);

      const dayEvents = AttendanceEngine.getEventsForDate(dateStr, calendarEvents);
      let present = 0;
      let absent = 0;
      let off = 0;

      dayEvents.forEach(event => {
        const state = AttendanceEngine.getAttendanceState(event.id, attendanceData);
        if (state === 'present') present++;
        else if (state === 'absent') absent++;
        else if (state === 'off') off++;
      });

      pattern.push({
        date: dateStr,
        present,
        absent,
        off,
        total: dayEvents.length
      });
    }

    return pattern;
  }

  /**
   * Calculate attendance trend
   */
  static calculateTrend(calendarEvents, attendanceData, days = 30) {
    const AttendanceEngine = require('./attendanceEngine').default;
    const trend = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = AttendanceEngine.formatDate(date);

      const dayEvents = AttendanceEngine.getEventsForDate(dateStr, calendarEvents);
      let present = 0;

      dayEvents.forEach(event => {
        const state = AttendanceEngine.getAttendanceState(event.id, attendanceData);
        if (state === 'present') present++;
      });

      const percentage = dayEvents.length > 0
        ? Math.round((present / dayEvents.length) * 100)
        : 0;

      trend.push({
        date: dateStr,
        percentage,
        present,
        total: dayEvents.length
      });
    }

    return trend;
  }

  /**
   * Get attendance streak
   */
  static calculateStreak(calendarEvents, attendanceData) {
    const AttendanceEngine = require('./attendanceEngine').default;
    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = AttendanceEngine.formatDate(today);
      const dayEvents = AttendanceEngine.getEventsForDate(dateStr, calendarEvents);

      if (dayEvents.length === 0) {
        today.setDate(today.getDate() - 1);
        continue;
      }

      const allPresent = dayEvents.every(event => {
        const state = AttendanceEngine.getAttendanceState(event.id, attendanceData);
        return state === 'present';
      });

      if (allPresent) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get recovery plan for a subject
   */
  static getRecoveryPlan(subject, subjectStats, calendarEvents, attendanceData) {
    const AttendanceEngine = require('./attendanceEngine').default;
    const target = subject.criteria || 75;

    if (subjectStats.percentage >= target) {
      return {
        status: 'safe',
        message: 'No recovery needed',
        classesNeeded: 0
      };
    }

    // Calculate classes needed
    const classesNeeded = Math.ceil(
      (target * subjectStats.total - target * subjectStats.present) / (100 - target)
    );

    // Get upcoming events for this subject
    const upcomingEvents = calendarEvents.filter(e =>
      e.subjectName === subject.name &&
      new Date(e.date) >= new Date()
    );

    return {
      status: 'recovery_needed',
      message: `Need ${classesNeeded} consecutive classes to reach ${target}%`,
      classesNeeded,
      upcomingClasses: upcomingEvents.length,
      canRecover: upcomingEvents.length >= classesNeeded
    };
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(subjects, calendarEvents, attendanceData) {
    const AttendanceEngine = require('./attendanceEngine').default;
    const stats = AttendanceEngine.calculateOverallStats(subjects, calendarEvents, attendanceData);

    return {
      overallPercentage: stats.overallPercentage,
      totalClasses: stats.totalClasses,
      presentClasses: stats.totalPresent,
      absentClasses: stats.totalAbsent,
      safeSubjects: stats.safeSubjects,
      warningSubjects: stats.warningSubjects,
      criticalSubjects: stats.criticalSubjects,
      status: stats.status,
      trend: this.calculateTrend(calendarEvents, attendanceData, 7),
      streak: this.calculateStreak(calendarEvents, attendanceData)
    };
  }
}

export default AnalyticsEngine;
