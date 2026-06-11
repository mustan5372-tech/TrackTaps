import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../icon.png';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function Sidebar() {
  const location = useLocation();
  const { user, role, subscription } = useAppStore();

  // Basic navigation items always visible to logged-in users
  const navItems = user ? [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '☀️', label: 'Today', path: '/today' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '🕒', label: 'Timetable', path: '/timetable' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '📈', label: 'Insights', path: '/insights' },
    { icon: '🏖️', label: 'Bunk Calculator', path: '/bunk-calculator' },
    { icon: '👥', label: 'Mega Saver Sync', path: '/mega-saver' },
    { icon: '🌍', label: 'Community', path: '/community' },
    { icon: '📖', label: 'Guide Center', path: '/guide' },
    { icon: 'ℹ️', label: 'About', path: '/about' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ] : [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📖', label: 'Guide Center', path: '/guide' },
    { icon: 'ℹ️', label: 'About', path: '/about' },
  ];

  // ROLE-BASED ACCESS: Show Admin Panel for Owner and Core Members
  const isAuthorized = !!user && (role === 'owner' || role === 'core_admin');
  
  if (isAuthorized) {
    // Insert Admin Panel before Settings for easy access
    const settingsIndex = navItems.findIndex(item => item.path === '/settings');
    if (settingsIndex !== -1) {
      navItems.splice(settingsIndex, 0, { icon: '🔐', label: 'Admin Panel', path: '/admin' });
    } else {
      navItems.push({ icon: '🔐', label: 'Admin Panel', path: '/admin' });
    }
  }

  // GEOTRACK ACCESS: Show GeoTrack Auto-attendance page for all users
  if (user) {
    const settingsIndex = navItems.findIndex(item => item.path === '/settings');
    if (settingsIndex !== -1) {
      navItems.splice(settingsIndex, 0, { icon: '📍', label: 'GeoTrack (Auto)', path: '/geotrack' });
    } else {
      navItems.push({ icon: '📍', label: 'GeoTrack (Auto)', path: '/geotrack' });
    }
  }

  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  return (
    <aside className="sidebar liquid-glass-sidebar" data-nosnippet style={{
      borderRight: isPremium ? '1px solid rgba(234, 179, 8, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: isPremium ? '5px 0 35px rgba(234, 179, 8, 0.05)' : 'none',
      background: 'rgba(15, 23, 42, 0.35)',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    }}>
      <div className={`sidebar-branding ${isPremium ? 'premium-glow' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '20px' }}>
        <Link to="/" className="logo-link" style={{ display: 'inline-block' }}>
          <img 
            src={logo} 
            alt="TrackTaps" 
            className="sidebar-logo"
            style={{
              width: '130px',
              height: 'auto',
              objectFit: 'contain',
              filter: `drop-shadow(0 0 ${isPremium ? '30px' : '20px'} var(--primary-glow))`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </Link>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.location.reload()}
          className="liquid-glass-pill-icon"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-dim)',
            width: '34px',
            height: '34px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '10px',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)'
          }}
          title="Refresh App"
        >
          🔄
        </motion.button>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-btn liquid-glass-nav-btn ${isActive ? 'active' : ''}`}
              style={isActive && isPremium ? {
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(139, 92, 246, 0.18) 100%)',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 4px 15px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(255,255,255,0.06)'
              } : {}}
            >
              <span className="nav-icon-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 7px',
                borderRadius: '100px',
                background: isActive 
                  ? (isPremium 
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(139, 92, 246, 0.25) 100%)' 
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)')
                  : 'transparent',
                border: isActive 
                  ? (isPremium ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)')
                  : '1px solid transparent',
                boxShadow: isActive 
                  ? (isPremium 
                    ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(234, 179, 8, 0.15)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(139, 92, 246, 0.15)')
                  : 'none',
                fontSize: '20px',
                lineHeight: '1',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              }}>
                {item.icon}
              </span>
              <span className="nav-label" style={{ 
                fontSize: '15px', 
                fontWeight: '700', 
                color: isActive && isPremium ? '#f59e0b' : 'inherit',
                letterSpacing: '-0.01em'
              }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {isPremium && (
        <div className="premium-sidebar-footer" style={{ padding: '24px', marginTop: 'auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '100px',
            padding: '12px 20px',
            textAlign: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 20px rgba(234, 179, 8, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '16px' }}>👑</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>ELITE MEMBER</span>
            <span style={{ fontSize: '4px', color: 'rgba(245, 158, 11, 0.4)' }}>●</span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '500' }}>Cloud Sync</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
