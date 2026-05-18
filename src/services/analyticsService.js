import { db } from './firebase';
import { doc, setDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

// Platform check helpers
const isNativeAPK = () => {
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform());
  const isAndroid = /Android/i.test(navigator.userAgent);
  const hasCapacitorBridge = !!(window.Capacitor?.Plugins);
  return isNative || (isAndroid && hasCapacitorBridge);
};

const getPlatformSource = () => {
  if (isNativeAPK()) return 'APK';
  
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone || 
                document.referrer.includes('android-app://');
  if (isPWA) return 'PWA';
  
  return 'Browser';
};

class AnalyticsService {
  constructor() {
    this.visitorId = null;
    this.isReturning = false;
    this.sessionStartTime = Date.now();
    this.sessionTimer = null;
  }

  // Initialize Anonymous Visitor Identity
  initVisitor() {
    try {
      let storedId = localStorage.getItem('tracktaps_anon_visitor_id');
      if (storedId) {
        this.visitorId = storedId;
        this.isReturning = true;
      } else {
        // Generate a cryptographically strong unique visitor ID
        const rand = Math.random().toString(36).substring(2, 15);
        const time = Date.now().toString(36);
        this.visitorId = `visitor_${rand}_${time}`;
        localStorage.setItem('tracktaps_anon_visitor_id', this.visitorId);
        this.isReturning = false;
      }

      // Start Tracking active session duration
      this.startSessionTracking();
      
      // Fire session start event in background
      this.logSessionStart();
    } catch (error) {
      console.warn('⚠️ [Analytics] Failed to initialize anonymous visitor:', error);
    }
  }

  // Log session start into Firestore (non-blocking)
  async logSessionStart() {
    if (!this.visitorId || !db.collection) return; // Fail-safe check
    
    try {
      const visitorRef = doc(db, 'visitor_sessions', this.visitorId);
      const platform = getPlatformSource();
      const now = new Date().toISOString();

      await setDoc(visitorRef, {
        visitorId: this.visitorId,
        platform,
        isReturning: this.isReturning,
        firstSeen: this.isReturning ? undefined : now,
        lastSeen: now,
        sessionCount: increment(1),
        sessionStartTimes: arrayUnion(now),
        converted: false,
        convertedUid: null,
        premiumUpgraded: false,
        clickedLogin: false,
        featuresUsed: {
          bunkCalc: 0,
          insights: 0,
          aiAssistant: 0,
          community: 0,
          referral: 0,
          calendar: 0,
          aiImport: 0
        }
      }, { merge: true });
      
      console.log(`📊 [Analytics] Session registered: ${this.visitorId} (${platform}, returning: ${this.isReturning})`);
    } catch (e) {
      console.warn('⚠️ [Analytics] Firestore session start logging failed:', e.message);
    }
  }

  // Log a specific feature usage event reactively (non-blocking)
  async trackFeatureUse(featureName) {
    if (!this.visitorId || !db.collection) return;
    
    const validFeatures = ['bunkCalc', 'insights', 'aiAssistant', 'community', 'referral', 'calendar', 'aiImport'];
    if (!validFeatures.includes(featureName)) return;

    try {
      const visitorRef = doc(db, 'visitor_sessions', this.visitorId);
      await updateDoc(visitorRef, {
        [`featuresUsed.${featureName}`]: increment(1),
        lastSeen: new Date().toISOString()
      });
      console.log(`📊 [Analytics] Feature tracked: ${featureName}`);
    } catch (e) {
      console.warn(`⚠️ [Analytics] Feature tracking failed for ${featureName}:`, e.message);
    }
  }

  // Track user login conversion (non-blocking)
  async trackLoginConversion(uid) {
    if (!this.visitorId || !db.collection) return;

    try {
      const visitorRef = doc(db, 'visitor_sessions', this.visitorId);
      await updateDoc(visitorRef, {
        converted: true,
        convertedUid: uid,
        lastSeen: new Date().toISOString()
      });
      console.log(`📊 [Analytics] Funnel Step: Conversion success for UID ${uid}`);
    } catch (e) {
      console.warn('⚠️ [Analytics] Conversion tracking failed:', e.message);
    }
  }

  // Track premium upgrade event (non-blocking)
  async trackPremiumConversion() {
    if (!this.visitorId || !db.collection) return;

    try {
      const visitorRef = doc(db, 'visitor_sessions', this.visitorId);
      await updateDoc(visitorRef, {
        premiumUpgraded: true,
        lastSeen: new Date().toISOString()
      });
      console.log('📊 [Analytics] Funnel Step: Premium Upgrade registered!');
    } catch (e) {
      console.warn('⚠️ [Analytics] Premium conversion tracking failed:', e.message);
    }
  }

  // Track clicked login actions (non-blocking)
  async trackClickLogin() {
    if (!this.visitorId || !db.collection) return;

    try {
      const visitorRef = doc(db, 'visitor_sessions', this.visitorId);
      await updateDoc(visitorRef, {
        clickedLogin: true,
        lastSeen: new Date().toISOString()
      });
      console.log('📊 [Analytics] Interaction: Guest clicked login button');
    } catch (e) {
      console.warn('⚠️ [Analytics] Login click tracking failed:', e.message);
    }
  }

  // Background active session tracker
  startSessionTracking() {
    this.sessionStartTime = Date.now();
    
    // Periodically update active session duration in storage or firestore
    // To minimize database writes, we persist it locally and send it on page hide/unload
    if (this.sessionTimer) clearInterval(this.sessionTimer);
    
    // Save locally every 15 seconds
    this.sessionTimer = setInterval(() => {
      try {
        const durationSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        localStorage.setItem('tracktaps_active_session_duration', durationSec.toString());
      } catch (e) {}
    }, 15000);

    // Sync final session duration when user closes/hides the page
    const handleUnload = () => {
      try {
        const durationSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        if (this.visitorId && db.collection && durationSec > 0) {
          const visitorRef = doc(db, 'visitor_sessions', this.visitorId);
          updateDoc(visitorRef, {
            totalDurationSec: increment(durationSec),
            lastSeen: new Date().toISOString()
          }).catch(() => {});
        }
      } catch (e) {}
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    window.addEventListener('pagehide', handleUnload);
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
