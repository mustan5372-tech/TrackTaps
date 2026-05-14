import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AttendanceEngine from '../services/attendanceEngine';
import PodAiService from '../services/podaiService';
import authService from '../services/authService';
import syncService from '../services/syncService';
import { applyTheme } from '../services/themeEngine';

/**
 * Centralized App Store using Zustand
 * Single source of truth for all app data
 */

const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ─── SEMESTER SETTINGS ───────────────────────────────────────────────
        semesterSettings: {
          startDate: new Date().toISOString().split('T')[0], // Default today
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0], // Default 4 months
          minRequirement: 75,
          workingDays: [1, 2, 3, 4, 5], // Mon-Fri
          holidays: [], // Array of { id, date, name, type: 'holiday' | 'restricted' }
          examPeriods: [], // Array of { id, name, startDate, endDate }
          workingSaturdays: [], // Array of { id, date, name }
        },
        
        theme: 'default',
        setTheme: (themeName) => {
          console.log(`🎨 [ThemeEngine] Switching to: ${themeName}`);
          
          const { subscription } = get();
          const isPremium = subscription?.status === 'active';
          
          // PREMIUM GATING: Allow 'default' and 'light' for everyone. Others require premium.
          if (!isPremium && themeName !== 'default' && themeName !== 'light') {
            console.warn("💎 [ThemeEngine] Theme locked: Premium required.");
            // We return false so the UI can show a modal if needed
            return false; 
          }

          // Apply to DOM instantly
          applyTheme(themeName);
          
          // Update State
          set((state) => ({ 
            theme: themeName,
            subscription: {
              ...state.subscription,
              features: {
                ...state.subscription.features,
                theme: themeName
              }
            }
          }));
          
          // Persist Locally
          localStorage.setItem('tracktaps_theme', themeName);
          
          // Sync to Cloud
          get().pushToCloud();
          
          return true;
        },
        
        setSemesterSettings: (settings) => {
          set((state) => ({
            semesterSettings: { ...state.semesterSettings, ...settings }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        addHoliday: (holiday) => {
          set((state) => ({
            semesterSettings: {
              ...state.semesterSettings,
              holidays: [...state.semesterSettings.holidays, { ...holiday, id: `hol_${Date.now()}` }]
            }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        removeHoliday: (id) => {
          set((state) => ({
            semesterSettings: {
              ...state.semesterSettings,
              holidays: state.semesterSettings.holidays.filter(h => h.id !== id)
            }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        addExamPeriod: (period) => {
          set((state) => ({
            semesterSettings: {
              ...state.semesterSettings,
              examPeriods: [...state.semesterSettings.examPeriods, { ...period, id: `exam_${Date.now()}` }]
            }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        removeExamPeriod: (id) => {
          set((state) => ({
            semesterSettings: {
              ...state.semesterSettings,
              examPeriods: state.semesterSettings.examPeriods.filter(e => e.id !== id)
            }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        addWorkingSaturday: (saturday) => {
          set((state) => ({
            semesterSettings: {
              ...state.semesterSettings,
              workingSaturdays: [...state.semesterSettings.workingSaturdays, { ...saturday, id: `sat_${Date.now()}` }]
            }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        removeWorkingSaturday: (id) => {
          set((state) => ({
            semesterSettings: {
              ...state.semesterSettings,
              workingSaturdays: state.semesterSettings.workingSaturdays.filter(s => s.id !== id)
            }
          }));
          get().fullSync();
          get().pushToCloud();
        },

        // ─── AUTHENTICATION ──────────────────────────────────────────────────
        user: null,
        role: 'USER', // 'USER', 'PREMIUM', 'ADMIN_OWNER'
        subscription: {
          plan: 'free', // 'free' or 'plus'
          status: 'inactive',
          expiryDate: null,
          paymentId: null,
          features: {
            aiUsageLimit: 5, // 5 requests per day for free
            aiRequestsToday: 0,
            aiImportLimit: 1, // 1 import per day for free
            aiImportsToday: 0,
            lastAiImportDate: null,
            hasBadge: false,
            hasGlow: false,
            theme: 'default' // 'default', 'neon', 'sunset', 'forest'
          }
        },

        isAuthLoading: true, 
        isRestoringSession: false, 
        isAuthModalOpen: false,
        setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
        setUser: (user) => set({ user, isAuthLoading: false, isRestoringSession: false }),

        login: async () => {
          set({ isAuthLoading: true });
          try {
            const user = await authService.loginWithGoogle();
            if (user) {
              set({ user, isAuthLoading: false });
              await get().pullFromCloud();
            }
            return user;
          } catch (error) {
            set({ isAuthLoading: false });
            console.error("Login failed:", error);
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
            set({ user: null, role: 'USER', subscription: { plan: 'free', status: 'inactive' } });
          } catch (error) {
            console.error("Logout failed:", error);
            throw error;
          }
        },

        initAuth: async () => {
          console.log("🛠️ [AppStore] initAuth started");
          set({ isAuthLoading: true, isRestoringSession: true });
          
          const timeoutId = setTimeout(() => {
            const { isAuthLoading } = get();
            if (isAuthLoading) {
              console.warn("⚠️ [AppStore] Auth initialization timed out.");
              set({ isAuthLoading: false, isRestoringSession: false });
            }
          }, 15000);

          // 1. Set up the listener FIRST to catch any state changes
          const unsubscribe = authService.onAuthChange((user) => {
            console.log("👤 [AppStore] Auth state change:", user ? user.email : 'No user');
            clearTimeout(timeoutId);

            if (user) {
              get().handleUserAuthenticated(user);
            } else {
              set({ user: null, isAuthLoading: false, isRestoringSession: false, role: 'USER' });
            }
          });

          try {
            // 2. Initialize persistence
            await authService.init();
            
            // 3. Handle redirect results (Mobile Browser Flow)
            const redirectUser = await authService.handleRedirectResult();
            if (redirectUser) {
              console.log("🎯 [AppStore] Redirect User found, applying session...");
              get().handleUserAuthenticated(redirectUser);
            } else {
              console.log("ℹ️ [AppStore] No pending redirect session found.");
            }
          } catch (err) {
            console.error("❌ [AppStore] Auth init failed:", err);
          }

          // Load local theme
          const localTheme = localStorage.getItem('tracktaps_theme') || 'default';
          get().setTheme(localTheme);

          return unsubscribe;
        },

        handleUserAuthenticated: async (user) => {
          // STRICT SECURITY: Only specific email gets Admin Owner role
          const isOwner = user.email === 'mustan5372@gmail.com';
          
          try {
            // Optimized parallel fetch for premium status
            const cloudData = await syncService.fetchFromCloud(user.uid);
            
            if (cloudData && cloudData.banned) {
              alert("🚫 Your account has been suspended by an administrator.");
              get().logout();
              return;
            }

            const cloudSub = cloudData?.subscription || { plan: 'free', status: 'inactive' };
            
            // STRICT SECURITY: If not owner, status must be verified from cloud
            let updatedSub = { ...get().subscription };
            
            if (isOwner) {
              updatedSub = {
                ...updatedSub,
                plan: 'plus',
                planType: 'lifetime',
                status: 'active',
                expiryDate: '2099-12-31'
              };
            } else if (cloudSub && cloudSub.status === 'active') {
              // Only trust cloud for active status
              updatedSub = { ...updatedSub, ...cloudSub };
            } else {
              // Ensure strictly FREE for everyone else
              updatedSub = { 
                ...updatedSub, 
                plan: 'free', 
                status: 'inactive',
                features: {
                  ...updatedSub.features,
                  aiUsageLimit: 5,
                  aiImportLimit: 1,
                  hasBadge: false,
                  hasGlow: false
                }
              };
            }

            set({ 
              user, 
              isAuthLoading: false,
              role: isOwner ? 'ADMIN_OWNER' : (updatedSub.status === 'active' ? 'PREMIUM' : 'USER'),
              subscription: updatedSub
            });

            // Only pull data automatically if local state is empty
            const { subjects } = get();
            if (subjects.length === 0 && cloudData && (cloudData.subjects || cloudData.timetable)) {
              set({
                subjects: cloudData.subjects || [],
                timetable: cloudData.timetable || {},
                calendarEvents: cloudData.calendarEvents || [],
                attendanceData: cloudData.attendanceData || {},
                history: cloudData.history || [],
                lastCloudSync: cloudData.lastSynced || new Date().toISOString()
              });
              get().fullSync();
            }
            
            // Trigger Premium Auto-Sync immediately after auth
            if (updatedSub.status === 'active') {
              get().performAutoPodaiSync();
              // Setup periodic background sync every 20 minutes
              if (!window.podaiSyncTimer) {
                window.podaiSyncTimer = setInterval(() => {
                  get().performAutoPodaiSync();
                }, 20 * 60 * 1000); 
              }
            }
            
            // Background push to ensure cloud has latest profile info
            get().pushToCloud();
          } catch (error) {
            console.error("Auth user processing failed:", error);
            set({ user, isAuthLoading: false }); // Still set user so app is usable
          }
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
          const current = get().subscription;
          set({ 
            subscription: { 
              ...current, 
              ...subData,
              features: {
                ...current.features,
                aiUsageLimit: subData.status === 'active' ? Infinity : 5,
                hasBadge: subData.status === 'active',
                hasGlow: subData.status === 'active'
              }
            },
            role: subData.status === 'active' ? 'PREMIUM' : 'USER'
          });
          get().pushToCloud();
        },

        incrementAiUsage: () => {
          const sub = get().subscription;
          if (sub.status === 'active') return true;
          
          // Reset daily count if date changed
          const today = new Date().toDateString();
          const lastUsed = sub.features.lastAiUsedDate;
          
          let currentToday = sub.features.aiRequestsToday || 0;
          if (lastUsed !== today) {
            currentToday = 0;
          }

          if (currentToday >= sub.features.aiUsageLimit) {
            return false;
          }

          set({
            subscription: {
              ...sub,
              features: {
                ...sub.features,
                aiRequestsToday: currentToday + 1,
                lastAiUsedDate: today
              }
            }
          });
          return true;
        },

        incrementAiImportUsage: () => {
          const sub = get().subscription;
          if (sub.status === 'active') return true;
          
          const today = new Date().toDateString();
          const lastImport = sub.features.lastAiImportDate;
          
          let currentToday = sub.features.aiImportsToday || 0;
          if (lastImport !== today) {
            currentToday = 0;
          }

          if (currentToday >= (sub.features.aiImportLimit || 1)) {
            return false;
          }

          set({
            subscription: {
              ...sub,
              features: {
                ...sub.features,
                aiImportsToday: currentToday + 1,
                lastAiImportDate: today
              }
            }
          });
          return true;
        },


        isPremium: () => {
          const { subscription } = get();
          return subscription.status === 'active';
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
          if (!subject) return;

          const subjectName = subject.name;

          set((state) => {
            // 1. Filter subjects
            const newSubjects = state.subjects.filter(s => s.id !== subjectId);
            
            // 2. Filter timetable
            const newTimetable = { ...state.timetable };
            Object.keys(newTimetable).forEach(key => {
              if (newTimetable[key].name === subjectName) {
                delete newTimetable[key];
              }
            });

            // 3. Filter attendanceData
            // We need to find all calendar events for this subject to know which IDs to remove
            const eventIdsToRemove = state.calendarEvents
              .filter(e => e.subjectName === subjectName)
              .map(e => e.id);
            
            const newAttendanceData = { ...state.attendanceData };
            eventIdsToRemove.forEach(id => {
              delete newAttendanceData[id];
            });

            return {
              subjects: newSubjects,
              timetable: newTimetable,
              attendanceData: newAttendanceData
            };
          });
          
          get().addHistoryEntry({
            type: 'subject_deleted',
            subject: subjectName,
            description: `Deleted subject: ${subjectName} and cleared all related data.`
          });
          
          // Refresh everything
          get().fullSync();
          
          // Auto-sync to cloud
          get().pushToCloud();
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

        syncTimetableToCalendar: () => {
          const { timetable, subjects, semesterSettings } = get();
          
          const events = AttendanceEngine.generateCalendarEventsFromTimetable(timetable, subjects, semesterSettings);
          set({ calendarEvents: events });
        },

        // ─── SEMESTER STATS ──────────────────────────────────────────────────
        semesterStats: {},
        
        updateSemesterStats: () => {
          const { subjects, semesterSettings, timetable, calendarEvents, attendanceData } = get();
          
          const stats = {};
          subjects.forEach(subject => {
            stats[subject.id] = AttendanceEngine.calculateSemesterSubjectMetrics(
              subject.name,
              semesterSettings,
              timetable,
              calendarEvents,
              attendanceData,
              subjects
            );
          });
          
          set({ semesterStats: stats });
        },

        // ─── ATTENDANCE DATA ────────────────────────────────────────────────
        attendanceData: {},
        
        setAttendanceData: (data) => set({ attendanceData: data }),
        
        markAttendance: (eventId, state) => {
          const newData = AttendanceEngine.markAttendance(eventId, state, get().attendanceData);
          
          set({ attendanceData: newData });
          
          // Update subject stats
          get().updateSubjectStats();
          
          // Update semester stats (bunk counts)
          get().updateSemesterStats();
          
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
          get().updateSemesterStats();
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
          get().updateSemesterStats();
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

        // ─── NOTIFICATIONS ──────────────────────────────────────────────────
        toast: null, // { message, type: 'success' | 'error' | 'info', visible: boolean }
        showToast: (message, type = 'success') => {
          set({ toast: { message, type, visible: true } });
          setTimeout(() => {
            set({ toast: { ...get().toast, visible: false } });
          }, 4000);
        },

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

        /**
         * Automatic background sync for premium users
         */
        performAutoPodaiSync: async () => {
          const { subscription, podaiSyncStatus } = get();
          const token = localStorage.getItem('pod_auth_token');
          
          // Only sync if premium and connected
          if (subscription.status !== 'active' || !token || podaiSyncStatus.syncing) {
            return;
          }

          console.log("🔄 [AppStore] Starting Premium Auto-Sync...");
          set({ podaiSyncStatus: { ...podaiSyncStatus, syncing: true, error: null } });

          try {
            // 1. Fetch Classrooms
            const classRes = await fetch('/api/pod/classrooms', {
              headers: { 'Authorization': `Token ${token}` }
            });
            if (!classRes.ok) throw new Error("Connection failed");
            const classData = await classRes.json();
            const classrooms = classData.classrooms || [];

            if (classrooms.length === 0) {
              set({ podaiSyncStatus: { ...get().podaiSyncStatus, syncing: false } });
              return;
            }

            // 2. Fetch Attendance for each classroom in parallel
            const attendanceResults = {};
            await Promise.all(classrooms.map(async (classroom) => {
              try {
                const attRes = await fetch(`/api/pod/attendance?classroom=${classroom.token}`, {
                  headers: { 'Authorization': `Token ${token}` }
                });
                if (attRes.ok) {
                  const attData = await attRes.json();
                  attendanceResults[classroom.token] = {
                    total: attData.total || 0,
                    attended: attData.attended || 0,
                    avgAttendance: attData.averagePercent || 0,
                    missed: attData.missed || 0
                  };
                }
              } catch (e) {
                console.warn(`Failed to sync classroom ${classroom.token}`);
              }
            }));

            // 3. Merge and Update
            const subjectsToSync = classrooms.map(classroom => ({
              token: classroom.token,
              title: classroom.title,
              ...(attendanceResults[classroom.token] || { total: 0, attended: 0, avgAttendance: 0, missed: 0 })
            }));

            const { subjects } = get();
            const merged = PodAiService.mergeSubjects(subjects, subjectsToSync);
            
            set({ 
              subjects: merged,
              podaiSyncStatus: {
                connected: true,
                syncing: false,
                lastSync: new Date().toISOString(),
                error: null
              }
            });

            get().fullSync();
            get().pushToCloud();
            
            // Notify user of success
            get().showToast("✨ Pod.ai attendance synced successfully!", "success");
            
            console.log("✅ [AppStore] Premium Auto-Sync complete");
          } catch (error) {
            console.error("❌ [AppStore] Auto-Sync failed:", error);
            set({ podaiSyncStatus: { ...get().podaiSyncStatus, syncing: false, error: error.message } });
          }
        },
        
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
            (target * stats.total - 100 * stats.present) / (100 - target)
          );
          
          return Math.max(0, stats.total === 0 ? 1 : needed);
        },
        
        /**
         * Full sync - recalculate everything
         */
        fullSync: () => {
          get().syncTimetableToCalendar();
          get().updateSubjectStats();
          get().updateSemesterStats();
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
