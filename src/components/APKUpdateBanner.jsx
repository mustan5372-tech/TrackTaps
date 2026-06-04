import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function APKUpdateBanner() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [nativeVersion, setNativeVersion] = useState('1.0');
  const LATEST_VERSION = '1.6';

  useEffect(() => {
    const checkAppVersion = async () => {
      // Check if we are inside the native mobile app
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          const { App } = await import('@capacitor/app');
          const info = await App.getInfo();
          setNativeVersion(info.version);
          
          // Compare versions (e.g., if client version is older than latest v1.5)
          if (parseFloat(info.version) < parseFloat(LATEST_VERSION)) {
            setNeedsUpdate(true);
          }
        } catch (err) {
          console.warn('Failed to fetch native app version info:', err);
        }
      }
    };
    checkAppVersion();
  }, []);

  const handleUpdateClick = () => {
    try {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        window.open('https://www.tracktaps.online/download', '_system');
      } else {
        window.open('https://www.tracktaps.online/download', '_blank');
      }
    } catch (err) {
      console.error('Failed to launch system browser update link:', err);
      window.open('https://www.tracktaps.online/download', '_blank');
    }
  };

  if (!needsUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          background: 'rgba(20, 20, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(139, 92, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxSizing: 'border-box'
        }}
        data-nosnippet
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(109, 40, 217, 0.3) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            🚀
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: '850', color: 'white', letterSpacing: '-0.01em' }}>
              TrackTaps Update Available! (v{LATEST_VERSION})
            </h4>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Your current version (v{nativeVersion}) is outdated. Get the updated APK now for the latest features, background stability, and native alerts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setNeedsUpdate(false)}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-dim)',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            Later
          </button>
          
          <button
            onClick={handleUpdateClick}
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)',
              border: 'none',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            Update Now (v{LATEST_VERSION})
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default APKUpdateBanner;
