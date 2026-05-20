import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AttendanceEngine from '../services/attendanceEngine';
import PodAiService from '../services/podaiService';
import authService from '../services/authService';
import syncService from '../services/syncService';
import { applyTheme } from '../services/themeEngine';
import { calculateAttendanceStats } from '../utils/attendanceUtils';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import presenceService from '../services/presenceService';

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
        
        // ─── GLOBAL ATTENDANCE SETTINGS ──────────────────────────────────────
        attendanceSettings: {
          defaultTarget: 75,
          warningLevel: 80,
          criticalLevel: 65,
        },
        setAttendanceSettings: (settings) => {
          set((state) => ({
            attendanceSettings: { ...state.attendanceSettings, ...settings }
          }));
          get().fullSync();
          get().pushToCloud();
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
        role: 'user', // 'user', 'core', 'admin'
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
        
        // ─── REFERRAL SYSTEM ───────────────────────────────────────────────
        referralData: {
          referralId: null, // Format: TT-XXXXXX
          referralCode: null, // Format: XXXXXX
          invitedBy: null,
          referrals: [], // Array of { uid, status: 'joined' | 'verified' | 'synced', date }
          claimedRewards: [], // Array of { rewardId, date }
          totalValidReferrals: 0,
          analytics: {
            totalInvitesShared: 0,
            totalSignups: 0,
            activeUsers: 0,
            validReferrals: 0
          },
          campaignActive: true,
          campaignEndDate: '2026-12-31',
          referralCampaignCompleted: false,
          referralRewardClaimed: false
        },

        isAuthLoading: true, 
        isRestoringSession: false, 
        isSigningOut: false,
        isAuthModalOpen: false,
        termsAccepted: false, // Will be loaded from cloud/persist on login
        termsVersion: '',
        CURRENT_TERMS_VERSION: 'v1.0', // Centralized terms version constant
        isOffline: !navigator.onLine,
        pendingCloudSync: false,
        
        setOffline: (status) => {
          set({ isOffline: status });
          if (!status && get().pendingCloudSync && get().user) {
            console.log("📶 [Network] Back online! Triggering pending sync...");
            get().pushToCloud();
          }
        },
        
        setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
        setUser: (user) => set({ user, isAuthLoading: false, isRestoringSession: false }),

        acceptTerms: async (marketingConsent = false) => {
          const user = get().user;
          if (!user) return;
          
          const currentVersion = get().CURRENT_TERMS_VERSION;
          
          // Immediately update local state
          set({ 
            termsAccepted: true, 
            termsVersion: currentVersion 
          });
          
          // Persist to Firestore as a dedicated write (not via pushToCloud which may be premium-gated)
          try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
              termsAccepted: true,
              termsAcceptedAt: new Date().toISOString(),
              privacyAccepted: true,
              termsVersion: currentVersion,
              marketingConsent
            }, { merge: true });
            console.log("📜 [Terms] Accepted and persisted to Firestore successfully!");
          } catch (e) {
            console.error("❌ [Terms] Failed to persist terms acceptance to Firestore:", e);
            // Local state is already set, so the modal won't reappear this session
            // It will be retried on next login via handleUserAuthenticated
          }
        },

         login: async () => {
          set({ isAuthLoading: true });
          try {
            const user = await authService.loginWithGoogle();
            if (user) {
              console.log("👤 [AppStore] Login Success:", user.email);
              
              // Restore data from cloud first so it is available before isAuthLoading becomes false
              try {
                console.log("📥 [AuthStore] Restoring cloud backup during login...");
                await get().pullFromCloud();
              } catch (err) {
                console.error("Cloud restore failed during login:", err);
              }

              // Set user, clear loading, and close auth modal atomically
              set({ user, isAuthLoading: false, isAuthModalOpen: false });
            } else {
              set({ isAuthLoading: false });
            }
            return user;
          } catch (error) {
            set({ isAuthLoading: false });
            console.error("Login failed:", error);
            throw error;
          }
        },

        logout: async () => {
          set({ isSigningOut: true });
          
          // 0. Stop presence heartbeat immediately
          try {
            const currentUser = get().user;
            if (currentUser) {
              await presenceService.goOffline(currentUser.uid);
            }
          } catch (e) {
            console.warn("⚠️ [Logout] Presence offline failed:", e);
          }

          // 1. Stop any background sync timers safely
          try {
            if (window.podaiSyncTimer) {
              clearInterval(window.podaiSyncTimer);
              window.podaiSyncTimer = null;
            }
          } catch (e) {
            console.warn("⚠️ [Logout] Timer clear failed:", e);
          }

          // 2. Sign out from Firebase + Native Google
          try {
            await authService.logout();
          } catch (e) {
            console.error("❌ [Logout] authService.logout failed:", e);
          }

          // 3. Clear all app data (subjects, attendance, etc.)
          try {
            get().clearAppData();
          } catch (e) {
            console.error("❌ [Logout] clearAppData failed:", e);
          }
          
          // 4. Clear all cached storage to secure authentication privacy
          try {
            const onboardingVal = localStorage.getItem('tracktaps_completed_tour');
            localStorage.clear();
            if (onboardingVal) {
              localStorage.setItem('tracktaps_completed_tour', onboardingVal);
            }
          } catch (e) {
            console.warn("⚠️ [Logout] localStorage clear non-critical:", e);
          }

          // 5. ATOMIC state reset — sets user=null which triggers SafeRoute redirect to /
          // Do NOT set isAuthLoading=true at any point during logout to keep WebView stable
          try {
            set({ 
              user: null, 
              role: 'user', 
              subscription: { plan: 'free', status: 'inactive', expiryDate: null, paymentId: null, features: { aiUsageLimit: 5, aiRequestsToday: 0, aiImportLimit: 1, aiImportsToday: 0, lastAiImportDate: null, hasBadge: false, hasGlow: false, theme: 'default' } }, 
              isAuthLoading: false, 
              isSigningOut: false,
              termsAccepted: false,
              termsVersion: ''
            });
            console.log("✅ [Auth] Logout complete. User is now in guest mode.");
          } catch (e) {
            console.error("❌ [Logout] Atomic state set failed:", e);
            set({ isAuthLoading: false, isSigningOut: false });
          }
        },


        initAuth: async () => {
          set({ isAuthLoading: true, isRestoringSession: true });
          
          // Safety Timeout: Prevent permanent "Initializing" screen
          const authTimeout = setTimeout(() => {
            const { user, isAuthLoading } = get();
            if (isAuthLoading && !user) {
              console.warn("⚠️ [AuthStore] Auth initialization timed out. Proceeding as Guest.");
              set({ isAuthLoading: false, isRestoringSession: false });
            }
          }, 8000); // 8 seconds is plenty for most redirects/persistence checks

          try {
            // 1. Initialize Persistence (Critical for session recovery after redirect)
            await authService.init();
            
            // 2. Handle Redirect Result (Catch users returning from Google)
            const redirectUser = await authService.handleRedirectResult();
            if (redirectUser) {
              console.log("🎯 [AuthStore] Caught Redirect User:", redirectUser.email);
              await get().handleUserAuthenticated(redirectUser);
              clearTimeout(authTimeout);
              return; // We are done, handleUserAuthenticated sets loading to false
            }
          } catch (err) {
            console.error("❌ [AuthStore] Initial Redirect/Persistence check failed:", err);
          }

          // 3. Set up the ongoing listener
          const unsubscribe = authService.onAuthChange(async (user) => {
            clearTimeout(authTimeout);
            if (user) {
              console.log("👤 [AuthStore] Active Session Found:", user.email);
              await get().handleUserAuthenticated(user);
            } else {
              // If we are currently signing out, the logout() method already
              // handles all state cleanup atomically. Don't duplicate it here.
              if (get().isSigningOut) {
                console.log("👤 [AuthStore] onAuthChange fired during active logout — skipping (handled by logout())");
                return;
              }
              console.log("👤 [AuthStore] No Active Session");
              set({ user: null, role: 'user', isAuthLoading: false, isRestoringSession: false, termsAccepted: false, termsVersion: '' });
            }
          });

          // Theme initialization
          const localTheme = localStorage.getItem('tracktaps_theme') || 'default';
          get().setTheme(localTheme);
          
          // Network Listeners
          const handleOnline = () => get().setOffline(false);
          const handleOffline = () => get().setOffline(true);
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);

          return () => {
             unsubscribe();
             window.removeEventListener('online', handleOnline);
             window.removeEventListener('offline', handleOffline);
          };
        },

        handleUserAuthenticated: async (user) => {
          try {
            // Optimized parallel fetch for premium status
            const cloudData = await syncService.fetchFromCloud(user.uid);
            
            if (cloudData && cloudData.banned) {
              alert("🚫 Your account has been suspended by an administrator.");
              get().logout();
              return;
            }

            // ROLE IDENTIFICATION
            // Roles are now fetched dynamically from Firestore database
            let dbRole = cloudData?.role || 'user';
            
            // SECURITY PATCH: Auto-elevate authorized emails to proper roles immediately
            const ownerEmails = ['tracktaps@gmail.com'];
            const coreEmails = ['mustan5372@gmail.com', 'purandarydv23@gmail.com', 'pgxdh42@gmail.com'];
            
            if (ownerEmails.includes(user.email)) {
              dbRole = 'owner';
            } else if (coreEmails.includes(user.email)) {
              dbRole = 'core_admin';
            } else if (dbRole === 'admin') {
              dbRole = 'owner'; // Migrate legacy role
            } else if (dbRole === 'core') {
              dbRole = 'core_admin'; // Migrate legacy role
            }

            const cloudSub = cloudData?.subscription || { plan: 'free', status: 'inactive' };
            
            // STRICT SECURITY: Determine subscription and role
            let updatedSub = { ...get().subscription };
            let updatedRole = dbRole; // Uses 'owner', 'core_admin', or 'user'
            
            if (dbRole === 'owner' || dbRole === 'core_admin') {
              updatedSub = {
                ...updatedSub,
                plan: 'plus',
                planType: 'lifetime',
                status: 'active',
                expiryDate: '2099-12-31'
              };
            } else if (cloudSub && cloudSub.status === 'active') {
              updatedSub = { ...updatedSub, ...cloudSub };
              // Keeps updatedRole as 'user' but updates subscription
            } else {
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


            const localTermsAccepted = get().termsAccepted;
            const localTermsVersion = get().termsVersion;
            
            const cloudTermsAccepted = cloudData?.termsAccepted || false;
            const cloudTermsVersion = cloudData?.termsVersion || '';

            // Double-layered merge: if accepted either locally or in cloud, mark as accepted
            const resolvedTermsAccepted = localTermsAccepted || cloudTermsAccepted;
            const resolvedTermsVersion = resolvedTermsAccepted 
              ? (cloudTermsVersion || localTermsVersion || 'v1.0') 
              : '';

            // Self-healing back-sync: if accepted locally but cloud is missing it, push to Firestore
            if (localTermsAccepted && !cloudTermsAccepted) {
              const currentVersion = get().CURRENT_TERMS_VERSION || 'v1.0';
              (async () => {
                try {
                  const { doc, setDoc } = await import('firebase/firestore');
                  const { db } = await import('../services/firebase');
                  const userRef = doc(db, 'users', user.uid);
                  await setDoc(userRef, {
                    termsAccepted: true,
                    termsAcceptedAt: new Date().toISOString(),
                    privacyAccepted: true,
                    termsVersion: currentVersion
                  }, { merge: true });
                  console.log("📜 [Terms] Back-synced local terms acceptance to Firestore successfully!");
                } catch (e) {
                  console.warn("⚠️ [Terms] Failed to back-sync local terms to Firestore:", e);
                }
              })();
            }

            // Construct atomic state update object
            const atomicStateUpdate = {
              user,
              isAuthLoading: false,
              role: updatedRole,
              subscription: updatedSub,
              termsAccepted: resolvedTermsAccepted,
              termsVersion: resolvedTermsVersion
            };

            // If local subjects are empty, merge cloud data atomically to prevent blank screen flash / UI race conditions
            const currentSubjects = get().subjects || [];
            if (currentSubjects.length === 0 && cloudData && (cloudData.subjects || cloudData.timetable)) {
              console.log("📥 [AuthStore] Merging cloud data atomically into initial state...");
              atomicStateUpdate.subjects = cloudData.subjects || [];
              atomicStateUpdate.timetable = cloudData.timetable || {};
              atomicStateUpdate.calendarEvents = cloudData.calendarEvents || [];
              atomicStateUpdate.attendanceData = cloudData.attendanceData || {};
              atomicStateUpdate.history = cloudData.history || [];
              atomicStateUpdate.lastCloudSync = cloudData.lastSynced || new Date().toISOString();
            }

            // Sync referral data atomically if present
            if (cloudData && cloudData.referralData) {
              console.log("💎 [Referral] Syncing permanent identity from cloud atomically...");
              atomicStateUpdate.referralData = {
                ...get().referralData,
                ...cloudData.referralData
              };
            }

            // Trigger atomic state update
            set(atomicStateUpdate);

            // Trigger full sync calculations post-atomic update
            get().fullSync();

            // 📊 Track Analytics Conversions in Background
            try {
              import('../services/analyticsService').then((m) => {
                const analytics = m.default;
                analytics.trackLoginConversion(user.uid);
                if (updatedSub.status === 'active') {
                  analytics.trackPremiumConversion();
                }
              }).catch(() => {});
            } catch (e) {}

            // BULLETPROOF REFERRAL INITIALIZATION (ENSURES PERMANENCE)
            await get().ensureReferralData();

            // GROWTH PHASE: Track Referral if new user
            const inviteCode = sessionStorage.getItem('tracktaps_invited_by');
            const isNewUser = !cloudData || Object.keys(cloudData).length === 0;
            if (isNewUser && inviteCode) {
                import('../services/referralService').then(m => {
                  const referralService = m.default;
                  referralService.trackNewReferral(user.uid, inviteCode).then(inviterUid => {
                    if (inviterUid) {
                      set(state => ({
                        referralData: { ...state.referralData, invitedBy: inviterUid }
                      }));
                      sessionStorage.removeItem('tracktaps_invited_by');
                      get().pushToCloud();
                    }
                  });
                });
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

            // START PRESENCE TRACKING
            try {
              presenceService.goOnline(user.uid);
              presenceService.setupLifecycleListeners(user.uid);
            } catch (e) {
              console.warn('⚠️ [Presence] Setup failed:', e);
            }
          } catch (error) {
            console.error("Auth user processing failed:", error);
            set({ user, isAuthLoading: false }); // Still set user so app is usable
          }
        },

        // ─── CLOUD SYNC ─────────────────────────────────────────────────────
        isSyncing: false,
        lastCloudSync: null,

        pushToCloud: async (manual = false) => {
          const { user, subjects, timetable, calendarEvents, attendanceData, history, subscription, isSyncing, isOffline } = get();
          if (!user || isSyncing) return;
          
          if (isOffline) {
            console.log("📴 [CloudSync] Offline. Marking for pending sync.");
            set({ pendingCloudSync: true });
            return;
          }

          set({ isSyncing: true, pendingCloudSync: false });
          try {
            console.log("📤 [CloudSync] Starting backup...");
            
            // Basic profile info is synced for all logged-in users
            const profileInfo = {
              displayName: user.displayName,
              email: user.email,
              role: get().role, 
              lastSynced: new Date().toISOString()
            };

            let dataToSync = { ...profileInfo };

            // Full data sync is gated for premium users
            const isPremium = subscription.plan === 'plus' || subscription.status === 'active';
            if (isPremium) {
              const stats = calculateAttendanceStats(subjects, calendarEvents, attendanceData);
              // Fallback for activity score if not defined
              const activityScore = typeof calculateActivityScore === 'function' ? calculateActivityScore(subjects, attendanceData) : 0;
              
              dataToSync = {
                ...dataToSync,
                subjects,
                timetable,
                calendarEvents,
                attendanceData,
                history,
                subscription,
                overallAttendance: stats.overallPercentage,
                totalClasses: stats.totalClasses,
                attendanceStreak: get().dashboardStats.attendanceStreak, // RETENTION: Track consistency milestones
                activityScore: activityScore,
                referralData: get().referralData, // GROWTH: Track referrals
                lastSyncDate: new Date().toISOString()
              };
            }

            await syncService.saveToCloud(user.uid, dataToSync);
            set({ lastCloudSync: new Date().toISOString(), pendingCloudSync: false });
            
            if (manual) {
              get().showToast('Data Backed Up Successfully!', 'success');
            }
          } catch (error) {
            console.error("Cloud sync failed:", error);
            set({ pendingCloudSync: true });
            if (manual) get().showToast('Backup pending: Network unstable', 'warning');
          } finally {
            set({ isSyncing: false });
          }
        },

        pullFromCloud: async (manual = false) => {
          const { user, isOffline } = get();
          if (!user) return;
          
          if (isOffline) {
            if (manual) get().showToast('Cannot restore while offline', 'warning');
            return false;
          }

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
                referralData: {
                  ...get().referralData,
                  ...(cloudData.referralData || {})
                },
                lastCloudSync: cloudData.lastSynced || new Date().toISOString(),
                isSyncing: false
              });
              
              get().fullSync();
              if (manual) get().showToast('Data Restored Successfully!', 'success');
              return true;
            } else {
              set({ isSyncing: false });
              if (manual) get().showToast('No cloud backup found', 'info');
              return false;
            }
          } catch (error) {
            console.error("Pull from cloud failed:", error);
            set({ isSyncing: false });
            if (manual) get().showToast('Restore Failed: ' + error.message, 'error');
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
            role: subData.status === 'active' ? 'user' : 'user'
          });
          
          if (subData.status === 'active') {
            try {
              import('../services/analyticsService').then(m => m.default.trackPremiumConversion()).catch(() => {});
            } catch (e) {}
          }

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
          const { timetable, subjects, semesterSettings, attendanceSettings } = get();
          
          const events = AttendanceEngine.generateCalendarEventsFromTimetable(timetable, subjects, semesterSettings, attendanceSettings);
          set({ calendarEvents: events });
        },

        // ─── SEMESTER STATS ──────────────────────────────────────────────────
        semesterStats: {},
        
        updateSemesterStats: () => {
          const { subjects, semesterSettings, timetable, calendarEvents, attendanceData, attendanceSettings } = get();
          
          const stats = {};
          subjects.forEach(subject => {
            stats[subject.id] = AttendanceEngine.calculateSemesterSubjectMetrics(
              subject.name,
              semesterSettings,
              timetable,
              calendarEvents,
              attendanceData,
              subjects,
              attendanceSettings
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
          
          // Update stats
          get().updateSubjectStats();
          get().updateSemesterStats();
          get().updateDashboardStats();
          
          // Add detailed history entry
          const event = get().calendarEvents.find(e => e.id === eventId);
          if (event) {
            const stateLabel = state === 'present' ? '✓ Present' : state === 'absent' ? '✗ Absent' : '◯ Off';
            get().addHistoryEntry({
              type: 'attendance_marked',
              subject: event.subjectName,
              description: `Marked ${event.subjectName} as ${stateLabel}`
            });
          }
          
          // Cloud Sync
          get().pushToCloud();

          // RETENTION: Streak Celebration
          if (state === 'present') {
            const currentStreak = get().dashboardStats.attendanceStreak;
            if (currentStreak > 0) {
              const messages = [
                `That's a ${currentStreak}-day win! 🔥`,
                `Consistency King! 👑`,
                `The streak continues... ⚡`,
                `Academic Elite mode active! 💎`
              ];
              const randomMsg = messages[Math.floor(Math.random() * messages.length)];
              get().showToast(randomMsg, 'success');
            }
          }
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
          attendanceStreak: 0,
          dailyImpact: null,
          todaySchedule: []
        },
        
        updateDashboardStats: () => {
          const { subjects, calendarEvents, attendanceData, attendanceSettings } = get();
          
          const stats = calculateAttendanceStats(subjects, calendarEvents, attendanceData);
          const attendanceStreak = AttendanceEngine.calculateAttendanceStreak(attendanceData);
          const dailyImpact = AttendanceEngine.getDailyAttendanceImpact(subjects, calendarEvents, attendanceData, attendanceSettings);

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
              safeSubjects: subjects.filter(s => {
                const sStats = get().subjectStats[s.id];
                return sStats && sStats.percentage >= (s.criteria || attendanceSettings?.defaultTarget || 75);
              }).length,
              criticalSubjects: subjects.filter(s => {
                const sStats = get().subjectStats[s.id];
                return sStats && sStats.percentage < (attendanceSettings?.criticalLevel || 65);
              }).length,
              warningSubjects: subjects.filter(s => {
                const sStats = get().subjectStats[s.id];
                return sStats && sStats.percentage >= (attendanceSettings?.criticalLevel || 65) && sStats.percentage < (s.criteria || attendanceSettings?.defaultTarget || 75);
              }).length,
              present: stats.totalPresent,
              missed: stats.totalClasses - stats.totalPresent,
              total: stats.totalClasses,
              streak: attendanceStreak, // Syncing with legacy streak field
              attendanceStreak,
              dailyImpact,
              todaySchedule
            }
          });
        },

        // ─── INSIGHTS ───────────────────────────────────────────────────────
        insights: [],
        
        generateInsights: () => {
          const { subjects, calendarEvents, attendanceData, attendanceSettings } = get();
          
          const insights = AttendanceEngine.generateInsights(subjects, calendarEvents, attendanceData, attendanceSettings);
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
         * Enforces a 6-hour cooldown to prevent API spam
         */
        performAutoPodaiSync: async (force = false) => {
          const { subscription, podaiSyncStatus, isOffline } = get();
          const token = localStorage.getItem('pod_auth_token');
          
          // 1. Basic checks
          if (subscription.status !== 'active' || !token || podaiSyncStatus.syncing) {
            return;
          }
          
          if (isOffline) {
            console.log("📴 [PodSync] Offline. Skipping auto-sync.");
            return;
          }

          // 2. Interval Check (6 Hours = 21,600,000 ms)
          const SIX_HOURS = 6 * 60 * 60 * 1000;
          const now = Date.now();
          const lastSyncTime = podaiSyncStatus.lastSync ? new Date(podaiSyncStatus.lastSync).getTime() : 0;
          
          if (!force && (now - lastSyncTime < SIX_HOURS)) {
            console.log("⏱️ [AppStore] Skipping auto-sync (Cooldown active). Next sync in", Math.round((SIX_HOURS - (now - lastSyncTime)) / 60000), "mins.");
            return;
          }

          console.log("🔄 [AppStore] Starting Safe Premium Auto-Sync...");
          set({ podaiSyncStatus: { ...podaiSyncStatus, syncing: true, error: null } });

          try {
            // 1. Fetch Classrooms
            const classRes = await fetch('/api/pod/classrooms', {
              headers: { 'Authorization': `Token ${token}` }
            });
            
            const classText = await classRes.text();
            if (!classRes.ok || !classText) {
              throw new Error(`Connection failed (${classRes.status}). Ensure backend is on port 3001.`);
            }

            let classData;
            try {
              classData = JSON.parse(classText);
            } catch (e) {
              throw new Error("Invalid response format from classrooms API.");
            }
            
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
                  const attText = await attRes.text();
                  if (attText) {
                    const attData = JSON.parse(attText);
                    attendanceResults[classroom.token] = {
                      total: attData.total || 0,
                      attended: attData.attended || 0,
                      avgAttendance: attData.averagePercent || 0,
                      missed: attData.missed || 0,
                      success: true
                    };
                  } else { attendanceResults[classroom.token] = { success: false }; }
                } else { attendanceResults[classroom.token] = { success: false }; }
              } catch (e) {
                console.warn(`Failed to sync classroom ${classroom.token}`);
                attendanceResults[classroom.token] = { success: false };
              }
            }));

            // 3. Merge and Update
            const subjectsToSync = classrooms.map(classroom => ({
              token: classroom.token,
              title: classroom.title,
              ...(attendanceResults[classroom.token] || { success: false })
            })).filter(sub => sub.success !== false);
            
            if (subjectsToSync.length === 0) {
              console.log("⚠️ [AppStore] No valid attendance data fetched. Aborting sync.");
              set({ podaiSyncStatus: { ...get().podaiSyncStatus, syncing: false } });
              return;
            }

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
            
            // GROWTH PHASE: Validate Referral on successful Pod.ai Sync
            const { referralData, user } = get();
            if (referralData.invitedBy && !referralData.referralCampaignCompleted) {
              import('../services/referralService').then(m => {
                const referralService = m.default;
                // Get the Pod.ai email from localStorage (cached during login)
                const podEmail = localStorage.getItem('pod_username'); 
                referralService.validateReferral(user.uid, referralData.invitedBy, podEmail);
              });
            }

            // Notify user of success
            get().showToast("✨ Pod.ai attendance synced successfully!", "success");
            
            console.log("✅ [AppStore] Premium Auto-Sync complete");
          } catch (error) {
            console.error("❌ [AppStore] Auto-Sync failed:", error);
            set({ podaiSyncStatus: { ...get().podaiSyncStatus, syncing: false, error: error.message } });
          }
        },
        
        /**
         * 💎 GROWTH PHASE: Ensure user has a valid referral identity (PERMANENT)
         * Optimized for speed & persistence: 
         * 1. Check State -> 2. Check LocalStorage (Instant) -> 3. Background Cloud Reconcile
         */
        ensureReferralData: () => {
          const { user, referralData } = get();
          if (!user) return;

          // 🛡️ RECURSION GUARD
          if (window._isEnsuringReferral) return;
          
          // 🛡️ STAGE 1: Already in memory? Done.
          if (referralData?.referralId && referralData?.referralCode) {
            return;
          }

          window._isEnsuringReferral = true;

          // 🛡️ STAGE 2: Instant Consistency via LocalStorage Cache
          const cacheKey = `tt_ref_${user.uid}`;
          const cachedData = localStorage.getItem(cacheKey);
          
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData);
              if (parsed.referralId && parsed.referralCode) {
                console.log("⚡ [Referral] Instant Recovery from LocalCache:", parsed.referralId);
                set({ referralData: parsed });
                // We still fall through to sync with cloud in background to be safe
              }
            } catch (e) {
              localStorage.removeItem(cacheKey);
            }
          }

          // 🛡️ STAGE 3: If still no code (new session/new device), generate one immediately
          if (!get().referralData?.referralCode) {
            console.log("✨ [Referral] Generating new session identity...");
            const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
              code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const referralId = `TT-${code}`;
            const initialData = { ...referralData, referralId, referralCode: code };
            
            set({ referralData: initialData });
            localStorage.setItem(cacheKey, JSON.stringify(initialData));
          }

          // 🛡️ STAGE 4: Background Cloud Reconciliation (Truth Source)
          const reconcile = async () => {
            try {
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userRef);
              const cloudData = userSnap.exists() ? userSnap.data() : {};
              const cloudReferral = cloudData.referralData || {};

              if (cloudReferral.referralId && cloudReferral.referralCode) {
                // Cloud is the master. If it differs, we override.
                if (cloudReferral.referralId !== get().referralData?.referralId) {
                   console.log("💎 [Referral] Cloud Truth recovered, overriding session identity.");
                   set({ referralData: cloudReferral });
                   localStorage.setItem(cacheKey, JSON.stringify(cloudReferral));
                }
              } else {
                // Cloud is empty, we lock our generated identity forever
                console.log("📤 [Referral] Locking session identity to cloud permanently.");
                await setDoc(userRef, { referralData: get().referralData }, { merge: true });
              }
            } catch (error) {
              console.error("❌ [Referral] Reconciliation failed:", error);
            } finally {
              window._isEnsuringReferral = false;
            }
          };

          reconcile();
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
         * Wrapped in try-catch to prevent global app crashes if data is malformed
         */
        fullSync: () => {
          try {
            console.log("🔄 [AppStore] Performing Full Sync...");
            get().syncTimetableToCalendar();
            get().updateSubjectStats();
            get().updateSemesterStats();
            get().updateDashboardStats();
            get().generateInsights();
            console.log("✅ [AppStore] Full Sync Complete");
          } catch (error) {
            console.error("❌ [AppStore] Full Sync failed critically:", error);
            // We don't throw here to prevent the UI from blanking out
          }
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
            insights: [],
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
              attendanceStreak: 0,
              dailyImpact: null,
              todaySchedule: []
            },
            semesterSettings: {
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
              minRequirement: 75,
              workingDays: [1, 2, 3, 4, 5],
              holidays: [],
              examPeriods: [],
              workingSaturdays: [],
            },
            attendanceSettings: {
              defaultTarget: 75,
              warningLevel: 80,
              criticalLevel: 65,
            },
            referralData: {
              referralId: null,
              referralCode: null,
              invitedBy: null,
              referrals: [],
              claimedRewards: [],
              totalValidReferrals: 0,
              analytics: {
                totalInvitesShared: 0,
                totalSignups: 0,
                activeUsers: 0,
                validReferrals: 0
              },
              campaignActive: true,
              campaignEndDate: '2026-12-31',
              referralCampaignCompleted: false,
              referralRewardClaimed: false
            },
            podaiSyncStatus: {
              connected: false,
              lastSync: null,
              syncing: false,
              error: null
            },
            termsAccepted: false,
            termsVersion: '',
            lastCloudSync: null
          });
          
          // Clear any persistent local theme configs
          localStorage.removeItem('tracktaps_theme');
          try {
            sessionStorage.clear();
          } catch (e) {}
        }
      }),
      {
        name: 'tracktaps-store',
        version: 2,
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
          subscription: state.subscription,
          // CRITICAL: Persist terms acceptance so modal doesn't reappear on reload
          termsAccepted: state.termsAccepted,
          termsVersion: state.termsVersion
        })
      }
    )
  )
);

export default useAppStore;
