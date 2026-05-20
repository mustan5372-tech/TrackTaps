import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Lightweight Presence Service
 * Tracks user online/offline status with throttled heartbeats.
 * Writes to users/{uid} with merge to avoid overwriting other fields.
 */

const HEARTBEAT_INTERVAL = 90 * 1000; // 90 seconds
let heartbeatTimer = null;
let lastHeartbeat = 0;
const THROTTLE_MS = 60 * 1000; // Min 60s between writes

const presenceService = {
  /**
   * Start tracking presence for a user.
   * Sets isOnline=true and begins heartbeat.
   */
  goOnline: async (uid) => {
    if (!uid) return;

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      }, { merge: true });
      lastHeartbeat = Date.now();
      console.log('🟢 [Presence] Online');
    } catch (e) {
      console.warn('⚠️ [Presence] goOnline failed:', e);
    }

    // Start heartbeat
    presenceService.startHeartbeat(uid);
  },

  /**
   * Mark user offline. Called on logout/close.
   */
  goOffline: async (uid) => {
    if (!uid) return;
    presenceService.stopHeartbeat();

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      }, { merge: true });
      console.log('⚫ [Presence] Offline');
    } catch (e) {
      console.warn('⚠️ [Presence] goOffline failed:', e);
    }
  },

  /**
   * Throttled heartbeat — updates lastSeen periodically.
   */
  sendHeartbeat: async (uid) => {
    if (!uid) return;
    const now = Date.now();
    if (now - lastHeartbeat < THROTTLE_MS) return; // Skip if too recent

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      }, { merge: true });
      lastHeartbeat = now;
    } catch (e) {
      // Silent fail — heartbeat is non-critical
    }
  },

  startHeartbeat: (uid) => {
    presenceService.stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      presenceService.sendHeartbeat(uid);
    }, HEARTBEAT_INTERVAL);
  },

  stopHeartbeat: () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  },

  /**
   * Setup app lifecycle listeners for presence.
   * Call once during app init.
   */
  setupLifecycleListeners: (uid) => {
    if (!uid) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        presenceService.goOnline(uid);
      } else {
        // Don't go fully offline on background — just stop heartbeat
        presenceService.stopHeartbeat();
      }
    };

    const handleBeforeUnload = () => {
      // Best-effort offline marker on tab/app close
      try {
        const userRef = doc(db, 'users', uid);
        // Use navigator.sendBeacon for reliability
        // Fallback: just stop heartbeat, server will detect via stale lastSeen
        presenceService.stopHeartbeat();
      } catch (e) {}
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      presenceService.stopHeartbeat();
    };
  }
};

export default presenceService;
