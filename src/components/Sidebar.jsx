import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../icon.png';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function Sidebar() {
  const location = useLocation();
  const { user, role, subscription } = useAppStore();

  // Basic navigation items always visible to logged-in users
  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '🕒', label: 'Timetable', path: '/timetable' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '📈', label: 'Insights', path: '/insights' },
    { icon: '🏖️', label: 'Bunk Calculator', path: '/bunk-calculator' },
    { icon: '🌍', label: 'Community', path: '/community' },
    { icon: '📖', label: 'Guide Center', path: '/guide' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  // ROLE-BASED ACCESS: Show Admin Panel for Owner and Core Members
  const isAuthorized = role === 'ADMIN_OWNER' || role === 'CORE_MEMBER' || user?.email === 'mustan5372@gmail.com';
  
  if (isAuthorized) {
    // Insert Admin Panel before Settings for easy access
    const settingsIndex = navItems.findIndex(item => item.path === '/settings');
    if (settingsIndex !== -1) {
      navItems.splice(settingsIndex, 0, { icon: '🔐', label: 'Admin Panel', path: '/admin' });
    } else {
      navItems.push({ icon: '🔐', label: 'Admin Panel', path: '/admin' });
    }
  }

  return (
    <aside className="sidebar" data-nosnippet>
      <div className={`sidebar-branding ${subscription?.status === 'active' ? 'premium-glow' : ''}`}>
        <Link to="/" className="logo-link">
          <img 
            src={logo} 
            alt="TrackTaps" 
            className="sidebar-logo"
            style={{
              width: '150px',
              height: 'auto',
              objectFit: 'contain',
              filter: `drop-shadow(0 0 ${subscription?.status === 'active' ? '30px' : '20px'} var(--primary-glow))`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </Link>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon" style={{ fontSize: '20px' }}>{item.icon}</span>
            <span className="nav-label" style={{ fontSize: '15px', fontWeight: '600' }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {subscription?.status === 'active' && (
        <div className="premium-sidebar-footer" style={{ padding: '24px', marginTop: 'auto' }}>
          <div style={{
            background: 'var(--primary-glow)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-premium)'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>💎</div>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Premium Active</span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '500' }}>Cloud Sync Enabled</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
