import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function Insights() {
  const navigate = useNavigate();
  const {
    insights,
    subjects,
    dashboardStats,
    getSafeSubjects,
    getCriticalSubjects,
    getWarningSubjects,
    subscription,
    semesterStats,
    semesterSettings,
    attendanceSettings
  } = useAppStore();

  const [timeframe, setTimeframe] = useState('Semester');

  const isPremium = subscription.status === 'active';
  const safeSubjects = getSafeSubjects();
  const criticalSubjects = getCriticalSubjects();
  const warningSubjects = getWarningSubjects();

  const handleExport = () => {
    if (!isPremium) {
      alert("💎 Premium Required: PDF/JSON reports are a TrackTaps Plus feature.");
      navigate('/premium');
      return;
    }
    window.print(); // Simple PDF export via browser print
  };

  return (
    <div className="insights-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px' }}>
      <style>{`
        @media (max-width: 768px) {
          .insights-view {
            padding: 8px 0 120px 0 !important;
          }
          .view-header {
            padding: 24px 20px !important;
            background: var(--bg-primary) !important;
            border-bottom: 1px solid var(--border) !important;
            margin-bottom: 0px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .dashboard-card {
            margin: 0 16px !important;
          }
        }
      `}</style>
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Attendance Insights</h2>
            <button
              onClick={() => navigate('/guide')}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '800'
              }}
              title="How Insights work"
            >
              ?
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>{isPremium ? '💎 Premium Plus Analytics Active' : 'Basic Analytics'}</p>
        </div>
        <button 
          onClick={handleExport}
          style={{
            padding: '10px 20px',
            background: isPremium ? 'var(--primary-glow)' : 'var(--primary-glow)',
            border: `1px solid ${isPremium ? 'var(--primary-glow)' : 'var(--primary-glow)'}`,
            borderRadius: '10px',
            color: isPremium ? 'var(--success)' : 'var(--primary-light)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isPremium ? '📊 Export Report' : '💎 Unlock Reports'}
        </button>
      </header>

      {/* Overall Summary */}
      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>📊 Overall Performance</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary-light)', marginBottom: '4px' }}>
              {dashboardStats.overallPercentage}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Overall</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)', marginBottom: '4px' }}>
              {safeSubjects.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Safe</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--warning)', marginBottom: '4px' }}>
              {warningSubjects.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Warning</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--danger)', marginBottom: '4px' }}>
              {criticalSubjects.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Critical</div>
          </div>
        </div>
      </div>

      {/* ACADEMIC SAFETY CHECK - RETENTION PHASE 3 */}
      <div className="dashboard-card" style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚨 Academic Safety Check
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subjects.filter(s => {
            const stats = semesterStats[s.id];
            return stats && (stats.prediction.ifMissNext1 < stats.target || stats.prediction.ifMissNext2 < stats.target);
          }).length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>✅ All subjects have a safe buffer for at least 2 more bunks.</p>
          ) : subjects.map(subject => {
            const stats = semesterStats[subject.id];
            if (!stats) return null;
            
            const dropRisk1 = stats.prediction.ifMissNext1 < stats.target;
            const dropRisk2 = stats.prediction.ifMissNext2 < stats.target;
            
            if (!dropRisk1 && !dropRisk2) return null;

            return (
              <div key={subject.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{subject.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600', marginTop: '4px' }}>
                    {dropRisk1 ? '⚠️ RISK: Drop if next class missed' : '⚠️ RISK: Drop if 2 classes missed'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: stats.percentage >= stats.target ? 'var(--warning)' : 'var(--danger)' }}>
                    {stats.percentage}%
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '600' }}>CURRENT</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Semester Countdown */}
      <div className="dashboard-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', margin: 0 }}>📅 Semester Countdown</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Based on your academic calendar</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {Math.max(0, Math.ceil((new Date(semesterSettings.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} Days
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Till Semester End</div>
          </div>
        </div>
      </div>

      {/* Premium: Semester Attendance Strategy */}
      {isPremium ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card" 
          style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid var(--primary-glow)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '800', margin: 0 }}>🧠 Semester Attendance Strategy</h3>
            <span style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'white', padding: '4px 10px', borderRadius: '100px', fontWeight: '900' }}>PLUS AI</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {subjects.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>Add subjects to see your strategy.</p>
            ) : subjects.map(subject => {
              const stats = semesterStats[subject.id];
              if (!stats) return null;
              
              if (stats.totalPlanned === 0) {
                return (
                  <div key={subject.id} style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dim)' }}>{subject.name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚠️</span> No classes scheduled in timetable.
                    </div>
                  </div>
                );
              }

              return (
                <div key={subject.id} style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{subject.name}</span>
                    <span style={{ fontSize: '11px', color: stats.percentage >= (subject.criteria || attendanceSettings?.defaultTarget || 75) ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                      {stats.percentage}%
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>PLANNED</div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>{stats.totalPlanned}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>REMAINING</div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>{stats.remainingClasses}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{stats.bunkableNow > 0 ? 'BUNKABLE' : 'MUST ATTEND'}</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: stats.bunkableNow > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {stats.bunkableNow > 0 ? stats.bunkableNow : stats.mustAttend}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <div 
          onClick={() => navigate('/premium')}
          className="dashboard-card" 
          style={{ 
            padding: '32px', 
            textAlign: 'center', 
            cursor: 'pointer',
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px dashed var(--primary-glow)'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔒</div>
          <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Unlock Semester Intelligence</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px' }}>Get predictive bunking, required attendance counts, and full semester planning with TrackTaps Plus.</p>
          <span style={{ color: 'var(--primary-light)', fontSize: '13px', fontWeight: '600' }}>Upgrade to TrackTaps Plus →</span>
        </div>
      )}

      {/* Trends - Premium Only */}
      {isPremium && (
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', margin: 0 }}>📈 Attendance Trends</h3>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '8px' }}>
              {['Weekly', 'Monthly'].map(t => (
                <button
                  key={t}
                  onClick={() => timeframe !== t && setTimeframe(t)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: timeframe === t ? 'var(--primary)' : 'transparent',
                    color: timeframe === t ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0' }}>
            {(timeframe === 'Weekly' ? [65, 78, 82, 45, 90, 88, 75] : [72, 68, 75, 80]).map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  style={{ 
                    width: '100%', 
                    background: val > 75 ? 'var(--success)' : 'var(--warning)', 
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.6 + (val/200)
                  }} 
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{timeframe === 'Weekly' ? `W${i+1}` : `M${i+1}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights List */}
      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>🤖 Smart Alerts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.length > 0 ? insights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                background: insight.type === 'critical' ? 'var(--primary-glow)' : 'var(--primary-glow)',
                border: insight.type === 'critical' ? '1px solid var(--danger)' : '1px solid var(--primary-glow)',
                borderRadius: '8px',
                fontSize: '13px',
                color: insight.type === 'critical' ? 'var(--danger)' : 'var(--primary-light)'
              }}>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>{insight.icon} {insight.title}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{insight.message}</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No alerts found. Keep up the good work!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Insights;
