import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [stats, setStats] = useState({
    totalSubjects: 0,
    streak: 0,
    safeSubjects: 0,
    criticalSubjects: 0,
    overallPercentage: 0,
    present: 0,
    missed: 0,
    total: 0
  });

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = JSON.parse(localStorage.getItem('attendanceStats') || '{}');
    setStats(prev => ({ ...prev, ...savedStats }));
  }, []);

  const shortcuts = [
    { icon: '📅', title: 'Calendar', path: '/calendar' },
    { icon: '🕒', title: 'Timetable', path: '/timetable' },
    { icon: '📚', title: 'Subjects', path: '/subjects' },
    { icon: '💡', title: 'Insights', path: '/insights' },
  ];

  return (
    <div className="home-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Section */}
      <section className="dashboard-hero" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '20px',
        padding: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '40px'
      }}>
        <div className="hero-welcome">
          <h2 id="hero-greeting" style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>Good Afternoon,</h2>
          <p id="hero-subtitle" style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '16px' }}>Ready to crush your goals today?</p>
          <div id="hero-date" style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="hero-overall-stats" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          minWidth: '200px'
        }}>
          <span className="overall-percentage" id="hero-overall-perc" style={{ fontSize: '48px', fontWeight: '800', color: '#a78bfa', display: 'block' }}>{stats.overallPercentage}%</span>
          <span className="overall-label" style={{ fontSize: '14px', color: '#94a3b8', display: 'block', marginTop: '8px' }}>Attendance Score</span>
          <div id="overall-trend" style={{ marginTop: '12px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↑ 2.4% from last week</div>
        </div>
      </section>

      {/* Quick Stats Row */}
      <div className="quick-stats-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="stat-pill" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span className="stat-pill-value" id="stat-total-subjects" style={{ fontSize: '28px', fontWeight: '800', color: '#a78bfa', display: 'block' }}>{stats.totalSubjects}</span>
          <span className="stat-pill-label" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>Total Subjects</span>
        </div>
        <div className="stat-pill" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span className="stat-pill-value" id="stat-streak" style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', display: 'block' }}>{stats.streak}</span>
          <span className="stat-pill-label" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>🔥 Day Streak</span>
        </div>
        <div className="stat-pill" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span className="stat-pill-value" id="stat-safe-subjects" style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', display: 'block' }}>{stats.safeSubjects}</span>
          <span className="stat-pill-label" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>Safe</span>
        </div>
        <div className="stat-pill" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <span className="stat-pill-value" id="stat-critical-subjects" style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', display: 'block' }}>{stats.criticalSubjects}</span>
          <span className="stat-pill-label" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>Critical</span>
        </div>
      </div>

      {/* Prediction Widgets */}
      <div className="prediction-widgets-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div className="prediction-card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '24px' }}>✅</span>
            <span className="pred-title" style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Safe to Skip</span>
          </div>
          <div className="pred-value" id="pred-safe-skip" style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>None</div>
          <div className="pred-desc" style={{ fontSize: '12px', color: '#94a3b8' }}>Subjects you can miss today</div>
        </div>
        <div className="prediction-card" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '24px' }}>⚠️</span>
            <span className="pred-title" style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>Critical Risk</span>
          </div>
          <div className="pred-value" id="pred-critical-risk" style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>None</div>
          <div className="pred-desc" style={{ fontSize: '12px', color: '#94a3b8' }}>Needs immediate attention</div>
        </div>
        <div className="prediction-card" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '24px' }}>🩹</span>
            <span className="pred-title" style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>Recovery Goal</span>
          </div>
          <div className="pred-value" id="pred-recovery-goal" style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>None</div>
          <div className="pred-desc" style={{ fontSize: '12px', color: '#94a3b8' }}>Classes to reach target</div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <div className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '24px' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Attendance Overview</span>
          </div>
          <div className="attendance-overview-content" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div className="progress-ring-container" style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg className="progress-ring-svg" width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle className="progress-ring-circle-bg" cx="50" cy="50" r="42" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="4"></circle>
                <circle id="progress-ring-bar" className="progress-ring-circle" cx="50" cy="50" r="42" fill="none" stroke="url(#gradient)" strokeWidth="4" strokeDasharray="263.89" strokeDashoffset="263.89"></circle>
              </svg>
              <span className="progress-percentage-text" id="overview-perc" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#a78bfa' }}>{stats.overallPercentage}%</span>
            </div>
            <div className="mini-stats" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Present</span>
                <span className="mini-stat-value" id="stat-present" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{stats.present}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Missed</span>
                <span className="mini-stat-value" id="stat-missed" style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{stats.missed}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Total</span>
                <span className="mini-stat-value" id="stat-total" style={{ fontSize: '20px', fontWeight: '800', color: '#a78bfa' }}>{stats.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>AI Performance Insights</span>
            <span className="ai-badge-small" style={{ fontSize: '10px', fontWeight: '700', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.2)', padding: '4px 12px', borderRadius: '8px' }}>AI ACTIVE</span>
          </div>
          <div className="ai-insights-list" id="dashboard-ai-insights">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No insights yet. Add subjects to get started!</p>
          </div>
        </div>

        <div className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Today's Schedule</span>
            <span id="today-day-name" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
            </span>
          </div>
          <div className="schedule-list" id="dashboard-schedule-list">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No classes scheduled for today</p>
          </div>
        </div>

        <div className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Insights & Alerts</span>
          </div>
          <div className="insight-pills" id="dashboard-insight-pills">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No alerts at the moment</p>
          </div>
        </div>
      </div>

      {/* Shortcuts Section */}
      <section className="shortcut-section">
        <h3 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '600' }}>Navigation Shortcuts</h3>
        <div className="shortcut-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.path}
              to={shortcut.path}
              className="shortcut-card"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span className="shortcut-icon" style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>{shortcut.icon}</span>
              <div className="shortcut-info">
                <span className="shortcut-title" style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>{shortcut.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Import Promo */}
      <section className="ai-import-promo" style={{ marginTop: '32px' }}>
        <div className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '20px', color: '#f8fafc', marginBottom: '8px', fontWeight: '700' }}>Quick Setup with AI</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>Upload a screenshot of your subjects or timetable. Our AI will extract them automatically.</p>
            <button id="home-ai-import-btn" className="primary-btn" style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
              color: '#f8fafc',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}>
              <span>📸</span> Import from Screenshot
            </button>
          </div>
          <div className="ai-promo-icon" style={{ fontSize: '64px', opacity: 0.8, filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))' }}>🤖</div>
        </div>
      </section>
    </div>
  );
}

export default Home;
