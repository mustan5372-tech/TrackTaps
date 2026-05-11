import React, { useState, useEffect } from 'react';

function Settings() {
  const [settings, setSettings] = useState({
    userName: '',
    collegeName: '',
    acadYear: '',
    semester: '',
    defaultCriteria: 75,
    warningThreshold: 80,
    criticalThreshold: 65,
    theme: 'dark',
    displayMode: 'dark',
    glassEffect: true,
    defaultDuration: 60,
    gridStartHour: 8,
    gridEndHour: 18
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tracktaps_settings') || '{}');
    setSettings(prev => ({ ...prev, ...saved }));
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `${savedTheme}-mode`;
  }, []);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('tracktaps_settings', JSON.stringify(newSettings));
  };

  const handleThemeChange = (newTheme) => {
    handleChange('theme', newTheme);
    handleChange('displayMode', newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = `${newTheme}-mode`;
  };

  const handleExportData = () => {
    const data = {
      subjects: JSON.parse(localStorage.getItem('tracktaps_subjects') || '[]'),
      attendance: JSON.parse(localStorage.getItem('tracktaps_attendance') || '{}'),
      timetable: JSON.parse(localStorage.getItem('tracktaps_timetable') || '[]'),
      settings: settings
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracktaps-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result);
        if (data.subjects) localStorage.setItem('tracktaps_subjects', JSON.stringify(data.subjects));
        if (data.attendance) localStorage.setItem('tracktaps_attendance', JSON.stringify(data.attendance));
        if (data.timetable) localStorage.setItem('tracktaps_timetable', JSON.stringify(data.timetable));
        if (data.settings) {
          setSettings(data.settings);
          localStorage.setItem('tracktaps_settings', JSON.stringify(data.settings));
        }
        alert('Data imported successfully!');
        window.location.reload();
      } catch (err) {
        alert('Error importing data: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-view">
      <header className="view-header">
        <h2>Settings</h2>
      </header>

      <div className="settings-grid" style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Profile Settings */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">👤 Profile Information</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Name</label>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
                placeholder="Your name"
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>College</label>
              <input
                type="text"
                value={settings.collegeName}
                onChange={(e) => handleChange('collegeName', e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
                placeholder="College name"
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Academic Year</label>
              <input
                type="text"
                value={settings.acadYear}
                onChange={(e) => handleChange('acadYear', e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Semester</label>
              <input
                type="text"
                value={settings.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
                placeholder="e.g., Semester 3"
              />
            </div>
          </div>
        </div>

        {/* Attendance Criteria */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">📊 Attendance Criteria</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Default Target: {settings.defaultCriteria}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.defaultCriteria}
                onChange={(e) => handleChange('defaultCriteria', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Warning Level: {settings.warningThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.warningThreshold}
                onChange={(e) => handleChange('warningThreshold', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Critical Level: {settings.criticalThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.criticalThreshold}
                onChange={(e) => handleChange('criticalThreshold', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">🎨 Appearance</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleThemeChange('dark')}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: settings.theme === 'dark' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                background: settings.theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
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
                minWidth: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: settings.theme === 'light' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                background: settings.theme === 'light' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ☀️ Light Mode
            </button>
            <label style={{
              flex: 1,
              minWidth: '120px',
              padding: '12px',
              borderRadius: '8px',
              border: settings.glassEffect ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
              background: settings.glassEffect ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                checked={settings.glassEffect}
                onChange={(e) => handleChange('glassEffect', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              ✨ Glass Effect
            </label>
          </div>
        </div>

        {/* Timetable Settings */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">🕒 Timetable Settings</span>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Default Duration (min)</label>
              <input
                type="number"
                value={settings.defaultDuration}
                onChange={(e) => handleChange('defaultDuration', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Grid Start Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.gridStartHour}
                onChange={(e) => handleChange('gridStartHour', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Grid End Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.gridEndHour}
                onChange={(e) => handleChange('gridEndHour', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">💾 Data Management</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={handleExportData}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#a78bfa',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📥 Export Data
            </button>
            <label style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#a78bfa',
              cursor: 'pointer',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              📤 Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
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

        {/* About */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">ℹ️ About TrackTaps</span>
          </div>
          <div style={{ padding: '20px', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Platform:</strong> Web & Mobile</p>
            <p style={{ marginTop: '16px' }}>TrackTaps is a smart attendance tracking platform designed to help students manage their academic attendance efficiently with AI-powered insights and predictions.</p>
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>© 2026 TrackTaps. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
