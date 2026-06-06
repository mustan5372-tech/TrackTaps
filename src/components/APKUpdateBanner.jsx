import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function APKUpdateBanner() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [nativeVersion, setNativeVersion] = useState('1.0.0');
  const [latestVersion, setLatestVersion] = useState('1.7.0');
  const [changelog, setChangelog] = useState('');

  const parseVersion = (v) => {
    if (!v) return [0];
    // Strip non-numeric/dot characters (e.g. 'v1.7' -> '1.7')
    const cleaned = v.replace(/[^0-9.]/g, '');
    return cleaned.split('.').map(Number);
  };

  const isVersionOlder = (current, latest) => {
    const cArr = parseVersion(current);
    const lArr = parseVersion(latest);
    for (let i = 0; i < Math.max(cArr.length, lArr.length); i++) {
      const cVal = cArr[i] || 0;
      const lVal = lArr[i] || 0;
      if (cVal < lVal) return true;
      if (cVal > lVal) return false;
    }
    return false;
  };

  useEffect(() => {
    const checkAppVersion = async () => {
      // 1. Fetch live version data from web server
      let fetchedVersion = '1.7.0';
      let fetchedChangelog = '';
      try {
        const response = await fetch('https://www.tracktaps.online/version.json', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          fetchedVersion = data.version || '1.7.0';
          fetchedChangelog = data.changelog || '';
          setLatestVersion(fetchedVersion);
          setChangelog(fetchedChangelog);
        }
      } catch (err) {
        console.warn('Failed to fetch live version info from server:', err);
      }

      // 2. Check if we are inside the native mobile app
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          const { App } = await import('@capacitor/app');
          const info = await App.getInfo();
          setNativeVersion(info.version);
          
          // Compare local version name against server latest version
          if (isVersionOlder(info.version, fetchedVersion)) {
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
        window.open('https://www.tracktaps.online/TrackTaps.apk', '_system');
      } else {
        window.open('https://www.tracktaps.online/TrackTaps.apk', '_blank');
      }
    } catch (err) {
      console.error('Failed to launch system browser update link:', err);
      window.open('https://www.tracktaps.online/TrackTaps.apk', '_blank');
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
              TrackTaps Update Available! (v{latestVersion})
            </h4>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Your current version (v{nativeVersion}) is outdated. Get the updated APK now for:
            </p>
            {changelog && (
              <p style={{ margin: '4px 0 0 0', fontSize: '10.5px', color: '#c084fc', fontStyle: 'italic', lineHeight: '1.3' }}>
                "{changelog}"
              </p>
            )}
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
            Update Now (v{latestVersion})
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default APKUpdateBanner;
