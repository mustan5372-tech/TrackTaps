import useAppStore from '../store/appStore';

/**
 * Lightweight Notification Architecture for TrackTaps
 * Handles in-app toasts and transactional alerts
 */
const notificationService = {
  // Show a standard toast notification
  notify: (message, type = 'success') => {
    const { showToast } = useAppStore.getState();
    showToast(message, type);
  },

  // Triggered when attendance drops below threshold
  alertLowAttendance: (percentage) => {
    if (percentage < 75) {
      notificationService.notify(
        `⚠️ Low Attendance: ${percentage}%. You need more classes to stay safe!`,
        'error'
      );
    }
  },

  // Triggered after successful Pod.ai sync
  notifySyncComplete: (subjectCount) => {
    notificationService.notify(
      `✅ Pod.ai Sync Complete: ${subjectCount} subjects updated!`,
      'success'
    );
  },

  // Triggered on premium activation
  notifyPremiumActivated: () => {
    notificationService.notify(
      "💎 Premium Activated! Cloud Sync and Elite Themes unlocked.",
      'success'
    );
  },

  // Future: Add logic for Email/WhatsApp/Push via API
  sendTransactionalAlert: async (userId, type, data) => {
    console.log(`📡 [NotificationService] Scheduling ${type} alert for user ${userId}`);
    // This will be expanded with backend integration
  }
};

export default notificationService;
