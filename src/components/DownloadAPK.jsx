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
          bottom: isMobile ? '100px' : '30px',
          right: '30px',
          zIndex: 999, // Below chatbot and mobile nav but above main content
          background: 'rgba(139, 92, 246, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '20px',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px rgba(139, 92, 246, 0.3)',
          transition: 'bottom 0.3s ease'
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
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            zIndex: -1
          }}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 5px rgba(139, 92, 246, 0.5))' }}>🤖</span>
          <span style={{ fontSize: '8px', fontWeight: '800', color: '#a78bfa', marginTop: '-2px' }}>APK</span>
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
                background: 'linear-gradient(135deg, #1e1b4b 0%, #020617 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '28px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.1)',
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
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '22px',
                    margin: '0 auto 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    boxShadow: 'inset 0 0 15px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  🤖
                </motion.div>

                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.5px' }}>TrackTaps Android</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>Experience TrackTaps with native performance and offline access.</p>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '18px',
                  padding: '20px',
                  marginBottom: '28px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Version</span>
                    <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700' }}>v1.2.4</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Size</span>
                    <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700' }}>7.67 MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Platform</span>
                    <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700' }}>Android 8.0+</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={downloadFile}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '18px',
                    borderRadius: '16px',
                    fontWeight: '800',
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📥</span> Download APK
                </motion.button>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
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
