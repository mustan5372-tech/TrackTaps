import React, { useState, useEffect } from 'react';

function Settings() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = `${newTheme}-mode`;
  };

  return (
    <div className="settings-view">
      <header className="view-header">
        <h2>Settings</h2>
      </header>

      <div className="settings-grid" style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">Appearance</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '16px' }}>
            <button
              onClick={() => handleThemeChange('dark')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: theme === 'dark' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                background: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🌙 Dark Mode
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: theme === 'light' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                background: theme === 'light' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ☀️ Light Mode
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">About TrackTaps</span>
          </div>
          <div style={{ padding: '20px', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Platform:</strong> Web & Mobile</p>
            <p style={{ marginTop: '16px' }}>TrackTaps is a smart attendance tracking platform designed to help students manage their academic attendance efficiently.</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">Data Management</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all data?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🗑️ Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
