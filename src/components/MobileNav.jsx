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
    { icon: '👥', label: 'Mega Sync', path: '/mega-saver' },
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
                zIndex: 100000,
                pointerEvents: isMoreOpen ? 'auto' : 'none'
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
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderTop: '1.5px solid rgba(139, 92, 246, 0.35)',
                borderRadius: '24px 24px 0 0',
                padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 16px)) 20px',
                zIndex: 100001,
                boxShadow: '0 -15px 40px rgba(0,0,0,0.5)',
                maxWidth: '600px',
                margin: '0 auto',
                pointerEvents: isMoreOpen ? 'auto' : 'none'
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
                        background: location.pathname === item.path 
                          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)' 
                          : 'rgba(255,255,255,0.03)',
                        border: location.pathname === item.path ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '100px',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: location.pathname === item.path ? 'var(--primary-light)' : 'var(--text-main)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: location.pathname === item.path 
                          ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(139,92,246,0.1)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.04)'
                      }}
                    >
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '28px', borderRadius: '100px',
                        background: location.pathname === item.path ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                        border: location.pathname === item.path ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                        fontSize: '17px', flexShrink: 0
                      }}>{item.icon}</span>
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
