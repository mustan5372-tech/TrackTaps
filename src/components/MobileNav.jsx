import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/appStore';

import { motion } from 'framer-motion';

function MobileNav() {
  const location = useLocation();
  const { user, role } = useAppStore();

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '🕒', label: 'Schedule', path: '/timetable' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '📈', label: 'Insights', path: '/insights' },
    { icon: '🏖️', label: 'Bunks', path: '/bunk-calculator' },
    { icon: '🌍', label: 'Community', path: '/community' },
    { icon: '📖', label: 'Guide', path: '/guide' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  // ROLE-BASED ACCESS: Show Admin for Owner and Core Members
  const isAuthorized = role === 'ADMIN_OWNER' || role === 'CORE_MEMBER' || user?.email === 'mustan5372@gmail.com';
  
  if (isAuthorized) {
    navItems.splice(1, 0, { icon: '🔐', label: 'Admin', path: '/admin' });
  }

  return (
    <nav className="mobile-nav" data-nosnippet>
      <div className="mobile-nav-scroll-container">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{ textDecoration: 'none' }}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
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

export default MobileNav;
