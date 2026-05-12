import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AttendanceEngine from '../services/attendanceEngine';

/**
 * Centralized App Store using Zustand
 * Single source of truth for all app data
 */

const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ─── SUBJECTS ───────────────────────────────────────────────────────
        subjects: [],
        
        setSubjects: (subjects) => set({ subjects }),
        
        addSubject: (subject) => {
          const newSubject = {
            ...subject,
            id: `subject_${Date.now()}`,
            createdAt: new Date().toISOString(),
            present: subject.present || 0,
            total: subject.total || 0,
            attendance: subject.attendance || 0,
            color: subject.color || '#8b5cf6',
            criteria: subject.criteria || 75,
            podaiSynced: subject.podaiSynced || false
          };
          
          set((state) => ({
            subjects: [...state.subjects, newSubject]
          }));
          
          get().addHistoryEntry({
            type: 'subject_added',
            subject: subject.name,
            description: `Added subject: ${subject.name}`
          });
          
          return newSubject;
        },
        
        updateSubject: (subjectId, updates) => {
          set((state) => ({
            subjects: state.subjects.map(s =>
              s.id === subjectId ? { ...s, ...updates } : s
            )
          }));
          
          const subject = get().subjects.find(s => s.id === subjectId);
          if (subject) {
            get().addHistoryEntry({
              type: 'subject_updated',
              subject: subject.name,
              description: `Updated subject: ${subject.name}`
            });
          }
        },
        
        deleteSubject: (subjectId) => {
          const subject = get().subjects.find(s => s.id === subjectId);
          set((state) => ({
            subjects: state.subjects.filter(s => s.id !== subjectId)
          }));
          
          if (subject) {
            get().addHistoryEntry({
              type: 'subject_deleted',
              subject: subject.name,
              description: `Deleted subject: ${subject.name}`
            });
          }
        },

        // ─── TIMETABLE ──────────────────────────────────────────────────────
        timetable: {},
        
        setTimetable: (timetable) => set({ timetable }),
        
        addTimetableEntry: (dayIdx, timeSlot, subject) => {
          const cellKey = `${dayIdx}-${timeSlot}`;
          set((state) => ({
            timetable: {
              ...state.timetable,
              [cellKey]: subject
            }
          }));
          
          get().addHistoryEntry({
            type: 'timetable_updated',
            subject: subject.name,
            description: `Added ${subject.name} to timetable`
          });
          
          // Trigger calendar sync
          get().syncTimetableToCalendar();
        },
        
        removeTimetableEntry: (dayIdx, timeSlot) => {
          const cellKey = `${dayIdx}-${timeSlot}`;
          set((state) => {
            const newTimetable = { ...state.timetable };
            delete newTimetable[cellKey];
            return { timetable: newTimetable };
          });
          
          get().addHistoryEntry({
            type: 'timetable_updated',
            description: 'Updated timetable'
          });
          
          get().syncTimetableToCalendar();
        },

        // ─── CALENDAR EVENTS ────────────────────────────────────────────────
        calendarEvents: [],
        
        setCalendarEvents: (events) => set({ calendarEvents: events }),
        
        syncTimetableToCalendar: () => {
          const { timetable, subjects } = get();
          
          const events = AttendanceEngine.generateCalendarEventsFromTimetable(timetable, subjects);
          set({ calendarEvents: events });
        },

        // ─── ATTENDANCE DATA ────────────────────────────────────────────────
        attendanceData: {},
        
        setAttendanceData: (data) => set({ attendanceData: data }),
        
        markAttendance: (eventId, state) => {
          const newData = AttendanceEngine.markAttendance(eventId, state, get().attendanceData);
          
          set({ attendanceData: newData });
          
          // Update subject stats
          get().updateSubjectStats();
          
          // Update dashboard
          get().updateDashboardStats();
          
          // Add history entry
          const event = get().calendarEvents.find(e => e.id === eventId);
          if (event) {
            const stateLabel = state === 'present' ? '✓ Present' : state === 'absent' ? '✗ Absent' : '◯ Off';
            get().addHistoryEntry({
              type: 'attendance_marked',
              subject: event.subjectName,
              description: `Marked ${event.subjectName} as ${stateLabel}`
            });
          }
        },
        
        markAllForDate: (dateStr, state) => {
          const newData = AttendanceEngine.markAllForDate(dateStr, state, get().calendarEvents, get().attendanceData);
          
          set({ attendanceData: newData });
          
          get().updateSubjectStats();
          get().updateDashboardStats();
          
          const stateLabel = state === 'present' ? 'Present' : state === 'absent' ? 'Absent' : 'Off';
          get().addHistoryEntry({
            type: 'attendance_bulk_marked',
            description: `Marked all classes on ${dateStr} as ${stateLabel}`
          });
        },
        
        clearAttendance: (eventId) => {
          const newData = { ...get().attendanceData };
          delete newData[eventId];
          
          set({ attendanceData: newData });
          
          get().updateSubjectStats();
          get().updateDashboardStats();
          
          const event = get().calendarEvents.find(e => e.id === eventId);
          if (event) {
            get().addHistoryEntry({
              type: 'attendance_cleared',
              subject: event.subjectName,
              description: `Cleared attendance for ${event.subjectName}`
            });
          }
        },

        // ─── DASHBOARD STATS ────────────────────────────────────────────────
        dashboardStats: {
          totalSubjects: 0,
          overallPercentage: 0,
          safeSubjects: 0,
          criticalSubjects: 0,
          warningSubjects: 0,
          present: 0,
          missed: 0,
          total: 0,
          streak: 0,
          todaySchedule: []
        },
        
        updateDashboardStats: () => {
          const { subjects, calendarEvents, attendanceData } = get();
          
          const stats = AttendanceEngine.calculateOverallStats(subjects, calendarEvents, attendanceData);
          
          // Get today's schedule
          const today = AttendanceEngine.formatDate(new Date());
          const todayEvents = AttendanceEngine.getEventsForDate(today, calendarEvents);
          const todaySchedule = todayEvents.map(event => ({
            ...event,
            attendanceState: AttendanceEngine.getAttendanceState(event.id, attendanceData)
          }));
          
          set({
            dashboardStats: {
              totalSubjects: subjects.length,
              overallPercentage: stats.overallPercentage,
              safeSubjects: stats.safeSubjects,
              criticalSubjects: stats.criticalSubjects,
              warningSubjects: stats.warningSubjects,
              present: stats.totalPresent,
              missed: stats.totalAbsent,
              total: stats.totalClasses,
              streak: 0, // TODO: Calculate real streak
              todaySchedule
            }
          });
        },

        // ─── INSIGHTS ───────────────────────────────────────────────────────
        insights: [],
        
        generateInsights: () => {
          const { subjects, calendarEvents, attendanceData } = get();
          
          const insights = AttendanceEngine.generateInsights(subjects, calendarEvents, attendanceData);
          set({ insights });
        },

        // ─── HISTORY ────────────────────────────────────────────────────────
        history: [],
        
        addHistoryEntry: (entry) => {
          const newEntry = {
            id: `history_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...entry
          };
          
          set((state) => ({
            history: [newEntry, ...state.history].slice(0, 100) // Keep last 100 entries
          }));
        },
        
        clearHistory: () => set({ history: [] }),

        // ─── POD.AI SYNC ────────────────────────────────────────────────────
        podaiSyncStatus: {
          connected: false,
          lastSync: null,
          syncing: false,
          error: null
        },
        
        setPodaiSyncStatus: (status) => set((state) => ({
          podaiSyncStatus: { ...state.podaiSyncStatus, ...status }
        })),
        
        syncPodaiSubjects: async (podaiSubjects) => {
          const { subjects } = get();
          const PodAiService = require('../services/podaiService').default;
          
          const merged = PodAiService.mergeSubjects(subjects, podaiSubjects);
          set({ subjects: merged });
          
          get().updateSubjectStats();
          get().updateDashboardStats();
          
          get().addHistoryEntry({
            type: 'podai_synced',
            description: `Imported ${podaiSubjects.length} subjects from Pod.ai`
          });
        },

        // ─── SUBJECT STATS ──────────────────────────────────────────────────
        subjectStats: {},
        
        updateSubjectStats: () => {
          const { subjects, calendarEvents, attendanceData } = get();
          
          const stats = {};
          subjects.forEach(subject => {
            stats[subject.id] = AttendanceEngine.calculateSubjectStats(
              subject.name,
              calendarEvents,
              attendanceData
            );
          });
          
          set({ subjectStats: stats });
        },

        // ─── UTILITY METHODS ────────────────────────────────────────────────
        
        /**
         * Get subject by ID
         */
        getSubject: (subjectId) => {
          return get().subjects.find(s => s.id === subjectId);
        },
        
        /**
         * Get subject stats
         */
        getSubjectStats: (subjectId) => {
          return get().subjectStats[subjectId];
        },
        
        /**
         * Get today's schedule
         */
        getTodaySchedule: () => {
          return get().dashboardStats.todaySchedule;
        },
        
        /**
         * Get safe subjects (attendance >= 75%)
         */
        getSafeSubjects: () => {
          return get().subjects.filter(s => {
            const stats = get().subjectStats[s.id];
            return stats && stats.percentage >= 75;
          });
        },
        
        /**
         * Get critical subjects (attendance < 65%)
         */
        getCriticalSubjects: () => {
          return get().subjects.filter(s => {
            const stats = get().subjectStats[s.id];
            return stats && stats.percentage < 65;
          });
        },
        
        /**
         * Get warning subjects (65% <= attendance < 75%)
         */
        getWarningSubjects: () => {
          return get().subjects.filter(s => {
            const stats = get().subjectStats[s.id];
            return stats && stats.percentage >= 65 && stats.percentage < 75;
          });
        },
        
        /**
         * Calculate recovery requirements
         */
        getRecoveryRequirements: (subjectId) => {
          const subject = get().getSubject(subjectId);
          const stats = get().getSubjectStats(subjectId);
          
          if (!subject || !stats) return null;
          
          const target = subject.criteria || 75;
          if (stats.percentage >= target) return 0;
          
          // Calculate classes needed to reach target
          const needed = Math.ceil(
            (target * stats.total - target * stats.present) / (100 - target)
          );
          
          return Math.max(0, needed);
        },
        
        /**
         * Full sync - recalculate everything
         */
        fullSync: () => {
          get().syncTimetableToCalendar();
          get().updateSubjectStats();
          get().updateDashboardStats();
          get().generateInsights();
        },
        
        /**
         * Reset all data
         */
        reset: () => {
          set({
            subjects: [],
            timetable: {},
            calendarEvents: [],
            attendanceData: {},
            dashboardStats: {
              totalSubjects: 0,
              overallPercentage: 0,
              safeSubjects: 0,
              criticalSubjects: 0,
              warningSubjects: 0,
              present: 0,
              missed: 0,
              total: 0,
              streak: 0,
              todaySchedule: []
            },
            insights: [],
            history: [],
            subjectStats: {},
            podaiSyncStatus: {
              connected: false,
              lastSync: null,
              syncing: false,
              error: null
            }
          });
        }
      }),
      {
        name: 'tracktaps-store',
        version: 1,
        // Persist specific parts of state
        partialize: (state) => ({
          subjects: state.subjects,
          timetable: state.timetable,
          calendarEvents: state.calendarEvents,
          attendanceData: state.attendanceData,
          history: state.history,
          podaiSyncStatus: state.podaiSyncStatus
        })
      }
    )
  )
);

export default useAppStore;
