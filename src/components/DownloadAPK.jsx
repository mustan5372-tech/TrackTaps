import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const DownloadAPK = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('android'); // android, windows, ios
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  // Helper to detect if we are in the native APK
  const isNativeAPK = () => {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    
    // Auto-select tab based on platform
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) setActiveTab('android');
    else if (ua.includes('iphone') || ua.includes('ipad')) setActiveTab('ios');
    else setActiveTab('windows');

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ONLY VISIBLE ON HOME AND ABOUT PAGES
  // ALSO HIDE IF ALREADY IN NATIVE APK
  const isVisiblePage = location.pathname === '/' || location.pathname === '/about';
  if (!isVisiblePage || isNativeAPK()) return null;

  const downloadAPK = () => {
    const link = document.createElement('a');
    link.href = '/TrackTaps.apk';
    link.download = 'TrackTaps.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const platforms = [
    { id: 'android', name: 'Android', icon: '🤖', description: 'Native APK' },
    { id: 'windows', name: 'Windows', icon: '💻', description: 'Desktop PWA' },
    { id: 'ios', name: 'iOS', icon: '🍎', description: 'Web App' }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0, x: 50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(105px + env(safe-area-inset-bottom, 16px))' : '30px',
          right: isMobile ? '16px' : '30px',
          zIndex: 999,
          background: 'rgba(139, 92, 246, 0.25)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '18px',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px var(--primary-glow)',
        }}
      >
        <span style={{ fontSize: '24px' }}>📲</span>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'var(--primary)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid var(--bg-deep)'
          }}
        />
      </motion.div>

      {/* Modal Backdrop and Content */}
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '450px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, var(--bg-primary) 100%)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '32px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px var(--primary-glow)',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '-0.5px' }}>Get TrackTaps</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>Choose your platform to install the app.</p>

              {/* Platform Selector Tabs */}
              <div style={{ 
                display: 'flex', 
                background: 'rgba(0,0,0,0.2)', 
                padding: '4px', 
                borderRadius: '16px', 
                marginBottom: '32px',
                gap: '4px'
              }}>
                {platforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActiveTab(p.id)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === p.id ? 'var(--primary)' : 'transparent',
                      color: activeTab === p.id ? 'white' : 'var(--text-dim)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{p.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'android' && (
                    <motion.div
                      key="android"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Android Application</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                          Download the native APK for the best performance and offline capabilities.
                        </p>
                      </div>
                      <button
                        onClick={downloadAPK}
                        style={{
                          width: '100%',
                          padding: '16px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: '800',
                          fontSize: '15px',
                          cursor: 'pointer',
                          boxShadow: '0 8px 20px var(--primary-glow)'
                        }}
                      >
                        Download APK (7.6 MB)
                      </button>
                    </motion.div>
                  )}

                  {activeTab === 'windows' && (
                    <motion.div
                      key="windows"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💻</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Windows Desktop App</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                          Install TrackTaps as a standalone desktop application via your browser.
                        </p>
                      </div>
                      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '8px' }}>HOW TO INSTALL:</div>
                        <ol style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-main)', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li>Look at your browser's address bar.</li>
                          <li>Click the <b>Install Icon</b> (🖥️ or ➕) on the right side.</li>
                          <li>Confirm <b>"Install"</b> to add to your desktop.</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'ios' && (
                    <motion.div
                      key="ios"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍎</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>iOS Home Screen App</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                          Add TrackTaps to your iPhone or iPad for a native full-screen experience.
                        </p>
                      </div>
                      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '8px' }}>HOW TO INSTALL:</div>
                        <ol style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-main)', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <li>Open this site in <b>Safari</b>.</li>
                          <li>Tap the <b>Share button</b> (📤) at the bottom.</li>
                          <li>Scroll down and tap <b>"Add to Home Screen"</b>.</li>
                          <li>Tap <b>"Add"</b> in the top right corner.</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  marginTop: '32px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DownloadAPK;
