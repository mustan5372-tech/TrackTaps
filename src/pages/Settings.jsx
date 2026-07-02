import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import versionData from '../../version.json';

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
    role,
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

  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);

  const THEME_LIST = [
    {
      id: 'default',
      name: 'TrackTaps Default',
      description: 'The classic signature deep violet dark space.',
      icon: '🔮',
      isPremium: false,
      isDark: true,
      colors: {
        bg: '#0e091b',
        primary: '#8b5cf6',
        accent: '#d946ef',
        surface: 'rgba(255, 255, 255, 0.08)',
        text: '#f8fafc',
        glow: 'rgba(139, 92, 246, 0.35)'
      }
    },
    {
      id: 'light',
      name: 'TrackTaps Light',
      description: 'Clean, elegant default light interface.',
      icon: '☀️',
      isPremium: false,
      isDark: false,
      colors: {
        bg: '#fcfaff',
        primary: '#7c3aed',
        accent: '#db2777',
        surface: 'rgba(255, 255, 255, 0.65)',
        text: '#120b30',
        glow: 'rgba(124, 58, 237, 0.15)'
      }
    },
    {
      id: 'lavender_glass',
      name: 'Lavender Abyss',
      description: 'Deep space-purple theme with neon-lavender glows.',
      icon: '🌌',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#0d081d',
        primary: '#b794f4',
        accent: '#f472b6',
        surface: 'rgba(255, 255, 255, 0.05)',
        text: '#f3e8ff',
        glow: 'rgba(183, 148, 244, 0.25)'
      }
    },
    {
      id: 'midnight_graphite',
      name: 'Midnight Graphite',
      description: 'Sleek minimal slate graphite with ice-blue accents.',
      icon: '🪨',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#0f172a',
        primary: '#38bdf8',
        accent: '#06b6d4',
        surface: 'rgba(255, 255, 255, 0.05)',
        text: '#f8fafc',
        glow: 'rgba(56, 189, 248, 0.30)'
      }
    },
    {
      id: 'arctic_frost',
      name: 'Nordic Aurora',
      description: 'Teal polar lights glowing over deep dark blue skies.',
      icon: '✨',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#040d1a',
        primary: '#34d399',
        accent: '#38bdf8',
        surface: 'rgba(255, 255, 255, 0.04)',
        text: '#e0f2fe',
        glow: 'rgba(52, 211, 153, 0.20)'
      }
    },
    {
      id: 'ocean_breeze',
      name: 'Abyssal Blue',
      description: 'Obsidian deep-sea dark theme with cyan highlights.',
      icon: '🌊',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#030712',
        primary: '#3b82f6',
        accent: '#06b6d4',
        surface: 'rgba(255, 255, 255, 0.05)',
        text: '#eff6ff',
        glow: 'rgba(59, 130, 246, 0.25)'
      }
    },
    {
      id: 'forest_sage',
      name: 'Emerald Abyss',
      description: 'Deep forest-black with rich emerald green and gold glows.',
      icon: '🌿',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#040d0a',
        primary: '#10b981',
        accent: '#f59e0b',
        surface: 'rgba(255, 255, 255, 0.04)',
        text: '#ecfdf5',
        glow: 'rgba(16, 185, 129, 0.20)'
      }
    },
    {
      id: 'sunset_amber',
      name: 'Solar Eclipse',
      description: 'Volcanic dark chocolate theme with solar amber glows.',
      icon: '🌇',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#0c0602',
        primary: '#f97316',
        accent: '#eab308',
        surface: 'rgba(255, 255, 255, 0.05)',
        text: '#fff7ed',
        glow: 'rgba(249, 115, 22, 0.25)'
      }
    },
    {
      id: 'rose_quartz',
      name: 'Cyberpunk Neon',
      description: 'Vibrant high-contrast dark cyberpunk workspace.',
      icon: '⚡',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#08040a',
        primary: '#ec4899',
        accent: '#a855f7',
        surface: 'rgba(255, 255, 255, 0.05)',
        text: '#fdf2f8',
        glow: 'rgba(236, 72, 153, 0.30)'
      }
    },
    {
      id: 'royal_indigo',
      name: 'Royal Indigo',
      description: 'Regal dark indigo with glowing violet gradients.',
      icon: '👑',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#090620',
        primary: '#4f46e5',
        accent: '#8b5cf6',
        surface: 'rgba(255, 255, 255, 0.06)',
        text: '#f8fafc',
        glow: 'rgba(99, 102, 241, 0.25)'
      }
    },
    {
      id: 'monochrome_pro',
      name: 'Monochrome Pro',
      description: 'Pure grayscale jet-black minimal workspace.',
      icon: '⚫',
      isPremium: true,
      isDark: true,
      colors: {
        bg: '#0c0c0c',
        primary: '#f5f5f5',
        accent: '#a3a3a3',
        surface: 'rgba(255, 255, 255, 0.04)',
        text: '#f5f5f5',
        glow: 'rgba(255, 255, 255, 0.15)'
      }
    }
  ];

  const isPremiumUser = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  const handleSelectTheme = (t) => {
    if (t.isPremium && !isPremiumUser) {
      setShowPremiumPrompt(true);
    } else {
      setTheme(t.id);
    }
  };

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
        
        /* Responsive Helper Classes for Settings Mobile UI Fit */
        .profile-card {
          padding: 24px;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }
        .profile-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 16px;
          margin-top: 8px;
        }
        .theme-card {
          padding: 16px;
          border-radius: 16px;
        }
        .billing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
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
            padding: 0 12px !important;
            gap: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .dashboard-card {
            padding: 16px !important;
            border-radius: var(--card-radius) !important;
          }
          .criteria-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .theme-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
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
        
        @media (max-width: 480px) {
          .profile-card {
            padding: 16px !important;
          }
          .profile-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
          .profile-header button {
            width: 100% !important;
            margin-top: 4px !important;
          }
          .profile-details-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .theme-card {
            padding: 12px !important;
          }
          .billing-row {
            flex-direction: column !important;
            align-items: stretch !important;
            text-align: center !important;
          }
          .billing-row button {
            width: 100% !important;
          }
        }
      `}</style>

      <div className="settings-grid" style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Account & Sync */}
        <div className="dashboard-card" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
                borderRadius: '28px',
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
                    borderRadius: '100px',
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
                <div className="profile-card" style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div className="profile-header">
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
                      onClick={async () => {
                        try {
                          // Navigate to home/guest view first so Settings unmounts cleanly
                          navigate('/', { replace: true });
                          // Perform thorough state and session logout
                          await logout();
                        } catch (e) {
                          console.error('Logout handler error:', e);
                        }
                      }}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: '#ef4444', 
                        padding: '8px 16px', 
                        borderRadius: '100px', 
                        fontSize: '12px', 
                        fontWeight: '700',
                        cursor: 'pointer' 
                      }}
                    >
                      Logout
                    </button>
                  </div>

                  <div className="profile-details-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</label>
                      <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '500', wordBreak: 'break-all' }}>{user.email || 'Not provided'}</p>
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
                      borderRadius: '100px',
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
                      borderRadius: '100px',
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
        <div className="dashboard-card" style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
        <div className="dashboard-card" style={{ overflow: 'hidden', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">🎨 Premium Themes & Appearance</span>
            {!isPremiumUser && (
              <span style={{ 
                fontSize: '10px', 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                padding: '4px 10px', 
                borderRadius: '100px', 
                fontWeight: '900',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
              }}>UPGRADE TO PLUS</span>
            )}
          </div>
          
          <div style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.5' }}>
              Personalize your TrackTaps experience with high-fidelity themes. Premium themes feature curated typography, custom transparency, and distinct visual modes.
            </p>

            <div className="theme-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: '20px' 
            }}>
              {THEME_LIST.map(t => {
                const isActive = theme === t.id;

                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTheme(t)}
                    className="theme-card"
                    style={{
                      background: `linear-gradient(135deg, ${t.colors.bg} 0%, ${t.colors.bg}dd 100%)`,
                      border: isActive ? `2.5px solid ${t.colors.primary}` : '1.5px solid var(--border)',
                      borderRadius: '20px',
                      padding: '16px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isActive 
                        ? `0 12px 30px ${t.colors.primary}30, 0 0 15px ${t.colors.primary}20` 
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                  >
                    {/* Background glow orb representation */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '80px',
                      height: '80px',
                      background: t.colors.primary,
                      opacity: t.isDark ? 0.25 : 0.15,
                      filter: 'blur(20px)',
                      borderRadius: '50%',
                      pointerEvents: 'none'
                    }} />

                    {/* Top row: Icon, Name and Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{t.icon}</span>
                        <span style={{ 
                          fontSize: '13.5px', 
                          fontWeight: '800', 
                          color: t.isDark ? '#f8fafc' : '#0f172a',
                          letterSpacing: '-0.02em'
                        }}>
                          {t.name}
                        </span>
                      </div>
                      {t.isPremium && (
                        <span style={{
                          fontSize: '9px',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          fontWeight: '900',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                        }}>
                          PLUS
                        </span>
                      )}
                    </div>

                    {/* Mini App Mock Interface (Apple style) */}
                    <div style={{
                      margin: '12px 0',
                      background: t.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      border: t.isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: '12px',
                      padding: '10px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative',
                      zIndex: 2,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      {/* Mock Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '6px', background: t.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '3px' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.colors.primary }} />
                      </div>

                      {/* Mock Glass Card widget */}
                      <div style={{
                        background: t.colors.surface,
                        border: t.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ width: '60%', height: '4px', background: t.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', borderRadius: '2px' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ flex: 1, height: '4px', background: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '70%', height: '100%', background: t.colors.primary }} />
                          </div>
                          <span style={{ fontSize: '7px', fontWeight: '950', color: t.colors.primary }}>75%</span>
                        </div>
                      </div>

                      {/* Mock Buttons & Dock */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                        <div style={{ flex: 1, height: '12px', borderRadius: '6px', background: t.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '15px', height: '2px', background: '#fff', borderRadius: '1px' }} />
                        </div>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>

                    {/* Description / Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: t.isDark ? '#cbd5e1' : '#1e293b',
                        maxWidth: '80%',
                        lineHeight: '1.2'
                      }}>
                        {t.description}
                      </span>
                      {isActive && (
                        <motion.div 
                          layoutId="activeThemeCheck"
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            background: t.colors.primary, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#fff',
                            boxShadow: `0 0 10px ${t.colors.primary}`
                          }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>

                    {/* Locked overlay for non-premium */}
                    {t.isPremium && !isPremiumUser && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(3px)',
                        WebkitBackdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '8px',
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1.5px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          color: '#f59e0b',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}>
                          🔒
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '900',
                          letterSpacing: '0.05em',
                          color: '#f59e0b',
                          textTransform: 'uppercase',
                          background: 'rgba(245, 158, 11, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          LOCKED
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pod.ai Integration */}
        <div className="dashboard-card" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
                borderRadius: '100px',
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
        <div className="dashboard-card" style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
            <div className="billing-row">
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
                  padding: '8px 20px',
                  borderRadius: '100px',
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
        <div className="dashboard-card" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-main)',
                  padding: '10px 16px',
                  borderRadius: '100px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
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
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-main)',
                  padding: '10px 16px',
                  borderRadius: '100px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
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
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-main)',
                  padding: '10px 16px',
                  borderRadius: '100px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="dashboard-card" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="card-header">
            <span className="card-title">💾 Data Management</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={handleExportData}
              style={{
                padding: '12px',
                borderRadius: '100px',
                border: '1px solid var(--primary-glow)',
                background: 'var(--primary-glow)',
                color: 'var(--primary-light)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📥 Export Data
            </button>
            <label style={{
              padding: '12px',
              borderRadius: '100px',
              border: '1px solid var(--primary-glow)',
              background: 'var(--primary-glow)',
              color: 'var(--primary-light)',
              cursor: 'pointer',
              fontWeight: '600',
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
                borderRadius: '100px',
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🗑️ Clear All Data
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('tracktaps_onboarding_completed');
                localStorage.removeItem('tracktaps_completed_tour');
                localStorage.removeItem('tracktaps_onboarding_seen');
                alert('Onboarding & Guided Tour status reset! Navigate to the Home page to run the tour.');
                navigate('/');
              }}
              style={{
                padding: '12px',
                borderRadius: '100px',
                border: '1px solid var(--primary-light)',
                background: 'rgba(139, 92, 246, 0.1)',
                color: 'var(--primary-light)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📖 Reset & Restart Guided Tour
            </button>
            <button
              onClick={() => navigate('/guide')}
              style={{
                padding: '12px',
                borderRadius: '100px',
                border: '1px solid var(--border)',
                background: 'var(--surface-bright)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ❓ Open Help & Guide Center
            </button>
          </div>
        </div>

        {/* Campus Launch Referral */}
        <div className="dashboard-card" style={{ 
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '28px',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
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
                borderRadius: '100px',
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
        <div className="dashboard-card" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="card-header">
            <span className="card-title">ℹ️ About TrackTaps</span>
          </div>
          <div style={{ padding: '20px', color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>Version:</strong> {versionData.version} (v{versionData.version.split('.').slice(0, 2).join('.')})</p>
            <p><strong>Platform:</strong> Web & Mobile</p>
            <p style={{ marginTop: '16px' }}>TrackTaps is a smart attendance tracking platform designed to help students manage their academic attendance efficiently with AI-powered insights and predictions.</p>
            
            {/* Legal links */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '13px' }}>
              <span onClick={() => navigate('/terms')} style={{ color: 'var(--primary-light)', cursor: 'pointer', fontWeight: '750', textDecoration: 'underline' }}>Terms of Service</span>
              <span onClick={() => navigate('/privacy')} style={{ color: 'var(--primary-light)', cursor: 'pointer', fontWeight: '750', textDecoration: 'underline' }}>Privacy Policy</span>
            </div>

            <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
              🔒 TrackTaps uses lightweight anonymous analytics to improve user experience.
            </p>
            <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>© 2026 TrackTaps. All rights reserved.</p>
          </div>
        </div>

        {/* Community & Leaderboard */}
        <div className="dashboard-card" style={{ border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(15, 23, 42, 0.2) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
                borderRadius: '100px',
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
        
        {/* Premium Themes Modal */}
        <AnimatePresence>
          {showPremiumPrompt && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 100002,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '30px',
                  padding: '28px',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👑</div>
                <h3 style={{ fontSize: '20px', fontWeight: '850', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  Unlock Premium Themes
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13.5px', lineHeight: '1.5', marginBottom: '24px' }}>
                  This is a premium high-fidelity liquid glass theme. Upgrade to TrackTaps Plus to unlock complete personalization, advanced calendars, AI insights, and unlimited group bunk tracking.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setShowPremiumPrompt(false);
                      navigate('/premium');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '100px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      fontWeight: '800',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    🚀 Upgrade to TrackTaps Plus
                  </button>
                  <button
                    onClick={() => setShowPremiumPrompt(false)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '100px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

export default Settings;
