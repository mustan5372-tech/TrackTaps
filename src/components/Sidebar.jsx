import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Timetable', path: '/timetable' },
    { label: 'Subjects', path: '/subjects' },
    { label: 'Insights', path: '/insights' },
    { label: 'History', path: '/history' },
    { label: 'About', path: '/about' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-branding">
        <Link to="/">
          <img src="/assets/logo.png" alt="TrackTaps Logo" className="sidebar-logo" />
        </Link>
      </div>
      <nav className="nav-menu">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
