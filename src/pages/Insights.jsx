import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function Insights() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem('tracktaps_visited_insights', 'true');
    import('../services/analyticsService').then(m => m.default.trackFeatureUse('insights')).catch(() => {});
  }, []);
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
    attendanceSettings,
    calendarEvents,
    attendanceData,
    lastCloudSync
  } = useAppStore();

  const [timeframe, setTimeframe] = useState('Weekly');

  const isPremium = subscription.status === 'active';
  const safeSubjects = getSafeSubjects();
  const criticalSubjects = getCriticalSubjects();
  const warningSubjects = getWarningSubjects();

  // Dynamic Trends calculation based on real attendanceData
  const trendsData = React.useMemo(() => {
    let basePresent = 0;
    let baseTotal = 0;
    if (Array.isArray(subjects)) {
      subjects.forEach(s => {
        const p = parseFloat(s.initialPresent ?? s.present ?? 0);
        const t = parseFloat(s.initialTotal ?? s.total ?? 0);
        if (!isNaN(p)) basePresent += p;
        if (!isNaN(t)) baseTotal += t;
      });
    }

    const markedEvents = (calendarEvents || [])
      .filter(e => {
        const state = attendanceData[e.id]?.state;
        return state === 'present' || state === 'absent';
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (markedEvents.length === 0 && baseTotal === 0) {
      return timeframe === 'Weekly' 
        ? [65, 72, 70, 75, 78, 82, 80] 
        : [70, 75, 78, 80];
    }

    const dailyMarks = {};
    markedEvents.forEach(e => {
      const state = attendanceData[e.id]?.state;
      if (!dailyMarks[e.date]) {
        dailyMarks[e.date] = { present: 0, total: 0 };
      }
      if (state === 'present') {
        dailyMarks[e.date].present += 1;
      }
      dailyMarks[e.date].total += 1;
    });

    const sortedDates = Object.keys(dailyMarks).sort();
    
    const cumulativeHistory = [];
    let currentPresent = basePresent;
    let currentTotal = baseTotal;

    if (baseTotal > 0) {
      cumulativeHistory.push({
        date: '0000-00-00',
        percentage: Math.round((basePresent / baseTotal) * 100)
      });
    }

    sortedDates.forEach(date => {
      currentPresent += dailyMarks[date].present;
      currentTotal += dailyMarks[date].total;
      cumulativeHistory.push({
        date,
        percentage: Math.round((currentPresent / currentTotal) * 100)
      });
    });

    const getPercentageForDate = (targetDateStr) => {
      let latestPercentage = baseTotal > 0 ? Math.round((basePresent / baseTotal) * 100) : 0;
      for (const record of cumulativeHistory) {
        if (record.date <= targetDateStr) {
          latestPercentage = record.percentage;
        } else {
          break;
        }
      }
      return latestPercentage;
    };

    const today = new Date();
    
    if (timeframe === 'Weekly') {
      const points = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - (i * 7));
        const dateStr = d.toISOString().split('T')[0];
        points.push(getPercentageForDate(dateStr));
      }
      return points;
    } else {
      const points = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        const dateStr = d.toISOString().split('T')[0];
        points.push(getPercentageForDate(dateStr));
      }
      return points;
    }
  }, [subjects, calendarEvents, attendanceData, timeframe]);

  const badges = React.useMemo(() => {
    const streak = dashboardStats.attendanceStreak || 0;
    const overall = dashboardStats.overallPercentage || 0;
    const totalMarks = Object.keys(attendanceData || {}).length;
    const hasSync = !!lastCloudSync;

    return [
      {
        id: 'streak',
        title: 'Streak Master',
        icon: '🔥',
        desc: 'Unlock by logging consecutive attendances.',
        levels: [
          { name: 'Bronze', req: 2, current: streak, achieved: streak >= 2 },
          { name: 'Silver', req: 5, current: streak, achieved: streak >= 5 },
          { name: 'Gold', req: 10, current: streak, achieved: streak >= 10 }
        ]
      },
      {
        id: 'academic',
        title: 'Academic Rank',
        icon: '🎓',
        desc: 'Keep overall class attendance high.',
        levels: [
          { name: 'Bronze (75%)', req: 75, current: overall, achieved: overall >= 75 },
          { name: 'Silver (80%)', req: 80, current: overall, achieved: overall >= 80 },
          { name: 'Gold (90%)', req: 90, current: overall, achieved: overall >= 90 }
        ]
      },
      {
        id: 'tracker',
        title: 'Attendance Titan',
        icon: '📊',
        desc: 'Mark attendance sessions in the calendar.',
        levels: [
          { name: 'Bronze (10)', req: 10, current: totalMarks, achieved: totalMarks >= 10 },
          { name: 'Silver (25)', req: 25, current: totalMarks, achieved: totalMarks >= 25 },
          { name: 'Gold (50)', req: 50, current: totalMarks, achieved: totalMarks >= 50 }
        ]
      },
      {
        id: 'cloud',
        title: 'Cloud Pioneer',
        icon: '☁️',
        desc: 'Establish database sync backups.',
        levels: [
          { name: 'Gold Sync', req: 1, current: hasSync ? 1 : 0, achieved: hasSync }
        ]
      }
    ];
  }, [dashboardStats, attendanceData, lastCloudSync]);

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
            {trendsData.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, val)}%` }}
                    style={{ 
                      width: '100%', 
                      background: val >= 75 ? 'var(--success)' : val >= 65 ? 'var(--warning)' : 'var(--danger)', 
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.6 + (val/200)
                    }} 
                  />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {timeframe === 'Weekly' 
                    ? (i === 6 ? 'Now' : `W-${6-i}`) 
                    : (i === 3 ? 'Now' : `M-${3-i}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏆 Academic Achievements & Badges Section */}
      <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', margin: 0 }}>🏆 Academic Achievements</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Log attendance & unlock milestone badges</p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '800', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '8px' }}>
            {badges.reduce((acc, b) => acc + b.levels.filter(l => l.achieved).length, 0)} / {badges.reduce((acc, b) => acc + b.levels.length, 0)} Completed
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {badges.map((badge) => (
            <div 
              key={badge.id}
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                fontSize: '28px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {badge.icon}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{badge.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>{badge.desc}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {badge.levels.map((lvl, index) => {
                    const isLockedByPremium = !isPremium && (lvl.name.includes('Silver') || lvl.name.includes('Gold'));
                    return (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: lvl.achieved && !isLockedByPremium ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${lvl.achieved && !isLockedByPremium ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`,
                          opacity: isLockedByPremium ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: lvl.achieved && !isLockedByPremium ? 'var(--success)' : 'var(--text-dim)', fontWeight: '800' }}>
                            {lvl.achieved && !isLockedByPremium ? '✓' : '○'}
                          </span>
                          <span style={{ fontSize: '12px', color: lvl.achieved && !isLockedByPremium ? 'var(--text-main)' : 'var(--text-dim)', fontWeight: '600' }}>
                            {lvl.name}
                          </span>
                        </div>

                        {isLockedByPremium ? (
                          <span 
                            onClick={() => navigate('/premium')}
                            style={{ fontSize: '9px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', cursor: 'pointer' }}
                          >
                            💎 LOCK
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {lvl.achieved ? 'Unlocked' : `${lvl.current}/${lvl.req}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
