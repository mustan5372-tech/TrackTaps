import React from 'react';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function MainContent({ children }) {
  const { user, subscription, setAccountDrawerOpen, setAuthModalOpen } = useAppStore();
  const isPremium = subscription?.status === 'active';

  return (
    <div className="content-wrapper" style={{ position: 'relative' }}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-only-header-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Render unconditionally - CSS media queries govern visibility with 100% reliability */}
      <MobileHeader />
      <MobileNav />
      
      {user ? (
        <div className="desktop-only-header-btn" style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9990
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAccountDrawerOpen(true)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: isPremium 
                ? '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(139, 92, 246, 0.3)'
                : '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              padding: 0
            }}
          >
            {/* Inner Liquid light refraction line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
              borderRadius: '100px',
              pointerEvents: 'none'
            }} />
            
            {/* Avatar Image */}
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=8b5cf6&color=fff`} 
              alt="Profile" 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </motion.button>
        </div>
      ) : (
        <div className="desktop-only-header-btn" style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9990
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAuthModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)',
              border: 'none',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: '800',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
              cursor: 'pointer',
              letterSpacing: '0.02em'
            }}
          >
            Get Started 🚀
          </motion.button>
        </div>
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default MainContent;
