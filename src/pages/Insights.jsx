import React from 'react';

function Insights() {
  return (
    <div className="insights-view">
      <header className="view-header">
        <h2>Attendance Insights</h2>
      </header>

      <section id="overall-summary-card" className="overview-card insight-summary">
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>
          <p>Add subjects and mark attendance to see insights</p>
        </div>
      </section>

      <section className="analytics-hub" style={{ marginTop: '32px' }}>
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <div className="dashboard-card analytics-card">
            <div className="card-header">
              <span className="card-title">📅 Consistency Heatmap</span>
              <span className="ai-badge-small">ACTIVITY</span>
            </div>
            <div id="heatmap-container" style={{ padding: '10px', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              No data available
            </div>
          </div>

          <div className="dashboard-card analytics-card">
            <div className="card-header">
              <span className="card-title">🕸️ Performance Balance</span>
            </div>
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              No data available
            </div>
          </div>
        </div>
      </section>

      <section className="achievements-section" style={{ marginTop: '48px' }}>
        <div className="card-header" style={{ marginBottom: '24px' }}>
          <h3 className="card-title">🏆 Academic Achievements</h3>
          <span id="achievement-count" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>0 / 6 Unlocked</span>
        </div>
        <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="achievement-card locked">
            <div className="ach-icon">🌱</div>
            <div className="ach-info">
              <div className="ach-title">Fresh Start</div>
              <div className="ach-desc">Mark your first attendance</div>
            </div>
          </div>
          <div className="achievement-card locked">
            <div className="ach-icon">🔥</div>
            <div className="ach-info">
              <div className="ach-title">3-Day Streak</div>
              <div className="ach-desc">Stay consistent for 3 days</div>
            </div>
          </div>
          <div className="achievement-card locked">
            <div className="ach-icon">⚡</div>
            <div className="ach-info">
              <div className="ach-title">Maths Master</div>
              <div className="ach-desc">100% attendance in Maths</div>
            </div>
          </div>
          <div className="achievement-card locked">
            <div className="ach-icon">🥇</div>
            <div className="ach-info">
              <div className="ach-title">Perfect Week</div>
              <div className="ach-desc">No misses for 7 full days</div>
            </div>
          </div>
          <div className="achievement-card locked">
            <div className="ach-icon">🧗</div>
            <div className="ach-info">
              <div className="ach-title">Great Comeback</div>
              <div className="ach-desc">Recover from critical state</div>
            </div>
          </div>
          <div className="achievement-card locked">
            <div className="ach-icon">🦉</div>
            <div className="ach-info">
              <div className="ach-title">Night Owl</div>
              <div className="ach-desc">Attend a late evening class</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Insights;
