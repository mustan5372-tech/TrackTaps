import React from 'react';
import useAppStore from '../store/appStore';

function Insights() {
  // Get data from Zustand store
  const {
    insights,
    subjects,
    dashboardStats,
    getSafeSubjects,
    getCriticalSubjects,
    getWarningSubjects
  } = useAppStore();

  const safeSubjects = getSafeSubjects();
  const criticalSubjects = getCriticalSubjects();
  const warningSubjects = getWarningSubjects();

  return (
    <div className="insights-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc' }}>Attendance Insights</h2>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{insights.length} insights</span>
      </header>

      {/* Overall Summary */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>📊 Overall Performance</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#a78bfa', marginBottom: '4px' }}>
              {dashboardStats.overallPercentage}%
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Overall Attendance</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginBottom: '4px' }}>
              {safeSubjects.length}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Safe Subjects</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', marginBottom: '4px' }}>
              {warningSubjects.length}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Warning</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', marginBottom: '4px' }}>
              {criticalSubjects.length}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Critical</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#f8fafc', marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>🤖 AI Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  background: insight.type === 'critical' ? 'rgba(239, 68, 68, 0.1)' : insight.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: insight.type === 'critical' ? '1px solid rgba(239, 68, 68, 0.2)' : insight.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: insight.type === 'critical' ? '#fca5a5' : insight.type === 'warning' ? '#fcd34d' : '#86efac'
                }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{insight.icon} {insight.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{insight.message}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '48px 32px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          borderRadius: '16px',
          color: '#94a3b8'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No insights yet</p>
          <p style={{ fontSize: '13px' }}>Add subjects and mark attendance to generate insights</p>
        </div>
      )}

      {/* Subject Breakdown */}
      {subjects.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#f8fafc', marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>📚 Subject Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  padding: '12px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: '600', marginBottom: '4px' }}>{subject.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Target: {subject.criteria}%</div>
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: subject.attendance >= subject.criteria ? '#10b981' : subject.attendance >= subject.criteria - 10 ? '#f59e0b' : '#ef4444'
                }}>
                  {subject.attendance}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Insights;
