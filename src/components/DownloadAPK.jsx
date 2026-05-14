import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DownloadAPK = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = '/TrackTaps.apk';
    link.download = 'TrackTaps.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  if (isMobile) return null; // Use header button on mobile instead of FAB

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0, x: 50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="apk-download-fab"
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(105px + env(safe-area-inset-bottom, 16px))' : '30px',
          right: isMobile ? '16px' : '30px',
          zIndex: 999, // Below chatbot and mobile nav but above main content
          background: 'rgba(139, 92, 246, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '18px',
          width: isMobile ? '50px' : '60px',
          height: isMobile ? '50px' : '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px var(--primary-glow)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Pulsing Aura */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '24px',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            zIndex: -1
          }}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 5px rgba(139, 92, 246, 0.5))' }}>🤖</span>
          <span style={{ 
            position: 'absolute', 
            top: '-12px', 
            right: '-12px', 
            background: 'var(--primary)', 
            color: 'white', 
            fontSize: '8px', 
            padding: '2px 6px', 
            borderRadius: '100px',
            fontWeight: '900',
            boxShadow: '0 0 10px var(--primary-glow)'
          }}>SOON</span>
          <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--primary-light)', marginTop: '-2px' }}>APK</span>
        </div>
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
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, var(--bg-primary) 100%)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '28px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px var(--primary-glow)',
                overflow: 'hidden'
              }}
            >
              {/* Decorative elements */}
              <div style={{
                position: 'absolute',
                top: '-100px',
                right: '-100px',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                zIndex: 0
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid var(--primary-glow)',
                    borderRadius: '22px',
                    margin: '0 auto 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    boxShadow: 'inset 0 0 15px var(--primary-glow)'
                  }}
                >
                  🤖
                </motion.div>

                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.5px' }}>TrackTaps Android</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>Experience TrackTaps with native performance and offline access.</p>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '20px',
                  marginBottom: '28px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Version</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}>v1.2.4</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Size</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}>7.67 MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Platform</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}>Android 8.0+</span>
                  </div>
                </div>

                <motion.div
                  style={{
                    position: 'relative',
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed var(--primary-glow)',
                    color: 'var(--text-dim)',
                    fontWeight: '800',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'not-allowed'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>⏳</span> APK Coming Soon
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: '700', letterSpacing: '0.1em' }}>STABILIZING VERSION...</span>
                </motion.div>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    marginTop: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DownloadAPK;
