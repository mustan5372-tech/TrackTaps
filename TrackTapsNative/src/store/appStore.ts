import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AttendanceEngine, { 
  SemesterSettings, 
  AttendanceSettings, 
  Subject, 
  TimetableData, 
  CalendarEvent, 
  AttendanceData 
} from '../services/attendanceEngine';
import authService from '../services/authService';
import { db } from '../services/firebase';

export interface AppState {
  // ─── SEMESTER SETTINGS ───
  semesterSettings: SemesterSettings;
  setSemesterSettings: (settings: Partial<SemesterSettings>) => void;
  addHoliday: (holiday: { date: string; name: string; type: string }) => void;
  removeHoliday: (id: string) => void;

  // ─── ATTENDANCE SETTINGS ───
  attendanceSettings: AttendanceSettings;
  setAttendanceSettings: (settings: Partial<AttendanceSettings>) => void;

  // ─── CORE ATTENDANCE DATA ───
  subjects: Subject[];
  timetable: TimetableData;
  calendarEvents: CalendarEvent[];
  attendanceData: AttendanceData;
  
  // ─── AUTHENTICATION STATE ───
  user: any | null;
  role: string;
  isAuthLoading: boolean;
  isOffline: boolean;
  
  // ─── ACTIONS ───
  setSubjects: (subjects: Subject[]) => void;
  setTimetable: (timetable: TimetableData) => void;
  setAttendanceData: (attendanceData: AttendanceData) => void;
  
  initAuth: () => () => void;
  login: () => Promise<any>;
  logout: () => Promise<void>;
  
  markAttendance: (eventId: string, state: string | null) => void;
  fullSync: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── SEMESTER SETTINGS DEFAULT ───
      semesterSettings: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
        holidays: [],
        examPeriods: [],
        workingSaturdays: [],
      },
      setSemesterSettings: (settings) => {
        set((state) => ({
          semesterSettings: { ...state.semesterSettings, ...settings }
        }));
        get().fullSync();
      },
      addHoliday: (holiday) => {
        set((state) => ({
          semesterSettings: {
            ...state.semesterSettings,
            holidays: [...(state.semesterSettings.holidays || []), { ...holiday, id: `hol_${Date.now()}` }]
          }
        }));
        get().fullSync();
      },
      removeHoliday: (id) => {
        set((state) => ({
          semesterSettings: {
            ...state.semesterSettings,
            holidays: (state.semesterSettings.holidays || []).filter(h => h.id !== id)
          }
        }));
        get().fullSync();
      },

      // ─── ATTENDANCE SETTINGS DEFAULT ───
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
      },

      // ─── DATA CONTAINERS ───
      subjects: [],
      timetable: {},
      calendarEvents: [],
      attendanceData: {},

      // ─── AUTH STATE ───
      user: null,
      role: 'USER',
      isAuthLoading: true,
      isOffline: false,

      // ─── ACTIONS ───
      setSubjects: (subjects) => set({ subjects }),
      setTimetable: (timetable) => set({ timetable }),
      setAttendanceData: (attendanceData) => set({ attendanceData }),

      initAuth: () => {
        set({ isAuthLoading: true });
        
        // Listen to native firebase auth changes
        const unsubscribe = authService.onAuthChange(async (nativeUser) => {
          if (nativeUser) {
            let dbRole = 'user';
            try {
              const userDoc = await db.collection('users').doc(nativeUser.uid).get();
              if (userDoc.exists) {
                const data = userDoc.data();
                if (data?.role) dbRole = data.role;
              }
            } catch (e) {
              console.log("Failed to fetch native user role:", e);
            }
            
            set({ 
              user: {
                uid: nativeUser.uid,
                email: nativeUser.email,
                displayName: nativeUser.displayName,
                photoURL: nativeUser.photoURL
              },
              role: dbRole,
              isAuthLoading: false 
            });
            console.log("👤 [AppStore Native] User session recovered natively:", nativeUser.email);
          } else {
            set({ user: null, role: 'user', isAuthLoading: false });
            console.log("👤 [AppStore Native] Guest mode active");
          }
        });

        return unsubscribe;
      },

      login: async () => {
        set({ isAuthLoading: true });
        try {
          const user = await authService.loginWithGoogle();
          if (user) {
            let dbRole = 'user';
            try {
              const userDoc = await db.collection('users').doc(user.uid).get();
              if (userDoc.exists) {
                const data = userDoc.data();
                if (data?.role) dbRole = data.role;
              }
            } catch (e) {
              console.log("Failed to fetch native user role:", e);
            }

            set({ 
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
              },
              role: dbRole,
              isAuthLoading: false 
            });
            return user;
          }
          set({ isAuthLoading: false });
          return null;
        } catch (error) {
          set({ isAuthLoading: false });
          console.error("Native Google Login flow failed:", error);
          throw error;
        }
      },

      logout: async () => {
        set({ isAuthLoading: true });
        try {
          await authService.logout();
          set({ 
            user: null, 
            role: 'USER', 
            subjects: [], 
            timetable: {}, 
            attendanceData: {}, 
            calendarEvents: [],
            isAuthLoading: false 
          });
        } catch (error) {
          set({ isAuthLoading: false });
          console.error("Native Logout failed:", error);
          throw error;
        }
      },

      markAttendance: (eventId, state) => {
        set((stateStore) => {
          const updatedAttendance = AttendanceEngine.markAttendance(
            eventId, 
            state, 
            stateStore.attendanceData
          );
          
          return { attendanceData: updatedAttendance };
        });
        get().fullSync();
      },

      fullSync: () => {
        const { timetable, subjects, semesterSettings, attendanceSettings, attendanceData } = get();
        
        // 1. Generate full list of calendar events for the semester
        const calendarEvents = AttendanceEngine.generateCalendarEventsFromTimetable(
          timetable,
          subjects,
          semesterSettings,
          attendanceSettings
        );

        // 2. Perform recalculations of subject percentages and overall status
        const stats = AttendanceEngine.calculateOverallStats(
          subjects,
          calendarEvents,
          attendanceData,
          attendanceSettings
        );

        // 3. Map new percentages to subject entries
        const updatedSubjects = subjects.map(subject => {
          const matchingStat = stats.subjectStats.find(s => s.subjectName === subject.name);
          if (matchingStat) {
            return {
              ...subject,
              present: matchingStat.present,
              total: matchingStat.total
            };
          }
          return subject;
        });

        set({ calendarEvents, subjects: updatedSubjects });
      }
    }),
    {
      name: 'tracktaps-native-store',
      storage: createJSONStorage(() => AsyncStorage), // High-performance native storage persister
    }
  )
);
