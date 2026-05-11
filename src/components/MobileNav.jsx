import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function MobileNav() {
  const location = useLocation();

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '🕒', label: 'Schedule', path: '/timetable' },
    { icon: '📅', label: 'Calendar', path: '/calendar' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '✨', label: 'About', path: '/about' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="mobile-nav">
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
    </nav>
  );
}

export default MobileNav;
