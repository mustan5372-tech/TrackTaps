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

  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  return (
    <aside className="sidebar" data-nosnippet style={{
      borderRight: isPremium ? '1px solid rgba(234, 179, 8, 0.25)' : '1px solid var(--border)',
      boxShadow: isPremium ? '5px 0 35px rgba(234, 179, 8, 0.05)' : 'none'
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
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-dim)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '10px'
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
              className={`nav-btn ${isActive ? 'active' : ''}`}
              style={isActive && isPremium ? {
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(139, 92, 246, 0.25) 100%)',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 4px 15px rgba(234, 179, 8, 0.1)'
              } : {}}
            >
              <span className="nav-icon" style={{ fontSize: '20px' }}>{item.icon}</span>
              <span className="nav-label" style={{ 
                fontSize: '15px', 
                fontWeight: '700', 
                color: isActive && isPremium ? '#f59e0b' : 'inherit'
              }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {isPremium && (
        <div className="premium-sidebar-footer" style={{ padding: '24px', marginTop: 'auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '18px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(234, 179, 8, 0.15)'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>👑</div>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>ELITE MEMBER</span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '500' }}>Cloud Sync Active</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
