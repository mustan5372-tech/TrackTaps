import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';

function InstagramFollowPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAppStore();

  useEffect(() => {
    // If user has chosen to never see it, exit
    const dontShow = localStorage.getItem('tracktaps_instagram_dont_show') === 'true';
    const userDisabled = user ? localStorage.getItem(`tt_insta_disabled_${user.uid}`) === 'true' : false;

    if (dontShow || userDisabled) {
      return;
    }

    // Check if the user is visiting the website for the first time
    const hasShownPopup = localStorage.getItem('tracktaps_instagram_popup_shown');
    
    if (!hasShownPopup) {
      // Delay popup by 2.5 seconds for a premium, non-intrusive entrance feel
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Mark as shown so it never prompts them again
        localStorage.setItem('tracktaps_instagram_popup_shown', 'true');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleFollow = () => {
    window.open("https://www.instagram.com/tracktaps.online?igsh=MWp1aDQ4eGpmNW11Mg==", "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleDontShowAgain = async () => {
    localStorage.setItem('tracktaps_instagram_dont_show', 'true');
    if (user) {
      localStorage.setItem(`tt_insta_disabled_${user.uid}`, 'true');
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { instagramFollowPromptDisabled: true }, { merge: true });
      } catch (e) {
        console.warn("⚠️ Failed to sync instagram preference to cloud:", e);
      }
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'linear-gradient(185deg, #1e1b4b 0%, #0f172a 100%)',
                border: '1.5px solid rgba(225, 48, 108, 0.4)',
                borderRadius: '24px',
                padding: '36px 30px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(225, 48, 108, 0.25), 0 0 40px rgba(139, 92, 246, 0.15)'
              }}
            >
              {/* Glowing Ambient Pink Orbs */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-20%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(225, 48, 108, 0.25) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-20%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }} />

              {/* Close Icon (Corner) */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                ✕
              </button>

              {/* Instagram Neon Logo */}
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 30px rgba(221, 42, 123, 0.4)',
                fontSize: '36px',
                position: 'relative',
                zIndex: 1
              }}>
                📸
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '22px',
                fontWeight: '900',
                color: 'white',
                marginBottom: '10px',
                lineHeight: '1.3',
                position: 'relative',
                zIndex: 1
              }}>
                Join Us on Instagram!
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '14px',
                color: '#94a3b8',
                lineHeight: '1.6',
                marginBottom: '28px',
                position: 'relative',
                zIndex: 1
              }}>
                Follow <span style={{ color: '#dd2a7b', fontWeight: '750' }}>@tracktaps.online</span> to get daily skip alerts, college attendance lifehacks, early access features, and global giveaways!
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFollow}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '14px',
                    fontWeight: '800',
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(221, 42, 123, 0.3)',
                    letterSpacing: '0.02em'
                  }}
                >
                  🚀 Follow @tracktaps.online
                </motion.button>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      color: '#94a3b8',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Maybe Later
                  </button>

                  <button
                    onClick={handleDontShowAgain}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      color: '#64748b',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Don't Show Again
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default InstagramFollowPopup;
