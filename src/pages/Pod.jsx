import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      
      // Fetch attendance for each classroom individually
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
    } catch (err) {
      console.error('Error in fetchAttendance:', err);
      setError(err.message);
    } finally {
      setAttendanceLoading(false);
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
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        maxWidth: '1200px',
        margin: '0 auto 32px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Pod Dashboard</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Welcome, {displayName}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px',
        maxWidth: '1200px',
        margin: '0 auto 24px'
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
              fontSize: '16px',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #a78bfa' : 'none',
              marginBottom: '-1px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'Attendance' && (
          <div>
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
                Error: {error}
              </div>
            )}
            {attendanceLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Loading attendance data...
              </div>
            ) : classrooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No classrooms found
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {classrooms.map((classroom) => {
                  const att = attendanceData[classroom.token] || {};
                  const percentage = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;
                  
                  return (
                    <div
                      key={classroom.token}
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '12px',
                        padding: '20px'
                      }}
                    >
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                        {classroom.title}
                      </h3>
                      {classroom.creatorDetails?.name && (
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                          {classroom.creatorDetails.name}
                        </p>
                      )}
                      
                      {att.total === undefined ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading...</p>
                      ) : (
                        <>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '16px'
                          }}>
                            <div>
                              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Attendance</p>
                              <p style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                margin: 0,
                                color: getAttendanceColor(percentage)
                              }}>
                                {percentage}%
                              </p>
                            </div>
                            <div>
                              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Classes</p>
                              <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                                {att.attended}/{att.total}
                              </p>
                            </div>
                          </div>

                          <div style={{
                            height: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(percentage, 100)}%`,
                              background: getAttendanceColor(percentage),
                              transition: 'width 0.3s'
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Activities feature coming soon...
          </div>
        )}

        {activeTab === 'Syllabus' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Syllabus feature coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
