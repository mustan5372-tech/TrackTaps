import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

function MobileNav() {
  const location = useLocation();
  const { user, role } = useAppStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Automatically close bottom sheet whenever a tab or route is clicked
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Sync body class for clean layout layering and hiding floating actions
  useEffect(() => {
    if (isMoreOpen) {
      document.body.classList.add('bottom-sheet-open');
    } else {
      document.body.classList.remove('bottom-sheet-open');
    }
    return () => {
      document.body.classList.remove('bottom-sheet-open');
    };
  }, [isMoreOpen]);

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
                <span className="nav-icon-pill-mobile" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '38px', height: '26px', borderRadius: '100px',
                  background: location.pathname === item.path ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: location.pathname === item.path ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: location.pathname === item.path ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(139,92,246,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  fontSize: '16px', transition: 'all 0.3s ease'
                }}>{item.icon}</span>
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

  // 2. AUTHENTICATED USER FLOW (5 Main Tabs + More Tab = 6 Total Bottom Tabs)
  const primaryItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '☀️', label: 'Today', path: '/today' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '🕒', label: 'Schedule', path: '/timetable' },
    { icon: 'ℹ️', label: 'About', path: '/about' },
  ];

  const moreItems = [
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '🌍', label: 'Community', path: '/community' },
    { icon: '📈', label: 'Insights', path: '/insights' },
    { icon: '🏖️', label: 'Bunks', path: '/bunk-calculator' },
    { icon: '🤝', label: 'Bunk Together', path: '/mega-saver' },
    { icon: '📖', label: 'Guide', path: '/guide' },
    { icon: '🎁', label: 'Referrals', path: '/referral' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  // ROLE-BASED ACCESS: Show Admin Controls in More menu if authorized
  const isAuthorized = role === 'owner' || role === 'core_admin';
  if (isAuthorized) {
    moreItems.push({ icon: '🔐', label: 'Admin', path: '/admin' });
  }

  // GEOTRACK ACCESS: Show GeoTrack in More menu for all users
  if (user) {
    const settingsIndex = moreItems.findIndex(item => item.path === '/settings');
    if (settingsIndex !== -1) {
      moreItems.splice(settingsIndex, 0, { icon: '📍', label: 'GeoTrack (Auto)', path: '/geotrack' });
    } else {
      moreItems.push({ icon: '📍', label: 'GeoTrack (Auto)', path: '/geotrack' });
    }
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
                <span className="nav-icon-pill-mobile" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '24px', borderRadius: '100px',
                  background: location.pathname === item.path ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: location.pathname === item.path ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: location.pathname === item.path ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(139,92,246,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  fontSize: '16px', transition: 'all 0.3s ease'
                }}>{item.icon}</span>
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
              <span className="nav-icon-pill-mobile" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '24px', borderRadius: '100px',
                background: isMoreActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                border: isMoreActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isMoreActive ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(139,92,246,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                fontSize: '16px', transition: 'all 0.3s ease'
              }}>☰</span>
              <span className="nav-label">More</span>
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
            {/* Glass Dim Backdrop (20-30% opacity overlay with blur) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.25)',
                backdropFilter: 'blur(10px) saturate(140%)',
                WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                zIndex: 100000,
                pointerEvents: isMoreOpen ? 'auto' : 'none'
              }}
            />

            {/* Apple iOS 26 Liquid Glass Bottom Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                bottom: '16px',
                left: '12px',
                right: '12px',
                width: 'calc(100% - 24px)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(216, 180, 254, 0.12) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '36px',
                padding: '20px 16px calc(20px + env(safe-area-inset-bottom, 0px)) 16px',
                zIndex: 100001,
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35), 0 0 25px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                maxWidth: '568px',
                margin: '0 auto',
                pointerEvents: isMoreOpen ? 'auto' : 'none',
                overflow: 'hidden'
              }}
            >
              {/* Apple Drag Handle Capsule with soft glow */}
              <div
                onClick={() => setIsMoreOpen(false)}
                style={{
                  width: '48px',
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  margin: '0 auto 20px',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.25)'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
                <h3 style={{
                  fontSize: '19px',
                  fontWeight: '800',
                  color: 'white',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}>
                  <span style={{ filter: 'drop-shadow(0 2px 6px rgba(139, 92, 246, 0.45))' }}>🔮</span> Additional Features
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9, rotate: -45 }}
                  onClick={() => setIsMoreOpen(false)}
                  className="close-btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Features Grid - Glass Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {moreItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      style={{
                        background: location.pathname === item.path 
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(139, 92, 246, 0.18) 100%)' 
                          : 'rgba(255, 255, 255, 0.08)',
                        border: location.pathname === item.path 
                          ? '1.5px solid rgba(168, 85, 247, 0.5)' 
                          : '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '100px',
                        height: '58px',
                        padding: '0 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        color: location.pathname === item.path ? '#c084fc' : '#f8fafc',
                        cursor: 'pointer',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: location.pathname === item.path 
                          ? '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                          : '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {/* Apple Control Center-style Icon bubble */}
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: location.pathname === item.path ? 'rgba(168, 85, 247, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                        backdropFilter: 'blur(5px)',
                        WebkitBackdropFilter: 'blur(5px)',
                        border: location.pathname === item.path ? '1.5px solid rgba(168, 85, 247, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                        fontSize: '18px',
                        flexShrink: 0
                      }}>{item.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          letterSpacing: '-0.01em',
                          verticalAlign: 'middle'
                        }}>{item.label}</div>
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
