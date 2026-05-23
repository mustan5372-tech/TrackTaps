import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function NotificationPrompt() {
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(false);

  // Check current permission state on startup and focus
  const checkPermissionStatus = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  };

  useEffect(() => {
    checkPermissionStatus();
    
    // Listen for focus changes (if permission changes in settings)
    window.addEventListener('focus', checkPermissionStatus);
    return () => {
      window.removeEventListener('focus', checkPermissionStatus);
    };
  }, []);

  const handleRequestPermission = async () => {
    if (!supported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        // Send welcoming immediate notification
        new Notification("🛡️ TrackTaps Protected", {
          body: "You will now receive automatic attendance alerts even when the app is closed!",
          icon: '/assets/icon-B5Otw8hD.png'
        });
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  // Do not render anything if already granted or if notifications are not supported
  if (!supported || permission === 'granted') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(30, 30, 45, 0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
          padding: '14px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(139, 92, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box',
          width: '100%'
        }}
        data-nosnippet
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            🔔
          </div>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: 'white', letterSpacing: '-0.01em' }}>
              Enable Real-Time Academic Alerts
            </h4>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Receive background bunk safety warnings, skip alerts, and calendar logs even when the app is closed.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRequestPermission}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              transition: 'transform 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            Allow Notifications
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NotificationPrompt;
