import useAppStore from '../store/appStore';

/**
 * Lightweight Notification Architecture for TrackTaps
 * Handles in-app toasts, native Web Notifications, and background exit alerts
 */
const notificationService = {
  // Show a standard toast notification and optional native Web Notification
  notify: (message, type = 'success', title = 'TrackTaps') => {
    const { showToast } = useAppStore.getState();
    showToast(message, type);

    // If native web notification permission is granted, send a system notification!
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/assets/icon-B5Otw8hD.png'
        });
      } catch (e) {
        console.error('Error triggering HTML5 Notification:', e);
      }
    }
  },

  // Request notification permissions in a native/webview environment
  requestPermission: async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('🔔 [NotificationService] Native permission granted!');
            notificationService.notify(
              "✨ Notifications enabled! You will now receive background academic alerts.",
              'success',
              'TrackTaps Notifications'
            );
          }
        } catch (e) {
          console.error('Error requesting notification permission:', e);
        }
      }
    }
  },

  // Triggered when user exits/minimizes the app to the background (Like Instagram / WhatsApp)
  triggerBackgroundExitAlert: () => {
    const state = useAppStore.getState();
    if (!state.user) return;

    const isPremium = state.subscription?.status === 'active';
    const overall = state.dashboardStats?.overallPercentage || 0;

    // Check if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if (isPremium) {
        // Premium: Schedule detailed background alert for Risked Classes
        const subjects = state.subjects || [];
        const criticalList = subjects.filter(sub => {
          const threshold = state.attendanceSettings?.criticalLevel || 65;
          const total = sub.attended + sub.absent;
          if (total === 0) return false;
          const pct = (sub.attended / total) * 100;
          return pct < threshold;
        });

        if (criticalList.length > 0) {
          const riskedNames = criticalList.map(s => s.name).slice(0, 2).join(', ');
          try {
            new Notification('🚨 Risked Class Warning', {
              body: `TrackTaps is in the background, but your attendance is critical in [${riskedNames}]. Keep tracking to stay safe!`,
              icon: '/assets/icon-B5Otw8hD.png',
              tag: 'risked-alert',
              requireInteraction: true
            });
          } catch (err) {
            console.error('Failed to trigger background notification:', err);
          }
        } else {
          try {
            new Notification('🛡️ TrackTaps Active', {
              body: `Your attendance is safe at ${overall}%. We will continue monitoring in the background!`,
              icon: '/assets/icon-B5Otw8hD.png',
              tag: 'safe-alert'
            });
          } catch (err) {
            console.error('Failed to trigger background notification:', err);
          }
        }
      } else {
        // Normal/Free user: Basic attendance score in background tray and Upsell
        try {
          new Notification('📊 TrackTaps Score', {
            body: `Current Score: ${overall}%. Upgrade to Premium now for WhatsApp-style real-time background warnings on risked classes!`,
            icon: '/assets/icon-B5Otw8hD.png',
            tag: 'free-alert'
          });
        } catch (err) {
          console.error('Failed to trigger background notification:', err);
        }
      }
    }
  },

  // Trigger smart retention alerts inside the app
  triggerRetentionAlert: () => {
    const state = useAppStore.getState();
    if (!state.user) return;

    const isPremium = state.subscription?.status === 'active';
    const overall = state.dashboardStats?.overallPercentage || 0;
    
    // Check if permission is default and ask for it on startup
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      notificationService.requestPermission();
    }

    if (isPremium) {
      const criticalCount = state.dashboardStats?.criticalSubjects || 0;
      const subjects = state.subjects || [];
      const criticalList = subjects.filter(sub => {
        const threshold = state.attendanceSettings?.criticalLevel || 65;
        const total = sub.attended + sub.absent;
        if (total === 0) return false;
        const pct = (sub.attended / total) * 100;
        return pct < threshold;
      });

      if (criticalList.length > 0) {
        const riskedNames = criticalList.map(s => s.name).slice(0, 2).join(', ');
        const message = `🚨 Risked Class Alert: Attendance is critical in [${riskedNames}]. Bunking these classes is highly risky!`;
        notificationService.notify(message, 'error', '🚨 Risked Class Alert');
      } else if (criticalCount > 0) {
        const message = `⚠️ Risk Warning: You have ${criticalCount} subject(s) below the critical safety threshold.`;
        notificationService.notify(message, 'warning', '⚠️ Attendance Alert');
      } else {
        const message = `🛡️ Safe Semester: All your classes are currently safe and above the warning threshold!`;
        notificationService.notify(message, 'success', '🛡️ TrackTaps Protected');
      }
    } else {
      const message = `📊 Attendance Score: Your overall score is currently ${overall}%. Upgrade to Premium now to get alerts for risked classes and smart bunk predictions!`;
      notificationService.notify(message, 'info', '📊 TrackTaps Update');
    }
  },

  // Triggered when attendance drops below threshold
  alertLowAttendance: (percentage) => {
    if (percentage < 75) {
      notificationService.notify(
        `⚠️ Low Attendance: ${percentage}%. You need more classes to stay safe!`,
        'error',
        '⚠️ Attendance Alert'
      );
    }
  },

  // Triggered after successful Pod.ai sync
  notifySyncComplete: (subjectCount) => {
    notificationService.notify(
      `✅ Pod.ai Sync Complete: ${subjectCount} subjects updated!`,
      'success',
      '🔄 Pod.ai Synced'
    );
  },

  // Triggered on premium activation
  notifyPremiumActivated: () => {
    notificationService.notify(
      "💎 Premium Activated! Cloud Sync and Elite Themes unlocked.",
      'success',
      '💎 Premium Active'
    );
  },

  // Future: Add logic for Email/WhatsApp/Push via API
  sendTransactionalAlert: async (userId, type, data) => {
    console.log(`📡 [NotificationService] Scheduling ${type} alert for user ${userId}`);
  }
};

export default notificationService;
