import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

function MobileNav() {
  const location = useLocation();
  const { user, role } = useAppStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 1. GUEST USER FLOW (Only Home & Guide)
  if (!user) {
    const guestItems = [
      { icon: '🏠', label: 'Home', path: '/' },
      { icon: '📖', label: 'Guide', path: '/guide' },
    ];

    return (
      <nav className="mobile-nav" data-nosnippet>
        <div className="mobile-nav-scroll-container" style={{ justifyContent: 'space-around', padding: '0 24px' }}>
          {guestItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                style={{ width: '100%', maxWidth: '100px' }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="activeTab"
                    className="active-indicator"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '32px',
                      height: '3px',
                      background: 'var(--primary-light)',
                      borderRadius: '100px',
                      boxShadow: '0 0 10px var(--primary-glow)'
                    }}
                  />
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  // 2. AUTHENTICATED USER FLOW (5 Main Tabs + Interactive Bottom Sheet More Menu)
  const primaryItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '📈', label: 'Insights', path: '/insights' },
    { icon: '🌍', label: 'Community', path: '/community' },
  ];

  const moreItems = [
    { icon: '🕒', label: 'Schedule', path: '/timetable' },
    { icon: '🏖️', label: 'Bunks', path: '/bunk-calculator' },
    { icon: '📖', label: 'Guide', path: '/guide' },
    { icon: '🎁', label: 'Referrals', path: '/referral' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  // ROLE-BASED ACCESS: Show Admin Controls in More menu if authorized
  const isAuthorized = role === 'admin' || role === 'core';
  if (isAuthorized) {
    moreItems.push({ icon: '🔐', label: 'Admin', path: '/admin' });
  }

  const isMoreActive = moreItems.some(item => location.pathname === item.path);

  return (
    <>
      <nav className="mobile-nav" data-nosnippet>
        <div className="mobile-nav-scroll-container" style={{ width: '100%', justifyContent: 'space-between', padding: '0 8px' }}>
          
          {/* Primary 5 Tabs */}
          {primaryItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none', flex: '1 1 0', minWidth: '0' }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                style={{ width: '100%', minWidth: '0' }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label" style={{ fontSize: '8.5px' }}>{item.label}</span>
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="activeTab"
                    className="active-indicator"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '30px',
                      height: '3px',
                      background: 'var(--primary-light)',
                      borderRadius: '100px',
                      boxShadow: '0 0 10px var(--primary-glow)'
                    }}
                  />
                )}
              </motion.div>
            </Link>
          ))}

          {/* More Menu Trigger (6th Tab) */}
          <div style={{ flex: '1 1 0', minWidth: '0', display: 'flex', justifyContent: 'center' }}>
            <motion.div
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMoreOpen(true)}
              className={`mobile-nav-btn ${isMoreActive ? 'active' : ''}`}
              style={{ width: '100%', minWidth: '0', cursor: 'pointer' }}
            >
              <span className="nav-icon">☰</span>
              <span className="nav-label" style={{ fontSize: '8.5px' }}>More</span>
              {isMoreActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="active-indicator"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
                    height: '3px',
                    background: 'var(--primary-light)',
                    borderRadius: '100px',
                    boxShadow: '0 0 10px var(--primary-glow)'
                  }}
                />
              )}
            </motion.div>
          </div>

        </div>
      </nav>

      {/* Immersive Bottom Sheet More Drawer */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Dark Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.75)',
                backdropFilter: 'blur(12px)',
                zIndex: 99998,
              }}
            />

            {/* Bottom Sheet Slider */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                borderTop: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '24px 24px 0 0',
                padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 16px)) 20px',
                zIndex: 99999,
                boxShadow: '0 -15px 40px rgba(0,0,0,0.5)',
                maxWidth: '600px',
                margin: '0 auto'
              }}
            >
              {/* Drag Handle Pill */}
              <div 
                onClick={() => setIsMoreOpen(false)}
                style={{ 
                  width: '40px', 
                  height: '4px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '10px', 
                  margin: '0 auto 20px',
                  cursor: 'pointer' 
                }} 
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '850', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔮</span> Additional Features
                </h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
              
              {/* Features Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {moreItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: location.pathname === item.path ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: location.pathname === item.path ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: location.pathname === item.path ? 'var(--primary-light)' : 'var(--text-main)',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '750' }}>{item.label}</div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileNav;
