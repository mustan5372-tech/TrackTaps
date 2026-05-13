import React, { useState, useEffect } from 'react';
import useAppStore from '../store/appStore';

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

  const [podaiEmail, setPodaiEmail] = useState('');
  const [podaiPassword, setPodaiPassword] = useState('');
  const [podaiConnected, setPodaiConnected] = useState(false);
  const [podaiLoading, setPodaiLoading] = useState(false);
  const [podaiMessage, setPodaiMessage] = useState('');
  const [podaiSyncing, setPodaiSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [showExportToast, setShowExportToast] = useState(false);

  const {
    subjects,
    timetable,
    calendarEvents,
    attendanceData,
    history,
    podaiSyncStatus,
    user,
    isAuthLoading,
    isSyncing,
    lastCloudSync,
    login,
    logout,
    pushToCloud,
    pullFromCloud,
    clearAppData
  } = useAppStore();

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
    try {
      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        subjects: subjects,
        timetable: timetable,
        attendance: attendanceData,
        calendar: calendarEvents,
        history: history,
        podSync: podaiSyncStatus,
        settings: settings
      };
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracktaps-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 3000);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
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

  const handlePodaiConnect = async () => {
    setPodaiMessage('Pod.ai integration is now available at /pod');
  };

  const handlePodaiSync = async () => {
    setPodaiMessage('Pod.ai integration is now available at /pod');
  };

  const handlePodaiDisconnect = () => {
    setPodaiMessage('Pod.ai integration is now available at /pod');
  };

  return (
    <div className="settings-view">
      <header className="view-header">
        <h2>Settings</h2>
      </header>

      {showExportToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          ✨ Data exported successfully!
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 768px) {
          .settings-view {
            padding-bottom: 100px !important;
          }
          .settings-grid {
            grid-template-columns: 1fr !important;
            padding: 0 4px !important;
          }
          .dashboard-card div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="settings-grid" style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Account & Sync */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">☁️ Account & Cloud Sync</span>
          </div>
          <div style={{ padding: '20px' }}>
            {!user ? (
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                  Sign in with Google to enable cross-device sync and cloud backups.
                </p>
                <button
                  onClick={login}
                  disabled={isAuthLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    width: '100%',
                    background: 'white',
                    color: '#1e293b',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/hf/google.svg" alt="Google" style={{ width: '18px' }} />
                  {isAuthLoading ? 'Connecting...' : 'Sign in with Google'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <img src={user.photoURL} alt={user.displayName} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #8b5cf6' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#f8fafc', fontWeight: '700', margin: 0 }}>{user.displayName}</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={pushToCloud}
                    disabled={isSyncing}
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#a78bfa',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: isSyncing ? 0.7 : 1
                    }}
                  >
                    📤 {isSyncing ? 'Syncing...' : 'Backup to Cloud'}
                  </button>
                  <button
                    onClick={() => pullFromCloud(true)}
                    disabled={isSyncing}
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#a78bfa',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: isSyncing ? 0.7 : 1
                    }}
                  >
                    📥 {isSyncing ? 'Syncing...' : 'Restore from Cloud'}
                  </button>
                </div>
                {lastCloudSync && (
                  <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', margin: 0 }}>
                    Last Cloud Sync: {new Date(lastCloudSync).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

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

        {/* Pod.ai Integration */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">🔗 Pod.ai Integration</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Pod.ai integration is now available at <strong>/pod</strong>. Visit the Pod Dashboard to manage your attendance and activities.
            </p>
            <a 
              href="/pod" 
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '600',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'block'
              }}
            >
              🔗 Go to Pod Dashboard
            </a>
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
                if (window.confirm('Are you sure you want to clear all local data? This will NOT delete your Cloud Backup or log you out.')) {
                  clearAppData();
                  alert('Local data cleared! You can restore it from the cloud if you have a backup.');
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
