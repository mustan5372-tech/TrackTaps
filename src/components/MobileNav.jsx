import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/appStore';

function MobileNav() {
  const location = useLocation();
  const { user, role } = useAppStore();

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '🕒', label: 'Timetable', path: '/timetable' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '📈', label: 'Insights', path: '/insights' },
    { icon: '📜', label: 'History', path: '/history' },
    { icon: '✨', label: 'About', path: '/about' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  // Explicit check for mustan5372@gmail.com
  const isOwner = user?.email === 'mustan5372@gmail.com' || user?.email === 'tracktaps@gmail.com' || role === 'ADMIN_OWNER';

  if (isOwner) {
    navItems.splice(1, 0, { icon: '🔐', label: 'Admin Panel', path: '/admin' }); // Put admin near start for owners
  }

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-scroll-container">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;
