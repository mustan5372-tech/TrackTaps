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
    <div className="home-view">
      <section className="dashboard-hero">
        <div className="hero-welcome">
          <h2 id="hero-greeting">Good Afternoon,</h2>
          <p id="hero-subtitle">Ready to crush your goals today?</p>
          <div id="hero-date" style={{ marginTop: '16px', fontSize: '14px', color: '#a78bfa', fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="hero-overall-stats">
          <span className="overall-percentage" id="hero-overall-perc">{stats.overallPercentage}%</span>
          <span className="overall-label">Attendance Score</span>
          <div id="overall-trend" style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>↑ 2.4% from last week</div>
        </div>
      </section>

      <div className="quick-stats-row">
        <div className="stat-pill">
          <span className="stat-pill-value" id="stat-total-subjects">{stats.totalSubjects}</span>
          <span className="stat-pill-label">Total Subjects</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value" style={{ color: '#f59e0b' }} id="stat-streak">{stats.streak}</span>
          <span className="stat-pill-label">🔥 Day Streak</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value" style={{ color: '#10b981' }} id="stat-safe-subjects">{stats.safeSubjects}</span>
          <span className="stat-pill-label">Safe</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value" style={{ color: '#ef4444' }} id="stat-critical-subjects">{stats.criticalSubjects}</span>
          <span className="stat-pill-label">Critical</span>
        </div>
      </div>

      <div className="prediction-widgets-grid">
        <div className="prediction-card safe-to-skip">
          <div className="pred-header">
            <span className="pred-icon">✅</span>
            <span className="pred-title">Safe to Skip</span>
          </div>
          <div className="pred-value" id="pred-safe-skip">None</div>
          <div className="pred-desc">Subjects you can miss today</div>
        </div>
        <div className="prediction-card critical-risk">
          <div className="pred-header">
            <span className="pred-icon">⚠️</span>
            <span className="pred-title">Critical Risk</span>
          </div>
          <div className="pred-value" id="pred-critical-risk">None</div>
          <div className="pred-desc">Needs immediate attention</div>
        </div>
        <div className="prediction-card recovery-needed">
          <div className="pred-header">
            <span className="pred-icon">🩹</span>
            <span className="pred-title">Recovery Goal</span>
          </div>
          <div className="pred-value" id="pred-recovery-goal">None</div>
          <div className="pred-desc">Classes to reach target</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">Attendance Overview</span>
          </div>
          <div className="attendance-overview-content">
            <div className="progress-ring-container">
              <svg className="progress-ring-svg" width="100" height="100">
                <circle className="progress-ring-circle-bg" cx="50" cy="50" r="42"></circle>
                <circle id="progress-ring-bar" className="progress-ring-circle" cx="50" cy="50" r="42" strokeDasharray="263.89" strokeDashoffset="263.89"></circle>
              </svg>
              <span className="progress-percentage-text" id="overview-perc">{stats.overallPercentage}%</span>
            </div>
            <div className="mini-stats">
              <div className="mini-stat-item">
                <span className="mini-stat-label">Present</span>
                <span className="mini-stat-value" id="stat-present" style={{ color: '#10b981' }}>{stats.present}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label">Missed</span>
                <span className="mini-stat-value" id="stat-missed" style={{ color: '#ef4444' }}>{stats.missed}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label">Total</span>
                <span className="mini-stat-value" id="stat-total">{stats.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card ai-insights-card">
          <div className="card-header">
            <span className="card-title">AI Performance Insights</span>
            <span className="ai-badge-small">AI ACTIVE</span>
          </div>
          <div className="ai-insights-list" id="dashboard-ai-insights">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No insights yet. Add subjects to get started!</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">Today's Schedule</span>
            <span id="today-day-name" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
            </span>
          </div>
          <div className="schedule-list" id="dashboard-schedule-list">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No classes scheduled for today</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-title">Insights & Alerts</span>
          </div>
          <div className="insight-pills" id="dashboard-insight-pills">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No alerts at the moment</p>
          </div>
        </div>
      </div>

      <section className="shortcut-section">
        <h3 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '600' }}>Navigation Shortcuts</h3>
        <div className="shortcut-grid">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.path}
              to={shortcut.path}
              className="shortcut-card"
            >
              <span className="shortcut-icon">{shortcut.icon}</span>
              <div className="shortcut-info">
                <span className="shortcut-title">{shortcut.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="ai-import-promo" style={{ marginTop: '32px' }}>
        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '20px', color: '#f8fafc', marginBottom: '8px' }}>Quick Setup with AI</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Upload a screenshot of your subjects or timetable. Our AI will extract them automatically.</p>
            <button id="home-ai-import-btn" className="primary-btn" style={{ background: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
