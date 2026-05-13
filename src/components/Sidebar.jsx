import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../icon.png';
import useAppStore from '../store/appStore';

function Sidebar() {
  const location = useLocation();
  const { role } = useAppStore();

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

  if (role === 'ADMIN_OWNER') {
    navItems.push({ label: 'Admin Panel', path: '/admin' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-branding">
        <Link to="/" className="logo-link">
          <img 
            src={logo} 
            alt="TrackTaps Logo" 
            className="sidebar-logo"
            style={{
              width: '140px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.3))',
              transition: 'all 0.3s ease'
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
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
