import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';

const Eye = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOff = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const LogOut = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const SkeletonCard = () => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '24px',
    height: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ height: '24px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} className="skeleton-shimmer" />
      <div style={{ height: '20px', width: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }} className="skeleton-shimmer" />
    </div>
    <div style={{ height: '16px', width: '40%', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} className="skeleton-shimmer" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 'auto' }}>
      <div style={{ height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} className="skeleton-shimmer" />
      <div style={{ height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} className="skeleton-shimmer" />
    </div>
    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }} className="skeleton-shimmer" />
  </div>
);

const LoadingStatus = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Connecting to Pod.ai servers...",
    "Fetching your attendance records...",
    "Syncing classroom data...",
    "Preparing your dashboard...",
    "Loading academic insights...",
    "Almost there..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '80px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '24px'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid var(--primary-glow)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-main)',
          margin: 0,
          animation: 'pulse 2s infinite'
        }}>
          {messages[msgIdx]}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>This usually takes a few seconds</p>
      </div>
    </div>
  );
};

export default function Pod() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const { syncPodaiSubjects, setPodaiSyncStatus, fullSync, subscription } = useAppStore();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('pod_auth_token');
    if (token) {
      setIsLoggedIn(true);
      const cachedName = localStorage.getItem('pod_user_name');
      if (cachedName) {
        setDisplayName(cachedName);
      }
      fetchClassrooms(token);
    }
  }, []);

  const fetchClassrooms = async (token) => {
    setError('');
    setClassroomsLoading(true);
    try {
      console.log('[Pod] Fetching classrooms with token:', token);
      const res = await fetch('/api/pod/classrooms', {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      const text = await res.text();
      if (!text) throw new Error('Pod.ai API returned an empty response. Check your connection.');
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('[Pod] JSON Parse Error. Raw response:', text);
        throw new Error('Server returned invalid data format. Please try again later.');
      }
      
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(data.error || 'Pod.ai servers are busy. Please try again.');
      }
      
      const classroomsList = data.classrooms || [];
      setClassrooms(classroomsList);
      
      if (classroomsList.length > 0) {
        fetchAttendance(token, classroomsList);
      }
    } catch (err) {
      console.error('[Pod] Error fetching classrooms:', err);
      setError(err.message || 'Unable to connect to Pod.ai. Please check your internet.');
    } finally {
      setClassroomsLoading(false);
    }
  };

  const fetchAttendance = async (token, classroomsList) => {
    setAttendanceLoading(true);
    try {
      const attendanceResults = {};
      
      for (const classroom of classroomsList) {
        try {
          const res = await fetch(`/api/pod/attendance?classroom=${classroom.token}`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          const text = await res.text();
          if (!text) {
            attendanceResults[classroom.token] = { total: 0, attended: 0, avgAttendance: 0, missed: 0 };
            continue;
          }

          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            attendanceResults[classroom.token] = { total: 0, attended: 0, avgAttendance: 0, missed: 0 };
            continue;
          }
          
          if (!res.ok) {
            attendanceResults[classroom.token] = { total: 0, attended: 0, avgAttendance: 0, missed: 0 };
            continue;
          }
          
          attendanceResults[classroom.token] = {
            total: data.total || 0,
            attended: data.attended || 0,
            avgAttendance: data.averagePercent || 0,
            missed: data.missed || 0
          };
        } catch (err) {
          attendanceResults[classroom.token] = { total: 0, attended: 0, avgAttendance: 0, missed: 0 };
        }
      }
      
      setAttendanceData(attendanceResults);
    } catch (err) {
      setError('Attendance fetch partially failed. Some subjects might show 0%.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleRetry = () => {
    const token = localStorage.getItem('pod_auth_token');
    if (token) {
      fetchClassrooms(token);
    }
  };

  const handleManualSync = async () => {
    if (classrooms.length === 0 || Object.keys(attendanceData).length === 0) {
      setError('No data available to sync. Please wait for attendance to load.');
      return;
    }

    setIsSyncing(true);
    try {
      const subjectsToSync = classrooms.map(classroom => ({
        token: classroom.token,
        title: classroom.title,
        ...attendanceData[classroom.token]
      }));
      
      await syncPodaiSubjects(subjectsToSync);
      fullSync();
      setPodaiSyncStatus({ connected: true, lastSync: new Date().toISOString() });
      
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      setError('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pod/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const text = await res.text();
      if (!text) throw new Error('Server returned an empty response. Verify the backend is running on port 3001.');

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('[Pod Login] Parse error:', text);
        throw new Error('API Login Error: Received invalid response from server.');
      }

      if (!res.ok) throw new Error(data.error || 'Invalid credentials or server busy.');
      
      localStorage.setItem('pod_auth_token', data.auth_token);
      localStorage.setItem('pod_username', username);
      if (data.user?.name) {
        localStorage.setItem('pod_user_name', data.user.name);
        setDisplayName(data.user.name);
      } else {
        setDisplayName(username);
      }
      setIsLoggedIn(true);
      setActiveTab('Attendance');
      fetchClassrooms(data.auth_token);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pod_auth_token');
    localStorage.removeItem('pod_username');
    localStorage.removeItem('pod_user_name');
    setIsLoggedIn(false);
    setDisplayName('');
    setClassrooms([]);
    setAttendanceData({});
    setUsername('');
    setPassword('');
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return '#10b981';
    if (percentage >= 65) return '#f59e0b';
    return '#ef4444';
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface) 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '24px', fontWeight: '700' }}>
            Pod.ai Dashboard
          </h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '32px', fontSize: '14px' }}>
            Sign in to your Pod.ai account
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#ef4444',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your.email@medicaps.ac.in"
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-main)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-main)',
                    padding: '10px 12px',
                    paddingRight: '40px',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: isLoading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #a855f7 0%, var(--primary) 100%)',
                color: 'var(--text-main)',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isActuallyLoading = classroomsLoading || (classrooms.length > 0 && attendanceLoading && Object.keys(attendanceData).length === 0);

  return (
    <div style={{ 
      background: 'var(--surface)', 
      height: '100vh', 
      color: 'var(--text-main)', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        @media (max-width: 768px) {
          .pod-header-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .pod-header-left {
            width: 100% !important;
          }
          .pod-header-right {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .pod-header-right button {
            flex: 1 !important;
            padding: 10px 12px !important;
            font-size: 13px !important;
          }
          .pod-tabs {
            margin: 12px auto 0 !important;
            gap: 20px !important;
            overflow-x: auto !important;
            padding-bottom: 4px !important;
          }
          .pod-view-content {
            padding: 16px 12px 100px 12px !important;
          }
        }
      `}</style>

      {/* Fixed Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        zIndex: 10
      }}>
        <div 
          className="pod-header-content"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          <div className="pod-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--surface-glass)',
                border: '1px solid var(--border)',
                color: 'var(--text-dim)',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--surface-glass)';
                e.currentTarget.style.color = 'var(--text-dim)';
              }}
              title="Back to TrackTaps"
            >
              🏠
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', background: 'linear-gradient(135deg, var(--primary-light) 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pod Dashboard
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '13px' }}>Welcome back, {displayName}</p>
                {subscription?.status === 'active' && (
                  <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    ✨ AUTO-SYNC ACTIVE
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="pod-header-right" style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleManualSync}
              disabled={isSyncing || attendanceLoading || isActuallyLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #a855f7 0%, var(--primary) 100%)',
                border: 'none',
                color: 'var(--text-main)',
                padding: '10px 20px',
                borderRadius: '12px',
                cursor: (isSyncing || attendanceLoading || isActuallyLoading) ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 0 20px var(--primary-glow)',
                transition: 'all 0.3s ease',
                opacity: (isSyncing || attendanceLoading || isActuallyLoading) ? 0.7 : 1
              }}
            >
              {isSyncing ? 'Syncing...' : 'Sync to TrackTaps'}
              {!isSyncing && <span>🔄</span>}
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div 
          className="pod-tabs"
          style={{
            display: 'flex',
            gap: '32px',
            maxWidth: '1200px',
            margin: '20px auto 0'
          }}
        >
          {['Attendance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? 'var(--primary-light)' : 'var(--text-muted)',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '3px solid var(--primary-light)' : '3px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div 
        className="pod-view-content"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 20px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {syncSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{
                background: 'var(--success)',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}>
                ✓
              </div>
              <div>
                <h4 style={{ color: 'var(--success)', margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>Sync Successful!</h4>
                <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '13px' }}>Your attendance has been perfectly synchronized from Pod.ai.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'Attendance' && (
            <div>
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  color: '#ef4444',
                  fontSize: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <p style={{ margin: 0, fontWeight: '600' }}>⚠️ {error}</p>
                  <button 
                    onClick={handleRetry}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '6px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    Retry Connection
                  </button>
                </div>
              )}
              
              {isActuallyLoading ? (
                <>
                  <LoadingStatus />
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '20px',
                    opacity: 0.5
                  }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                  </div>
                </>
              ) : classrooms.length === 0 && !error ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-dim)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍃</div>
                  <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px 0' }}>No classrooms found</h3>
                  <p style={{ margin: 0 }}>We couldn't find any active classrooms in your Pod.ai account.</p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                  gap: '20px' 
                }}>
                  {classrooms.map((classroom) => {
                    const att = attendanceData[classroom.token] || {};
                    const percentage = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;
                    
                    return (
                      <div
                        key={classroom.token}
                        style={{
                          background: 'var(--surface-glass)',
                          border: '1px solid var(--border)',
                          borderRadius: '20px',
                          padding: '24px',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', flex: 1 }}>
                            {classroom.title}
                          </h3>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '800', 
                            color: getAttendanceColor(percentage),
                            background: `${getAttendanceColor(percentage)}20`,
                            padding: '4px 10px',
                            borderRadius: '100px'
                          }}>
                            {percentage}%
                          </span>
                        </div>

                        {classroom.creatorDetails?.name && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0', fontWeight: '500' }}>
                            👨‍🏫 {classroom.creatorDetails.name}
                          </p>
                        )}
                        
                        {att.total === undefined ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ height: '14px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} className="skeleton-shimmer" />
                            <div style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }} className="skeleton-shimmer" />
                          </div>
                        ) : (
                          <>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '16px',
                              marginBottom: '20px'
                            }}>
                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Attended</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{att.attended}</p>
                              </div>
                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Total</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{att.total}</p>
                              </div>
                            </div>

                            <div style={{
                              height: '6px',
                              background: 'var(--border)',
                              borderRadius: '10px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(percentage, 100)}%`,
                                background: `linear-gradient(90deg, ${getAttendanceColor(percentage)} 0%, var(--text-main) 200%)`,
                                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 0 10px ${getAttendanceColor(percentage)}`
                              }} />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
