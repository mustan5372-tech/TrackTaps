import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

function BunkCalculator() {
  const navigate = useNavigate();
  const { 
    subjects, 
    semesterStats, 
    subscription, 
    fullSync,
    attendanceSettings,
    calendarEvents,
    semesterSettings
  } = useAppStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [simulatedBunks, setSimulatedBunks] = useState(2);
  const [customSkips, setCustomSkips] = useState({});

  // Exam-Prep AI Skip Planner States & Calculations
  const [examTargetType, setExamTargetType] = useState('endterm');
  const [customExamDate, setCustomExamDate] = useState(() => {
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    return twoWeeks.toISOString().split('T')[0];
  });

  const examPrepOptimizer = React.useMemo(() => {
    let resolvedDateStr = customExamDate;
    const examsList = semesterSettings?.examPeriods || [];
    
    if (examTargetType === 'midterm') {
      const mid = examsList.find(e => e.name?.toLowerCase().includes('mid') || e.name?.toLowerCase().includes('half'));
      if (mid) resolvedDateStr = mid.startDate;
      else {
        const oneWeek = new Date();
        oneWeek.setDate(oneWeek.getDate() + 7);
        resolvedDateStr = oneWeek.toISOString().split('T')[0];
      }
    } else if (examTargetType === 'endterm') {
      const end = examsList.find(e => e.name?.toLowerCase().includes('end') || e.name?.toLowerCase().includes('final'));
      if (end) resolvedDateStr = end.startDate;
      else {
        const twoWeeks = new Date();
        twoWeeks.setDate(twoWeeks.getDate() + 14);
        resolvedDateStr = twoWeeks.toISOString().split('T')[0];
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    const subjectsPlan = (subjects || []).map(subject => {
      const stats = semesterStats?.[subject.id];
      const conducted = Number(stats?.total) || 0;
      const present = Number(stats?.present) || 0;
      const targetPct = subject.criteria || attendanceSettings?.defaultTarget || 75;

      let upcomingBeforeExam = (calendarEvents || [])
        .filter(e => e.subjectName === subject.name && e.date >= todayStr && e.date < resolvedDateStr)
        .sort((a, b) => a.date.localeCompare(b.date));

      // FALLBACK: Generate realistic mock sessions if none are found in calendarEvents
      if (upcomingBeforeExam.length === 0) {
        const today = new Date(todayStr);
        const examDate = new Date(resolvedDateStr);
        const diffTime = Math.abs(examDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let offset = 1;
        while (offset <= diffDays) {
          const mockDate = new Date(today);
          mockDate.setDate(mockDate.getDate() + offset);
          const dayOfWeek = mockDate.getDay();
          
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Assume classes run every 2 days
            if (offset % 2 === 1) {
              upcomingBeforeExam.push({
                id: `mock_exam_${subject.id}_${offset}`,
                subjectName: subject.name,
                date: mockDate.toISOString().split('T')[0],
                isSimulated: true
              });
            }
          }
          offset++;
        }
      }

      const N = upcomingBeforeExam.length;
      const targetRatio = targetPct / 100;
      const mustAttendBeforeExam = Math.max(0, Math.ceil(targetRatio * (conducted + N) - present));
      const safeBunksBeforeExam = Math.max(0, N - mustAttendBeforeExam);
      const reclaimedHours = (safeBunksBeforeExam * 1.5).toFixed(1);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        criteria: targetPct,
        currentPct: stats?.percentage || 0,
        upcomingClassesCount: N,
        upcomingClasses: upcomingBeforeExam,
        safeSkips: safeBunksBeforeExam,
        reclaimedHours: parseFloat(reclaimedHours),
        mustAttend: mustAttendBeforeExam
      };
    });

    const totalHoursReclaimed = subjectsPlan.reduce((sum, s) => sum + s.reclaimedHours, 0);
    const totalSkipsPossible = subjectsPlan.reduce((sum, s) => sum + s.safeSkips, 0);

    return {
      resolvedDate: resolvedDateStr,
      subjectsPlan,
      totalHoursReclaimed,
      totalSkipsPossible
    };
  }, [subjects, semesterStats, calendarEvents, semesterSettings, attendanceSettings, examTargetType, customExamDate]);

  useEffect(() => {
    setCustomSkips({});
  }, [selectedSubjectId]);

  useEffect(() => {
    fullSync();
    setIsPremium(subscription?.status === 'active');
    localStorage.setItem('tracktaps_visited_bunk_calc', 'true');
    import('../services/analyticsService').then(m => m.default.trackFeatureUse('bunkCalc')).catch(() => {});
  }, [fullSync, subscription]);

  // Handle auto-selection if passed via state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subId = params.get('subjectId');
    if (subId) {
      setSelectedSubjectId(subId);
    } else if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects]);

  const selectedStats = semesterStats?.[selectedSubjectId];
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Future Bunk Predictor Simulation Math
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSubjectEvents = (calendarEvents || [])
    .filter(e => e.subjectName === selectedSubject?.name && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const simulatedClasses = [];
  for (let i = 0; i < simulatedBunks; i++) {
    const event = upcomingSubjectEvents[i];
    if (event) {
      const holiday = semesterSettings?.holidays?.find(h => h.date === event.date);
      simulatedClasses.push({
        index: i + 1,
        date: event.date,
        holidayName: holiday ? holiday.name : null,
        holidayType: holiday ? holiday.type : null,
      });
    } else {
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + (i + 1) * 2);
      const estDateStr = estimatedDate.toISOString().split('T')[0];
      const holiday = semesterSettings?.holidays?.find(h => h.date === estDateStr);
      simulatedClasses.push({
        index: i + 1,
        date: estDateStr,
        holidayName: holiday ? holiday.name : null,
        holidayType: holiday ? holiday.type : null,
        isEstimated: true
      });
    }
  }

  const actualSimulatedBunks = simulatedClasses.filter(c => !c.holidayName).length;
  const simulatedTotal = (selectedStats?.total || 0) + actualSimulatedBunks;
  const simulatedPresent = selectedStats?.present || 0;
  const simulatedPercentage = simulatedTotal > 0 
    ? Math.round((simulatedPresent / simulatedTotal) * 100) 
    : 0;
  const targetPct = selectedSubject?.criteria || attendanceSettings?.defaultTarget || 75;
  const isSimulatedSafe = simulatedPercentage >= targetPct;

  const getStatusColor = (percentage) => {
    if (percentage >= (attendanceSettings?.defaultTarget || 75)) return 'var(--success)';
    if (percentage >= 65) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      className="bunk-calculator-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <style>{`
        .bunk-calculator-view {
            padding-bottom: 120px !important;
        }
        @media (max-width: 768px) {
          .bunk-calculator-view {
            padding: 8px 0 !important;
          }
          .bunk-calculator-header {
            padding: 24px 20px !important;
            background: var(--bg-primary) !important;
            border-bottom: 1px solid var(--border) !important;
            margin-bottom: 0px !important;
          }
          .calculator-card {
            margin: 0 16px !important;
            padding: 24px !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        .premium-lock-overlay {
          position: absolute;
          inset: 0;
          background: 'var(--bg-primary)';
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: 24px;
          text-align: center;
          padding: 24px;
        }
        .calculator-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 32px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(24px) saturate(180%);
          WebkitBackdropFilter: blur(24px) saturate(180%);
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
      `}</style>
      <header className="bunk-calculator-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Bunk Calculator</h2>
            <button
              onClick={() => navigate('/guide')}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '800'
              }}
              title="How Bunk Calculator works"
            >
              ?
            </button>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>Precision attendance planning.</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ 
            background: 'rgba(139, 92, 246, 0.12)', 
            padding: '8px 16px', 
            borderRadius: '100px', 
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary-light)', letterSpacing: '0.05em' }}>AI ENGINE</span>
        </motion.div>
      </header>

      <div className="calculator-card">
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '13px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Subject
          </label>
          <div style={{ position: 'relative' }}>
            <select 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '100px',
                padding: '16px 24px',
                color: 'var(--text-main)',
                fontSize: '16px',
                fontWeight: '700',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-light)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.name}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }}>
              ▼
            </div>
          </div>
        </div>

        {!isPremium && (
          <div className="premium-lock-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '40px 24px', borderRadius: '32px', border: '1px solid var(--primary-glow)', backdropFilter: 'blur(10px)' }}
            >
              <div style={{ fontSize: '56px', marginBottom: '20px' }}>💎</div>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.5px' }}>Unlock Smart Bunking</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '320px', marginBottom: '32px', lineHeight: 1.6 }}>
                Upgrade to TrackTaps Plus to unlock real-time bunk predictions, safe-to-skip counts, and semester trajectories.
              </p>
              <button 
                onClick={() => navigate('/premium')}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 40px',
                  borderRadius: '16px',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px var(--primary-glow)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get Premium Access →
              </button>
            </motion.div>
          </div>
        )}

        {!selectedSubjectId && subjects.length > 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Please select a subject to calculate bunk stats.
          </div>
        )}

        {subjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No subjects found. Please add subjects in the Subjects tab first.
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedStats && selectedSubject && (
            <motion.div
              key={selectedSubjectId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.1em' }}>Current Attendance</div>
                  <div style={{ fontSize: '36px', fontWeight: '950', color: getStatusColor(selectedStats?.percentage || 0), letterSpacing: '-1px' }}>
                    <span className={
                      (selectedStats?.percentage || 0) >= (attendanceSettings?.defaultTarget || 75) ? 'attendance-gradient-green' : 
                      (selectedStats?.percentage || 0) >= 65 ? 'attendance-gradient-orange' : 'attendance-gradient-red'
                    }>
                      {selectedStats?.percentage || 0}%
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px', fontWeight: '600' }}>
                    <span style={{ color: 'var(--text-main)' }}>{selectedStats?.present || 0}</span> of {selectedStats?.total || 0} classes
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  background: (selectedStats?.bunkableNow || 0) > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                  borderRadius: '24px', 
                  border: `1px solid ${(selectedStats?.bunkableNow || 0) > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.1em' }}>Safe to Bunk</div>
                  <div style={{ fontSize: '36px', fontWeight: '950', color: (selectedStats?.bunkableNow || 0) > 0 ? 'var(--success)' : 'var(--danger)', letterSpacing: '-1px' }}>
                    <span className={(selectedStats?.bunkableNow || 0) > 0 ? 'attendance-gradient-green' : 'attendance-gradient-red'}>
                      {selectedStats?.bunkableNow || 0}
                    </span>{' '}
                    <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0', color: 'var(--text-dim)' }}>Classes</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px', fontWeight: '600' }}>Until you hit {selectedSubject?.criteria || attendanceSettings?.defaultTarget || 75}%</div>
                </div>
              </div>

              {/* Safety Window Insight */}
              {(selectedStats?.bunkableNow || 0) > 0 && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  style={{ 
                    background: 'rgba(139, 92, 246, 0.08)', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    border: '1px solid rgba(139, 92, 246, 0.2)', 
                    marginBottom: '32px',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '40px', opacity: 0.1 }}>🗓️</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🛡️</span>
                    <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-light)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Your Safety Window</h4>
                  </div>
                  <p style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0, lineHeight: 1.4, fontWeight: '700' }}>
                    You are <span style={{ color: 'var(--success)', fontWeight: '900' }}>Safe to Bunk</span> until {
                      (() => {
                        try {
                          const today = new Date().toISOString().split('T')[0];
                          const subjectEvents = (calendarEvents || []).filter(e => 
                            e.subjectName === selectedSubject?.name && e.date >= today
                          );
                          const targetEvent = subjectEvents[(selectedStats?.bunkableNow || 1) - 1];
                          return targetEvent 
                            ? new Date(targetEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                            : 'the end of semester';
                        } catch (e) { return 'the end of semester'; }
                      })()
                    }
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                    Next {selectedStats?.bunkableNow || 0} classes of {selectedSubject?.name || 'this subject'} are buffer classes.
                  </div>
                </motion.div>
              )}

              {/* Recovery Insight Block */}
              {(selectedStats?.percentage || 0) < (selectedSubject?.criteria || attendanceSettings?.defaultTarget || 75) && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ 
                    background: 'rgba(245, 158, 11, 0.08)', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    border: '1px solid rgba(245, 158, 11, 0.2)', 
                    marginBottom: '32px',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🎯</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--warning)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recovery Roadmap</h4>
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0, lineHeight: 1.5, fontWeight: '600' }}>
                    Attend <span style={{ color: 'var(--warning)', fontSize: '18px', fontWeight: '900' }}>{selectedStats?.mustAttend || 0} consecutive classes</span> to reach {selectedSubject?.criteria || attendanceSettings?.defaultTarget || 75}%.
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Target Completion: {new Date(new Date().setDate(new Date().getDate() + ((selectedStats?.mustAttend || 1) * 1.5))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </motion.div>
              )}

              <div style={{ background: 'rgba(139, 92, 246, 0.08)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '32px', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '60px', opacity: 0.05 }}>📊</div>
                <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-light)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                   <span>⚡</span> AI Prediction Insights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                      <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '600' }}>If you miss next class:</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: getStatusColor(selectedStats?.prediction?.ifMissNext1 || 0) }}>{selectedStats?.prediction?.ifMissNext1 || 0}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
                      <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '600' }}>If you attend next class:</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: getStatusColor(selectedStats?.prediction?.ifAttendNext1 || 0) }}>{selectedStats?.prediction?.ifAttendNext1 || 0}%</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>Semester Target Goal:</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-light)', padding: '4px 10px', background: 'var(--primary-glow)', borderRadius: '8px' }}>{selectedSubject?.criteria || attendanceSettings?.defaultTarget || 75}%</span>
                  </div>
                </div>
              </div>

              {/* Interactive Bunk Slider & Trajectory Timeline */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.06)', 
                borderRadius: '24px', 
                padding: '28px', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                marginBottom: '32px', 
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '60px', opacity: 0.05 }}>🔮</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '22px' }}>🔮</span>
                  <h4 style={{ fontSize: '14px', fontWeight: '900', color: '#818cf8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Interactive Bunk Timeline Simulator
                  </h4>
                  <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>TRAJECTORY PROJECTION</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                  Drag the slider below to simulate skipping the next classes and project your attendance trajectory day-by-day.
                </p>

                {/* Slider Input */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '14px', fontWeight: '800', marginBottom: '10px' }}>
                    <span>Simulated Skips (Bunks):</span>
                    <span style={{ color: simulatedBunks > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {simulatedBunks} {simulatedBunks === 1 ? 'Class' : 'Classes'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={simulatedBunks}
                    onChange={(e) => setSimulatedBunks(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#818cf8',
                      cursor: 'pointer',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255,255,255,0.1)'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>0 skips (All Attended)</span>
                    <span>10 skips</span>
                  </div>
                </div>

                 {/* Horizontal Timeline Track */}
                <div style={{ overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '16px', minWidth: '600px', padding: '4px' }}>
                    {(() => {
                      let upcoming10 = (calendarEvents || [])
                        .filter(e => e.subjectName === selectedSubject?.name && e.date >= todayStr)
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .slice(0, 10);

                      // FALLBACK: Generate 10 mock classes if none exist in calendarEvents
                      if (upcoming10.length === 0 && selectedSubject) {
                        const today = new Date(todayStr);
                        let added = 0;
                        let offset = 1;
                        while (added < 10 && offset < 40) {
                          const mockDate = new Date(today);
                          mockDate.setDate(mockDate.getDate() + offset);
                          const dayOfWeek = mockDate.getDay();
                          // Only Monday-Friday classes
                          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                            if (offset % 2 === 1) {
                              upcoming10.push({
                                id: `mock_calc_${selectedSubject.id}_${offset}`,
                                subjectName: selectedSubject.name,
                                date: mockDate.toISOString().split('T')[0],
                                isSimulated: true
                              });
                              added++;
                            }
                          }
                          offset++;
                        }
                      }

                      if (upcoming10.length === 0) {
                        return (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', width: '100%' }}>
                            No upcoming sessions scheduled in this semester.
                          </div>
                        );
                      }

                      // Compute cumulative trajectory
                      const conducted = Number(selectedStats?.total) || 0;
                      const present = Number(selectedStats?.present) || 0;
                      let cumulativeTotal = conducted;
                      let cumulativePresent = present;

                      return upcoming10.map((cls, idx) => {
                        const holiday = semesterSettings?.holidays?.find(h => h.date === cls.date);
                        const isSkipped = !holiday && idx < simulatedBunks;
                        
                        if (!holiday) {
                          cumulativeTotal += 1;
                          if (!isSkipped) {
                            cumulativePresent += 1;
                          }
                        }

                        const currentPct = cumulativeTotal > 0 ? Math.round((cumulativePresent / cumulativeTotal) * 100) : 0;
                        const isPctSafe = currentPct >= targetPct;

                        return (
                          <div 
                            key={cls.id}
                            style={{
                              flex: '1',
                              minWidth: '110px',
                              background: isSkipped ? 'rgba(239, 68, 68, 0.08)' : holiday ? 'rgba(139, 92, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                              border: `1px solid ${isSkipped ? 'rgba(239, 68, 68, 0.25)' : holiday ? 'rgba(139, 92, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                              borderRadius: '16px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              alignItems: 'center',
                              textAlign: 'center',
                              position: 'relative'
                            }}
                          >
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
                              SESSION {idx + 1}
                            </span>
                            
                            {/* Date Badge */}
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'white' }}>
                              {new Date(cls.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            
                            {/* Action Icon / Status */}
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: isSkipped ? 'rgba(239, 68, 68, 0.2)' : holiday ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: isSkipped ? 'var(--danger)' : holiday ? 'var(--primary-light)' : 'var(--success)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '950',
                              margin: '4px 0'
                            }}>
                              {holiday ? '🎉' : isSkipped ? '✗' : '✓'}
                            </div>

                            <span style={{ fontSize: '9px', fontWeight: '800', color: isSkipped ? '#fca5a5' : holiday ? '#c084fc' : '#6ee7b7' }}>
                              {holiday ? 'HOLIDAY' : isSkipped ? 'SIM SKIPPED' : 'ATTENDING'}
                            </span>

                            {/* Live Projection Percentage */}
                            <div style={{
                              marginTop: '8px',
                              padding: '2px 8px',
                              borderRadius: '100px',
                              background: isPctSafe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isPctSafe ? 'var(--success)' : 'var(--danger)',
                              fontSize: '11px',
                              fontWeight: '900'
                            }}>
                              {currentPct}%
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Live Final Projection Summary Card */}
                {(() => {
                  let upcoming10 = (calendarEvents || [])
                    .filter(e => e.subjectName === selectedSubject?.name && e.date >= todayStr)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 10);

                  // FALLBACK: Generate 10 mock classes if none exist in calendarEvents
                  if (upcoming10.length === 0 && selectedSubject) {
                    const today = new Date(todayStr);
                    let added = 0;
                    let offset = 1;
                    while (added < 10 && offset < 40) {
                      const mockDate = new Date(today);
                      mockDate.setDate(mockDate.getDate() + offset);
                      const dayOfWeek = mockDate.getDay();
                      // Only Monday-Friday classes
                      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                        if (offset % 2 === 1) {
                          upcoming10.push({
                            id: `mock_calc_${selectedSubject.id}_${offset}`,
                            subjectName: selectedSubject.name,
                            date: mockDate.toISOString().split('T')[0],
                            isSimulated: true
                          });
                          added++;
                        }
                      }
                      offset++;
                    }
                  }

                  const conducted = Number(selectedStats?.total) || 0;
                  const present = Number(selectedStats?.present) || 0;
                  let finalTotal = conducted;
                  let finalPresent = present;

                  upcoming10.forEach((cls, idx) => {
                    const holiday = semesterSettings?.holidays?.find(h => h.date === cls.date);
                    if (!holiday) {
                      finalTotal += 1;
                      if (idx < simulatedBunks) {
                        // skipped
                      } else {
                        finalPresent += 1;
                      }
                    }
                  });

                  const finalPct = finalTotal > 0 ? Math.round((finalPresent / finalTotal) * 100) : 0;
                  const isSafe = finalPct >= targetPct;
                  const changeAmt = finalPct - (selectedStats?.percentage || 0);

                  return (
                    <div style={{ 
                      background: isSafe ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                      border: `1.5px solid ${isSafe ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, 
                      borderRadius: '24px', 
                      padding: '20px',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>
                          Final Projected Attendance
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '950', color: isSafe ? 'var(--success)' : 'var(--danger)', letterSpacing: '-1px' }}>
                          {finalPct}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '600' }}>
                          {changeAmt === 0 ? 'No change to current score' : changeAmt > 0 ? `Increases by +${changeAmt}%` : `Drops by ${changeAmt}%`}
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: isSafe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                        color: isSafe ? '#34d399' : '#f87171',
                        padding: '8px 16px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        textAlign: 'center'
                      }}>
                        {isSafe ? '🛡️ SAFE TRAJECTORY' : '🚨 CRITICAL DROP'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* AI Strategic Action Checklist */}
              <div className="dashboard-card" style={{ 
                padding: '28px', 
                background: 'rgba(139, 92, 246, 0.08)', 
                border: '1px solid rgba(139, 92, 246, 0.2)', 
                borderRadius: '24px',
                marginBottom: '32px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '60px', opacity: 0.05 }}>🧠</div>
                <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-light)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🧠</span> AI Strategic Action Checklist
                </h4>

                {(() => {
                  const pct = selectedStats?.percentage || 0;
                  let badgeColor = '';
                  let badgeText = '';
                  let checklistItems = [];

                  if (pct >= 80) {
                    badgeColor = 'var(--success)';
                    badgeText = '🏆 HIGH PRIVILEGE ZONE';
                    checklistItems = [
                      { text: `You have a very strong buffer. You can safely bunk up to ${selectedStats?.bunkableNow || 0} classes.`, check: true },
                      { text: 'Recommended skip strategy: "Selective High-Value Skip". Reserve skips for hackathons or research.', check: true },
                      { text: 'Verify that manual offline marks are synced with Pod.ai daily.', check: true }
                    ];
                  } else if (pct >= targetPct) {
                    badgeColor = 'var(--warning)';
                    badgeText = '⚠️ STABILITY ALERT ZONE';
                    checklistItems = [
                      { text: `Your attendance is above criteria but close to the margin. Limit bunks to ${selectedStats?.bunkableNow || 0} session max.`, check: true },
                      { text: 'Avoid back-to-back bunks of this subject to prevent sudden drops.', check: true },
                      { text: 'Recommended strategy: "Conservative Skip Mode". Skip only when absolutely vital.', check: true }
                    ];
                  } else {
                    badgeColor = '#ef4444';
                    badgeText = '🚨 EMERGENCY RECOVERY ZONE';
                    checklistItems = [
                      { text: `Attendance depleted! You must attend the next ${selectedStats?.mustAttend || 0} classes consecutively.`, check: false },
                      { text: 'Freeze all skip actions. Set strict reminder alarms for all upcoming lecture alerts.', check: false },
                      { text: 'Recommended strategy: "Absolute Timetable Lock". Full attendance required until target is reached.', check: false }
                    ];
                  }

                  return (
                    <div>
                      <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: '900', color: badgeColor, background: 'rgba(255,255,255,0.03)', border: `1px solid ${badgeColor}`, padding: '4px 10px', borderRadius: '8px', marginBottom: '16px' }}>
                        {badgeText}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {checklistItems.map((item, index) => (
                          <div key={index} style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: '1.5', alignItems: 'flex-start' }}>
                            <span style={{ color: item.check ? 'var(--success)' : '#ef4444', fontWeight: '900' }}>
                              {item.check ? '✓' : '⚠️'}
                            </span>
                            <span style={{ color: 'var(--text-main)' }}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, padding: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                   <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Total Scheduled</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>{selectedStats?.totalPlanned || 0}</div>
                </div>
                <div style={{ flex: 1, padding: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                   <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Classes Left</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>{selectedStats?.remainingClasses || 0}</div>
                </div>
                <div style={{ flex: 1, padding: '18px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                   <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Bunk Buffer</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary-light)' }}>{Math.max(0, (selectedStats?.remainingClasses || 0) - (selectedStats?.mustAttend || 0))}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛡️ Premium Exam-Prep Skip Optimizer */}
      {isPremium && (
        <div className="calculator-card" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                  Exam-Prep Skip Optimizer
                </h3>
                <span style={{ fontSize: '10px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: '20px', fontWeight: '800' }}>AI SYSTEM</span>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', margin: '4px 0 0 0' }}>
                Find exactly how many classes you can skip across all subjects to study for exams.
              </p>
            </div>

            {/* Selector Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select 
                value={examTargetType}
                onChange={(e) => setExamTargetType(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none'
                }}
              >
                <option value="midterm" style={{ background: '#0f172a' }}>Midterm Exams</option>
                <option value="endterm" style={{ background: '#0f172a' }}>Final Endterms</option>
                <option value="custom" style={{ background: '#0f172a' }}>Custom Date...</option>
              </select>

              {examTargetType === 'custom' && (
                <input 
                  type="date"
                  value={customExamDate}
                  onChange={(e) => setCustomExamDate(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '700',
                    outline: 'none'
                  }}
                />
              )}
            </div>
          </div>

          {/* Aggregate Savings Dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            <div style={{ padding: '18px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '16px', border: '1px solid var(--primary-glow)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '6px' }}>Total Safe Skips Available</div>
              <div style={{ fontSize: '26px', fontWeight: '950', color: 'var(--primary-light)' }}>{examPrepOptimizer.totalSkipsPossible} <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '600' }}>Classes</span></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spread across all active subjects</span>
            </div>

            <div style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '6px' }}>Study Hours Reclaimed</div>
              <div style={{ fontSize: '26px', fontWeight: '950', color: 'var(--success)' }}>{examPrepOptimizer.totalHoursReclaimed} <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '600' }}>Hours</span></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>At estimated 1.5 hrs per lecture</span>
            </div>

            <div style={{ padding: '18px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '6px' }}>Exam Preparation Window</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginTop: '8px' }}>
                Until {new Date(examPrepOptimizer.resolvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Date resolved by AI engine</span>
            </div>
          </div>

          {/* Subjects Optimizer Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Subject</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Current Attendance</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Classes before Exams</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Safe Skips</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Study Time Gained</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', textAlign: 'center' }}>Simulation Action</th>
                </tr>
              </thead>
              <tbody>
                {examPrepOptimizer.subjectsPlan.map((plan) => (
                  <tr key={plan.subjectId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '750', color: 'white' }}>{plan.subjectName}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '750', color: plan.currentPct >= plan.criteria ? 'var(--success)' : 'var(--danger)' }}>
                      {plan.currentPct}% <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>/ {plan.criteria}%</span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600' }}>{plan.upcomingClassesCount} sessions</td>
                    <td style={{ padding: '16px', fontSize: '15px', fontWeight: '900', color: plan.safeSkips > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {plan.safeSkips} classes
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '800', color: plan.safeSkips > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      +{plan.reclaimedHours}h
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        disabled={plan.safeSkips === 0}
                        onClick={() => {
                          const skipsToApply = {};
                          plan.upcomingClasses.slice(0, plan.safeSkips).forEach(cls => {
                            skipsToApply[cls.id] = true;
                          });
                          setCustomSkips(skipsToApply);
                          setSelectedSubjectId(plan.subjectId);
                          useAppStore.getState().showToast(`⚡ Applied exam skip simulation for ${plan.subjectName}!`, 'success');
                          
                          // Scroll to top of card so they can see the simulator
                          document.querySelector('.calculator-card').scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          background: plan.safeSkips > 0 ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          border: `1.5px solid ${plan.safeSkips > 0 ? '#818cf8' : 'var(--border)'}`,
                          color: plan.safeSkips > 0 ? '#a5b4fc' : 'var(--text-muted)',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: plan.safeSkips > 0 ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (plan.safeSkips > 0) {
                            e.currentTarget.style.background = '#818cf8';
                            e.currentTarget.style.color = 'white';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (plan.safeSkips > 0) {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                            e.currentTarget.style.color = '#a5b4fc';
                          }
                        }}
                      >
                        ⚡ Simulate skips
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <motion.div
        variants={fadeInUp}
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ fontSize: '28px' }}>💡</div>
        <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--success)' }}>Pro Tip:</strong> Use the Bunk Calculator to decide which classes are safe to skip for events or projects without dropping below your {attendanceSettings?.defaultTarget || 75}% threshold.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default BunkCalculator;
