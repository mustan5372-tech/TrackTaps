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
          <select 
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-bright)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px',
              color: 'var(--text-main)',
              fontSize: '16px',
              fontWeight: '600',
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.3s'
            }}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.name}</option>
            ))}
          </select>
        </div>

        {!isPremium && (
          <div className="premium-lock-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💎</div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Unlock Smart Bunking</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '300px', marginBottom: '24px' }}>
                Upgrade to TrackTaps Plus to unlock real-time bunk predictions, safe-to-skip counts, and semester trajectories.
              </p>
              <button 
                onClick={() => navigate('/premium')}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px var(--primary-glow)'
                }}
              >
                Upgrade Now
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
                <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Current Attendance</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: getStatusColor(selectedStats.percentage) }}>{selectedStats.percentage}%</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedStats.present} / {selectedStats.total} classes</div>
                </div>
                <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Safe to Bunk</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: selectedStats.bunkableNow > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {selectedStats.bunkableNow} <span style={{ fontSize: '16px' }}>Classes</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Until you hit {selectedSubject?.criteria || 75}%</div>
                </div>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.05)', borderRadius: '20px', padding: '24px', border: '1px solid var(--primary-glow)', marginBottom: '32px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span>📈</span> SEMESTER TRAJECTORY
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>If you miss next class:</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: getStatusColor(selectedStats.prediction.ifMissNext1) }}>{selectedStats.prediction.ifMissNext1}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>If you attend next class:</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: getStatusColor(selectedStats.prediction.ifAttendNext1) }}>{selectedStats.prediction.ifAttendNext1}%</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Must attend to reach {selectedSubject?.criteria || 75}%:</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--success)' }}>{selectedStats.mustAttend} Classes</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Planned</div>
                   <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{selectedStats.totalPlanned}</div>
                </div>
                <div style={{ flex: 1, padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining</div>
                   <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{selectedStats.remainingClasses}</div>
                </div>
                <div style={{ flex: 1, padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '16px', textAlign: 'center' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Buffer</div>
                   <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-light)' }}>{Math.max(0, selectedStats.remainingClasses - selectedStats.mustAttend)}</div>
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
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ fontSize: '24px' }}>💡</div>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <strong>Pro Tip:</strong> Use the Bunk Calculator to decide which classes are safe to skip for events or projects without hurting your attendance criteria.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default BunkCalculator;
