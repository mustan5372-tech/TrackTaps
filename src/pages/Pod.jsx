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
  const { syncPodaiSubjects, setPodaiSyncStatus, fullSync } = useAppStore();

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
    setClassroomsLoading(true);
    try {
      console.log('[Pod] Fetching classrooms with token:', token);
      const res = await fetch('/api/pod/classrooms', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await res.json();
      console.log('[Pod] Classrooms response:', { status: res.status, data });
      
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(data.error || 'Failed to fetch classrooms');
      }
      
      const classroomsList = data.classrooms || [];
      console.log('[Pod] Setting classrooms:', classroomsList);
      setClassrooms(classroomsList);
      
      if (classroomsList.length > 0) {
        console.log('[Pod] Fetching attendance for', classroomsList.length, 'classrooms');
        fetchAttendance(token, classroomsList);
      }
    } catch (err) {
      console.error('[Pod] Error fetching classrooms:', err);
      setError(err.message);
    } finally {
      setClassroomsLoading(false);
    }
  };

  const fetchAttendance = async (token, classroomsList) => {
    setAttendanceLoading(true);
    try {
      console.log('[Pod] Starting attendance fetch for', classroomsList.length, 'classrooms');
      const attendanceResults = {};
      
      for (const classroom of classroomsList) {
        try {
          console.log('[Pod] Fetching attendance for classroom:', classroom.token);
          const res = await fetch(`/api/pod/attendance?classroom=${classroom.token}`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          const data = await res.json();
          console.log('[Pod] Attendance response for', classroom.token, ':', { status: res.status, data });
          
          if (!res.ok) {
            console.error(`Failed to fetch attendance for ${classroom.token}:`, data);
            attendanceResults[classroom.token] = { total: 0, attended: 0, avgAttendance: 0, missed: 0 };
            continue;
          }
          
          attendanceResults[classroom.token] = {
            total: data.total || 0,
            attended: data.attended || 0,
            avgAttendance: data.averagePercent || 0,
            missed: data.missed || 0
          };
          console.log('[Pod] Stored attendance for', classroom.token, ':', attendanceResults[classroom.token]);
        } catch (err) {
          console.error(`Error fetching attendance for ${classroom.token}:`, err);
          attendanceResults[classroom.token] = { total: 0, attended: 0, avgAttendance: 0, missed: 0 };
        }
      }
      
      console.log('[Pod] Final attendance results:', attendanceResults);
      setAttendanceData(attendanceResults);
      
      // Note: Auto-sync removed as per request for manual sync button
    } catch (err) {
      console.error('Error in fetchAttendance:', err);
      setError(err.message);
    } finally {
      setAttendanceLoading(false);
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
      
      console.log('[Pod] Manually syncing subjects to store:', subjectsToSync);
      await syncPodaiSubjects(subjectsToSync);
      fullSync();
      setPodaiSyncStatus({ connected: true, lastSync: new Date().toISOString() });
      
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('[Pod] Sync failed:', err);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
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
      setError(err.message || 'Failed to login');
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: '#1e293b',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ color: '#f8fafc', marginBottom: '8px', fontSize: '24px', fontWeight: '700' }}>
            Pod.ai Dashboard
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '14px' }}>
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
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your.email@medicaps.ac.in"
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
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
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
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
                    color: '#94a3b8',
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
                background: isLoading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                color: '#f8fafc',
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

  return (
    <div style={{ 
      background: '#0f172a', 
      height: '100vh', 
      color: '#f8fafc', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Fixed Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: '#0f172a',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pod Dashboard
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Welcome back, {displayName}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleManualSync}
              disabled={isSyncing || attendanceLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#f8fafc',
                padding: '10px 20px',
                borderRadius: '12px',
                cursor: (isSyncing || attendanceLoading) ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease',
                opacity: (isSyncing || attendanceLoading) ? 0.7 : 1
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
        <div style={{
          display: 'flex',
          gap: '32px',
          maxWidth: '1200px',
          margin: '20px auto 0'
        }}>
          {['Attendance', 'Activities', 'Syllabus'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? '#a78bfa' : '#64748b',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: activeTab === tab ? '700' : '500',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '3px solid #a78bfa' : '3px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px 20px',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {syncSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              color: '#10b981',
              fontWeight: '600',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              ✨ Subjects synced successfully! Attendance imported from Pod.ai
            </div>
          )}

          {activeTab === 'Attendance' && (
            <div>
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  color: '#ef4444',
                  fontSize: '14px'
                }}>
                  Error: {error}
                </div>
              )}
              
              {attendanceLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  <div className="spinner" style={{ marginBottom: '16px' }}>⌛</div>
                  Fetching real attendance data from Pod.ai...
                </div>
              ) : classrooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  No classrooms found for your account.
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
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '20px',
                          padding: '24px',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#f8fafc', flex: 1 }}>
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
                          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0', fontWeight: '500' }}>
                            👨‍🏫 {classroom.creatorDetails.name}
                          </p>
                        )}
                        
                        {att.total === undefined ? (
                          <div style={{ color: '#64748b', fontSize: '13px' }}>Syncing data...</div>
                        ) : (
                          <>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '16px',
                              marginBottom: '20px'
                            }}>
                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Attended</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>{att.attended}</p>
                              </div>
                              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Total</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>{att.total}</p>
                              </div>
                            </div>

                            <div style={{
                              height: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '10px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(percentage, 100)}%`,
                                background: `linear-gradient(90deg, ${getAttendanceColor(percentage)} 0%, #f8fafc 200%)`,
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

          {activeTab === 'Activities' && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ color: '#f8fafc' }}>Activities Feature</h3>
              <p>Work in progress. This will show your assignments and tests from Pod.ai.</p>
            </div>
          )}

          {activeTab === 'Syllabus' && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📖</div>
              <h3 style={{ color: '#f8fafc' }}>Syllabus Explorer</h3>
              <p>Coming soon. Track your course progress directly from Pod.ai syllabus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
  );
}
