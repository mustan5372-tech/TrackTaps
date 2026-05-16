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
    fullSync 
  } = useAppStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fullSync();
    setIsPremium(subscription?.status === 'active');
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

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return 'var(--success)';
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
          background: var(--surface-glass);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
      `}</style>
      <header className="bunk-calculator-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Bunk Calculator</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Precision attendance planning.</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ 
            background: 'var(--primary-glow)', 
            padding: '8px 12px', 
            borderRadius: '12px', 
            border: '1px solid var(--primary-light)',
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
                background: 'var(--surface-bright)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '18px 20px',
                color: 'var(--text-main)',
                fontSize: '16px',
                fontWeight: '700',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-light)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.name}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }}>
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

        <AnimatePresence mode="wait">
          {selectedStats && (
            <motion.div
              key={selectedSubjectId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.1em' }}>Current Attendance</div>
                  <div style={{ fontSize: '36px', fontWeight: '950', color: getStatusColor(selectedStats.percentage), letterSpacing: '-1px' }}>{selectedStats.percentage}%</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px', fontWeight: '600' }}>
                    <span style={{ color: 'var(--text-main)' }}>{selectedStats.present}</span> of {selectedStats.total} classes
                  </div>
                </div>
                <div style={{ 
                  padding: '24px', 
                  background: selectedStats.bunkableNow > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                  borderRadius: '24px', 
                  border: `1px solid ${selectedStats.bunkableNow > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  boxShadow: 'var(--shadow-sm)' 
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.1em' }}>Safe to Bunk</div>
                  <div style={{ fontSize: '36px', fontWeight: '950', color: selectedStats.bunkableNow > 0 ? 'var(--success)' : 'var(--danger)', letterSpacing: '-1px' }}>
                    {selectedStats.bunkableNow} <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0' }}>Classes</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px', fontWeight: '600' }}>Until you hit {selectedSubject?.criteria || 75}%</div>
                </div>
              </div>

              {/* Recovery Insight Block - Phase 7 */}
              {selectedStats.percentage < (selectedSubject?.criteria || 75) && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    border: '1px solid rgba(245, 158, 11, 0.2)', 
                    marginBottom: '32px',
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
                    You need <span style={{ color: 'var(--warning)', fontSize: '18px', fontWeight: '900' }}>{selectedStats.mustAttend} consecutive classes</span> to recover your attendance to {selectedSubject?.criteria || 75}%.
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Estimated recovery date: {new Date(new Date().setDate(new Date().getDate() + (selectedStats.mustAttend * 1.5))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </motion.div>
              )}

              <div style={{ background: 'rgba(139, 92, 246, 0.05)', borderRadius: '24px', padding: '28px', border: '1px solid var(--primary-glow)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '60px', opacity: 0.05 }}>📊</div>
                <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-light)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                   <span>⚡</span> Prediction Insights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                      <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '600' }}>If you miss next class:</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: getStatusColor(selectedStats.prediction.ifMissNext1) }}>{selectedStats.prediction.ifMissNext1}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
                      <span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '600' }}>If you attend next class:</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: getStatusColor(selectedStats.prediction.ifAttendNext1) }}>{selectedStats.prediction.ifAttendNext1}%</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>Semester Target Goal:</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-light)', padding: '4px 10px', background: 'var(--primary-glow)', borderRadius: '8px' }}>{selectedSubject?.criteria || 75}%</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, padding: '18px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Total Scheduled</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>{selectedStats.totalPlanned}</div>
                </div>
                <div style={{ flex: 1, padding: '18px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Classes Left</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>{selectedStats.remainingClasses}</div>
                </div>
                <div style={{ flex: 1, padding: '18px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Bunk Buffer</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary-light)' }}>{Math.max(0, selectedStats.remainingClasses - selectedStats.mustAttend)}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        variants={fadeInUp}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ fontSize: '28px' }}>💡</div>
        <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--success)' }}>Pro Tip:</strong> Use the Bunk Calculator to decide which classes are safe to skip for events or projects without dropping below your {selectedSubject?.criteria || 75}% threshold.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default BunkCalculator;
