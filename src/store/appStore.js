import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AttendanceEngine from '../services/attendanceEngine';
import PodAiService from '../services/podaiService';
import authService from '../services/authService';
import syncService from '../services/syncService';

/**
 * Centralized App Store using Zustand
 * Single source of truth for all app data
 */

const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ─── AUTHENTICATION ──────────────────────────────────────────────────
        user: null,
        role: 'USER', // 'USER', 'PREMIUM', 'ADMIN_OWNER'
        subscription: {
          plan: 'free', // 'free' or 'plus'
          status: 'inactive',
          expiryDate: null,
          paymentId: null
        },

        setUser: (user) => set({ user, isAuthLoading: false }),

        login: async () => {
          try {
            const user = await authService.loginWithGoogle();
            set({ user });
            // Initial sync after login
            await get().pullFromCloud();
            return user;
          } catch (error) {
            console.error("Login failed:", error);
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
            set({ user: null });
          } catch (error) {
            console.error("Logout failed:", error);
            throw error;
          }
        },

        initAuth: () => {
          authService.init();
          const unsubscribe = authService.onAuthChange((user) => {
            if (user) {
              const isAdmin = user.email === 'mustan5372@gmail.com' || user.email === 'tracktaps@gmail.com';
              
              // Check if user is banned or should be auto-upgraded (Admin/Owner)
              syncService.fetchFromCloud(user.uid).then(cloudData => {
                if (cloudData && cloudData.banned) {
                  alert("🚫 Your account has been suspended by an administrator.");
                  get().logout();
                  return;
                }

                // Owner/Admin gets auto-premium
                const isOwner = user.email === 'mustan5372@gmail.com' || user.email === 'tracktaps@gmail.com';
                
                const cloudSub = cloudData?.subscription || { plan: 'free', status: 'inactive' };
                const currentSub = get().subscription;

                // Sync subscription if cloud is active or if user is owner
                const updatedSub = isOwner ? {
                  plan: 'plus',
                  planType: 'lifetime',
                  status: 'active',
                  expiryDate: '2099-12-31'
                } : (cloudSub.status === 'active' ? cloudSub : currentSub);

                set({ 
                  user, 
                  isAuthLoading: false,
                  role: isOwner ? 'ADMIN_OWNER' : (updatedSub.status === 'active' ? 'PREMIUM' : 'USER'),
                  subscription: updatedSub
                });
                
                // Auto-sync profile to cloud to ensure Admin Panel has real names
                get().pushToCloud();
              });
              
              // Only pull automatically if local state is empty to avoid overwriting new data
              const { subjects } = get();
              if (subjects.length === 0) {
                get().pullFromCloud(false);
              }
            } else {
              set({ user: null, isAuthLoading: false, role: 'USER' });
            }
          });
          return unsubscribe;
        },

        // ─── CLOUD SYNC ─────────────────────────────────────────────────────
        isSyncing: false,
        lastCloudSync: null,

        pushToCloud: async () => {
          const { user, subjects, timetable, calendarEvents, attendanceData, history, subscription, isSyncing } = get();
          if (!user || isSyncing) return;

          set({ isSyncing: true });
          try {
            // Basic profile info is synced for all logged-in users
            const profileInfo = {
              displayName: user.displayName,
              email: user.email,
              lastSynced: new Date().toISOString()
            };

            let dataToSync = { ...profileInfo };

            // Full data sync is gated for premium users
            if (subscription.plan === 'plus' || subscription.status === 'active') {
              dataToSync = {
                ...dataToSync,
                subjects,
                timetable,
                calendarEvents,
                attendanceData,
                history,
                subscription
              };
            }

            await syncService.saveToCloud(user.uid, dataToSync);
            set({ lastCloudSync: new Date().toISOString(), isSyncing: false });
          } catch (error) {
            console.error("Cloud sync failed:", error);
            set({ isSyncing: false });
          }
        },

        pullFromCloud: async (manual = false) => {
          const { user } = get();
          if (!user) return;

          set({ isSyncing: true });
          try {
            console.log('Fetching from cloud for user:', user.uid);
            const cloudData = await syncService.fetchFromCloud(user.uid);
            console.log('Cloud data received:', cloudData);

            if (cloudData && (cloudData.subjects || cloudData.timetable || cloudData.subscription)) {
              set({
                subjects: cloudData.subjects || [],
                timetable: cloudData.timetable || {},
                calendarEvents: cloudData.calendarEvents || [],
                attendanceData: cloudData.attendanceData || {},
                history: cloudData.history || [],
                subscription: cloudData.subscription || { plan: 'free', status: 'inactive' },
                lastCloudSync: cloudData.lastSynced || new Date().toISOString(),
                isSyncing: false
              });
              
              get().fullSync();
              if (manual) alert('✅ Data Restored Successfully!');
              return true;
            } else {
              set({ isSyncing: false });
              if (manual) alert('ℹ️ No cloud backup found for this account.');
              return false;
            }
          } catch (error) {
            console.error("Pull from cloud failed:", error);
            set({ isSyncing: false });
            if (manual) alert('❌ Restore Failed: ' + error.message);
            return false;
          }
        },

        // ─── SUBSCRIPTION ACTIONS ───────────────────────────────────────────
        setSubscription: (subData) => {
          set({ subscription: subData });
          // Auto-sync after subscription update
          get().pushToCloud();
        },

        isPremium: () => {
          const { subscription } = get();
          return subscription.plan === 'plus' && subscription.status === 'active';
        },

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
          
          // Auto-sync
          get().pushToCloud();
          
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
            
            // Auto-sync
            get().pushToCloud();
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
          
          // Trigger calendar sync and auto-sync
          get().syncTimetableToCalendar();
          get().pushToCloud();
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
          get().pushToCloud();
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
          
          // Auto-sync
          get().pushToCloud();
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
          
          // Auto-sync
          get().pushToCloud();
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
              attendanceData,
              subjects
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
        },

        clearAppData: () => {
          set({
            subjects: [],
            timetable: {},
            calendarEvents: [],
            attendanceData: {},
            history: [],
            subjectStats: {},
            insights: []
          });
          get().fullSync();
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
          podaiSyncStatus: state.podaiSyncStatus,
          user: state.user,
          role: state.role,
          lastCloudSync: state.lastCloudSync,
          subscription: state.subscription
        })
      }
    )
  )
);

export default useAppStore;
