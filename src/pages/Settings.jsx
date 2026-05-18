import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

function Settings() {
  const navigate = useNavigate();
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
    subscription,
    clearAppData,
    semesterSettings,
    setSemesterSettings,
    addHoliday,
    removeHoliday,
    addExamPeriod,
    removeExamPeriod,
    addWorkingSaturday,
    removeWorkingSaturday,
    theme,
    setTheme,
    setAuthModalOpen,
    referralData,
    attendanceSettings,
    setAttendanceSettings
  } = useAppStore();

  const [localCriteria, setLocalCriteria] = useState({
    defaultTarget: attendanceSettings?.defaultTarget || 75,
    warningLevel: attendanceSettings?.warningLevel || 80,
    criticalLevel: attendanceSettings?.criticalLevel || 65
  });

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    if (attendanceSettings) {
      setLocalCriteria({
        defaultTarget: attendanceSettings.defaultTarget,
        warningLevel: attendanceSettings.warningLevel,
        criticalLevel: attendanceSettings.criticalLevel
      });
    }
  }, [attendanceSettings]);

  const hasCriteriaChanged = () => {
    if (!attendanceSettings) return false;
    return (
      localCriteria.defaultTarget !== attendanceSettings.defaultTarget ||
      localCriteria.warningLevel !== attendanceSettings.warningLevel ||
      localCriteria.criticalLevel !== attendanceSettings.criticalLevel
    );
  };

  const handleSaveCriteria = () => {
    setAttendanceSettings(localCriteria);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tracktaps_settings') || '{}');
    setSettings(prev => ({ ...prev, ...saved }));
  }, []);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('tracktaps_settings', JSON.stringify(newSettings));
  };

  // handleThemeChange removed in favor of appStore.setTheme

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
            padding: 8px 0 120px 0 !important;
          }
          .view-header {
            padding: 24px 20px !important;
            background: var(--bg-primary) !important;
            border-bottom: 1px solid var(--border) !important;
            margin-bottom: 0px !important;
          }
          .settings-grid {
            grid-template-columns: 1fr !important;
            padding: 0 16px !important;
            gap: 16px !important;
          }
          .dashboard-card {
            padding: 20px !important;
            border-radius: var(--card-radius) !important;
          }
          .criteria-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .theme-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .account-actions {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .timetable-settings-grid {
             grid-template-columns: 1fr !important;
             gap: 16px !important;
          }
        }
      `}</style>

      <div className="settings-grid" style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Account & Sync */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">☁️ Account & Cloud Sync</span>
          </div>
          <div style={{ padding: '20px', position: 'relative' }}>
            {isAuthLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '16px',
                backdropFilter: 'blur(4px)'
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: '40px', height: '40px', border: '3px solid var(--primary-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: '12px' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--primary-light)', fontWeight: '600' }}>Signing you in...</span>
              </div>
            )}
            {!user ? (
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>
                  Sign in with Google to enable cross-device sync and cloud backups.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAuthModalOpen(true)}
                  disabled={isAuthLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, var(--surface-glass) 100%)',
                    color: 'var(--text-main)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '16px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                  {isAuthLoading ? 'Authenticating...' : 'Continue with Google'}
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* User Identity Details Card */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  padding: '24px', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`} 
                        alt={user.displayName} 
                        style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--primary)' }} 
                      />
                      <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        right: 0, 
                        background: 'var(--primary)', 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '10px',
                        border: '2px solid #0f172a'
                      }}>
                        {user.providerData?.[0]?.providerId === 'google.com' ? 'G' : '📱'}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '18px', margin: 0 }}>{user.displayName || 'TrackTaps User'}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>ID: {user.uid.substring(0, 12)}...</p>
                    </div>
                    <button
                      onClick={logout}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: '#ef4444', 
                        padding: '8px 16px', 
                        borderRadius: '10px', 
                        fontSize: '12px', 
                        fontWeight: '700',
                        cursor: 'pointer' 
                      }}
                    >
                      Logout
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</label>
                      <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '500' }}>{user.email || 'Not provided'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</label>
                      <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '500' }}>{user.phoneNumber || 'Not linked'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Login Method</label>
                      <p style={{ fontSize: '13px', color: 'var(--primary-light)', margin: 0, fontWeight: '700' }}>
                        {user.providerData?.[0]?.providerId === 'google.com' ? 'Google Account' : 
                         user.providerData?.[0]?.providerId === 'phone' ? 'Mobile OTP' : 'Email & Password'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="account-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={() => {
                      if (subscription.status !== 'active') {
                        alert("💎 Premium Required: Cloud Backup is a TrackTaps Plus feature. Please upgrade to sync your data.");
                        navigate('/premium');
                        return;
                      }
                      pushToCloud(true);
                    }}
                    disabled={isSyncing}
                    style={{
                      background: 'var(--primary-glow)',
                      border: '1px solid var(--primary-glow)',
                      color: 'var(--primary-light)',
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
                      background: 'var(--primary-glow)',
                      border: '1px solid var(--primary-glow)',
                      color: 'var(--primary-light)',
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
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', margin: 0 }}>
                    Last Cloud Backup: {new Date(lastCloudSync).toLocaleString()}
                  </p>
                )}
                {podaiSyncStatus?.lastSync && (
                  <p style={{ color: 'var(--primary-light)', fontSize: '11px', textAlign: 'center', margin: '4px 0 0 0', fontWeight: '500' }}>
                    Last Pod.ai Sync: {new Date(podaiSyncStatus.lastSync).toLocaleString()} {subscription?.status === 'active' ? '(Auto)' : '(Manual)'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Attendance Criteria */}
        <div className="dashboard-card" style={{ position: 'relative' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">📊 Attendance Criteria</span>
            <AnimatePresence>
              {hasCriteriaChanged() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleSaveCriteria}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px var(--primary-glow)'
                  }}
                >
                  Save Changes
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {showSaveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  margin: '0 20px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ✅ Attendance criteria updated successfully.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="criteria-grid" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Default Target: {localCriteria.defaultTarget}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={localCriteria.defaultTarget}
                onChange={(e) => setLocalCriteria({ ...localCriteria, defaultTarget: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Warning Level: {localCriteria.warningLevel}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={localCriteria.warningLevel}
                onChange={(e) => setLocalCriteria({ ...localCriteria, warningLevel: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Critical Level: {localCriteria.criticalLevel}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={localCriteria.criticalLevel}
                onChange={(e) => setLocalCriteria({ ...localCriteria, criticalLevel: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Premium Appearance */}
        <div className="dashboard-card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">🎨 Premium Themes & Appearance</span>
            {subscription?.status !== 'active' && (
              <span style={{ 
                fontSize: '10px', 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                padding: '4px 10px', 
                borderRadius: '100px', 
                fontWeight: '900' 
              }}>UPGRADE TO PLUS</span>
            )}
          </div>
          
          <div style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '20px' }}>
              Personalize your TrackTaps experience with high-fidelity themes.
            </p>

            <div className="theme-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '16px' 
            }}>
              {[
                { id: 'default', name: 'Default Dark', type: 'free', bg: 'var(--bg-primary)', primary: 'var(--primary)', icon: '🌙' },
                { id: 'light', name: 'Basic Light', type: 'free', bg: 'var(--text-main)', primary: '#7c3aed', icon: '☀️' },
                { id: 'amoled', name: 'AMOLED Dark', type: 'premium', bg: '#000000', primary: '#ffffff', icon: '🌑' },
                { id: 'neon', name: 'Neon Purple', type: 'premium', bg: '#1e1b4b', primary: '#d946ef', icon: '🔮' },
                { id: 'cyberpunk', name: 'Cyberpunk', type: 'premium', bg: '#050505', primary: '#00f2ff', icon: '⚡' },
                { id: 'midnight', name: 'Midnight Blue', type: 'premium', bg: 'var(--surface)', primary: '#38bdf8', icon: '🌊' },
                { id: 'gold', name: 'Royal Gold', type: 'premium', bg: '#0c0a09', primary: '#f59e0b', icon: '👑' },
                { id: 'minimal', name: 'Minimal White', type: 'premium', bg: '#ffffff', primary: '#111827', icon: '⬜' },
                { id: 'pod', name: 'Pod Purple', type: 'premium', bg: 'var(--bg-primary)', primary: '#6366f1', icon: '📦' },
              ].map(t => {
                const isLocked = t.type === 'premium' && subscription?.status !== 'active';
                const isActive = theme === t.id;

                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const success = setTheme(t.id);
                      if (!success) {
                        navigate('/premium');
                      }
                    }}
                    style={{
                      background: t.bg,
                      border: isActive ? `2px solid ${t.primary}` : '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minHeight: '100px',
                      boxShadow: isActive ? `0 0 20px ${t.primary}30` : 'none',
                      opacity: isLocked ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px' }}>{t.icon}</span>
                      {isLocked && <span style={{ fontSize: '14px' }}>🔒</span>}
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: t.id === 'light' || t.id === 'minimal' ? 'var(--surface)' : 'var(--text-main)' }}>
                        {t.name}
                      </div>
                      <div style={{ 
                        height: '4px', 
                        width: '24px', 
                        background: t.primary, 
                        borderRadius: '100px',
                        marginTop: '4px'
                      }} />
                    </div>

                    {isActive && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        width: '8px', 
                        height: '8px', 
                        background: t.primary, 
                        borderRadius: '50%',
                        boxShadow: `0 0 10px ${t.primary}`
                      }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pod.ai Integration */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">🔗 Pod.ai Integration</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
              Pod.ai integration is now available at <strong>/pod</strong>. Visit the Pod Dashboard to manage your attendance and activities.
            </p>
            <a 
              href="/pod" 
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7 0%, var(--primary) 100%)',
                color: 'var(--text-main)',
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

        {/* Subscription & Billing */}
        <div className="dashboard-card" style={{ marginTop: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">💳 Subscription & Billing</span>
            {subscription?.plan === 'plus' && (
              <span style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                fontSize: '10px', 
                fontWeight: '800', 
                padding: '2px 8px', 
                borderRadius: '4px' 
              }}>PLUS</span>
            )}
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  Current Plan: <span style={{ color: subscription?.plan === 'plus' ? 'var(--primary-light)' : 'var(--text-dim)' }}>
                    {subscription?.plan === 'plus' ? `${subscription.planType?.toUpperCase() || 'PLUS'}` : 'Free'}
                  </span>
                </p>
                {subscription?.expiryDate && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Expires on: {new Date(subscription.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate('/premium')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: subscription?.plan === 'plus' ? 'rgba(255,255,255,0.05)' : 'var(--primary-glow)',
                  color: subscription?.plan === 'plus' ? 'var(--text-main)' : 'var(--primary-light)',
                  border: '1px solid var(--primary-glow)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {subscription?.plan === 'plus' ? 'Manage' : 'Upgrade'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
              {subscription?.plan === 'plus' 
                ? 'Your premium features are active across all devices.' 
                : 'Unlock Cloud Sync, AI Insights, and more with Plus.'}
            </p>
          </div>
        </div>

        {/* Timetable Settings */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">🕒 Timetable Settings</span>
          </div>
          <div className="timetable-settings-grid" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Default Duration (min)</label>
              <input
                type="number"
                value={settings.defaultDuration}
                onChange={(e) => handleChange('defaultDuration', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Grid Start Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.gridStartHour}
                onChange={(e) => handleChange('gridStartHour', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Grid End Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.gridEndHour}
                onChange={(e) => handleChange('gridEndHour', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
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
                border: '1px solid var(--primary-glow)',
                background: 'var(--primary-glow)',
                color: 'var(--primary-light)',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📥 Export Data
            </button>
            <label style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--primary-glow)',
              background: 'var(--primary-glow)',
              color: 'var(--primary-light)',
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

        {/* Campus Launch Referral */}
        <div className="dashboard-card" style={{ 
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid var(--primary-glow)',
          overflow: 'hidden'
        }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">🎁 Campus Launch Campaign</span>
            <span style={{ 
              fontSize: '10px', 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '100px', 
              fontWeight: '900' 
            }}>EARLY ACCESS</span>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
              Invite 10 active students to TrackTaps and unlock <strong>30 Days of Premium Plus</strong> for free.
            </p>
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              padding: '12px', 
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '700' }}>Your Progress</span>
              <span style={{ fontSize: '14px', color: 'var(--primary-light)', fontWeight: '800' }}>
                {referralData?.totalValidReferrals || 0} / 10
              </span>
            </div>
            <button 
              onClick={() => navigate('/referral')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--primary-glow)',
                color: 'var(--primary-light)',
                border: '1px solid var(--primary-glow)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Invite & Earn Premium →
            </button>
          </div>
        </div>

        {/* About */}
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">ℹ️ About TrackTaps</span>
          </div>
          <div style={{ padding: '20px', color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Platform:</strong> Web & Mobile</p>
            <p style={{ marginTop: '16px' }}>TrackTaps is a smart attendance tracking platform designed to help students manage their academic attendance efficiently with AI-powered insights and predictions.</p>
            <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>© 2026 TrackTaps. All rights reserved.</p>
          </div>
        </div>

        {/* Community & Leaderboard */}
        <div className="dashboard-card" style={{ border: '1px solid var(--primary-glow)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(15, 23, 42, 0.2) 100%)' }}>
          <div className="card-header">
            <span className="card-title">🏆 Global Community</span>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
              See where you stand among the most consistent students on TrackTaps. Premium members can be featured on the global leaderboard.
            </p>
            <button 
              onClick={() => navigate('/community')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px var(--primary-glow)'
              }}
            >
              View Global Leaderboard
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

export default Settings;
