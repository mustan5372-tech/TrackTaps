import React, { useState, useEffect } from 'react';
import useAppStore from '../store/appStore';

function Subjects() {
  const [showModal, setShowModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    criteria: 75
  });

  // Get data from Zustand store
  const {
    subjects,
    subjectStats,
    addSubject,
    updateSubject,
    deleteSubject,
    subscription,
    incrementAiUsage,
    semesterStats,
    fullSync
  } = useAppStore();

  const handleAiImport = () => {
    const canUseAi = incrementAiUsage();
    if (!canUseAi) {
      alert("💎 Daily Limit Reached: Free users get 5 AI requests per day. Upgrade to Plus for unlimited AI features!");
      window.location.href = '/premium';
      return;
    }
    // Existing logic would be here
  };

  useEffect(() => {
    // Ensure stats are calculated when Subjects page loads
    fullSync();
  }, [fullSync]);

  const handleSaveSubject = () => {
    if (!formData.name.trim()) {
      alert('Please enter subject name');
      return;
    }

    if (editingIdx !== null) {
      // Find the subject ID from the subjects array
      const subjectId = subjects[editingIdx]?.id;
      if (subjectId) {
        updateSubject(subjectId, formData);
      }
    } else {
      addSubject({
        name: formData.name,
        criteria: formData.criteria,
        color: formData.color || 'var(--primary)',
        attendance: 0,
        present: 0,
        total: 0
      });
    }

    setShowModal(false);
    setFormData({ name: '', criteria: 75, color: 'var(--primary)' });
    setEditingIdx(null);
  };

  const handleDeleteSubject = (idx) => {
    const subjectId = subjects[idx]?.id;
    if (subjectId) {
      deleteSubject(subjectId);
    }
    setShowModal(false);
  };

  const handleEditSubject = (idx) => {
    setEditingIdx(idx);
    setFormData({ ...subjects[idx], color: subjects[idx].color || 'var(--primary)' });
    setShowModal(true);
  };

  const getAttendancePercentage = (subject) => {
    // First try computed stats from attendance engine
    const stats = subjectStats?.[subject.id];
    if (stats && stats.total && stats.total > 0) {
      const val = Math.round((stats.present / stats.total) * 100);
      return isNaN(val) ? 0 : val;
    }
    // Fallback to Pod.ai baseline data
    if (subject.podaiPercentage && !isNaN(subject.podaiPercentage)) {
      return Math.round(Number(subject.podaiPercentage));
    }
    // Fallback to initialPresent/initialTotal from Pod.ai import
    const present = Number(subject.initialPresent || subject.present || 0);
    const total = Number(subject.initialTotal || subject.total || 0);
    if (total > 0) {
      const val = Math.round((present / total) * 100);
      return isNaN(val) ? 0 : val;
    }
    return 0;
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return '#10b981';
    if (percentage >= 65) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="subjects-view">
      <header className="view-header">
        <h2>My Subjects</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.location.href = '/pod'}
              className="action-btn" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '13px', 
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #a855f7 0%, var(--primary) 100%)',
                border: 'none',
                color: 'var(--text-main)',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--primary-glow)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 20px var(--primary-glow)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 12px var(--primary-glow)'}
            >
              <span>📥</span> Import from Pod.ai
            </button>
            <button 
              onClick={handleAiImport}
              className="action-btn present" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '13px', 
                padding: '10px 16px',
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '10px',
                color: 'var(--primary-light)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <span>✨</span> AI Import {subscription?.status !== 'active' && <span style={{ fontSize: '10px', opacity: 0.7 }}>(5/day)</span>}
            </button>
            <button 
              onClick={() => {
                setEditingIdx(null);
                setFormData({ name: '', criteria: 75 });
                setShowModal(true);
              }}
              className="primary-btn"
            >
              + Add Subject
            </button>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '500' }}>
            Import real attendance directly from Pod.ai
          </span>
        </div>
      </header>
      <div id="subjects-grid" className="subjects-grid">
        {subjects.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>No subjects added yet. Click "Add Subject" to get started!</p>
        ) : (
          subjects.map((subject, idx) => (
            <div 
              key={idx}
              className="subject-card"
              onClick={() => handleEditSubject(idx)}
              style={{
                background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '600' }}>{subject.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click to edit</span>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Attendance</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: getAttendanceColor(getAttendancePercentage(subject)) }}>
                    {getAttendancePercentage(subject)}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Classes</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>
                    {(() => {
                      const stats = subjectStats?.[subject.id];
                      const present = stats?.present ?? Number(subject.initialPresent || subject.present || 0);
                      const total = stats?.total ?? Number(subject.initialTotal || subject.total || 0);
                      return `${isNaN(present) ? 0 : present}/${isNaN(total) ? 0 : total}`;
                    })()}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Target</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-light)' }}>
                    {subject.criteria}%
                  </div>
                </div>
              </div>

              {/* Bunk & Prediction Engine (Premium Feature) */}
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(15, 23, 42, 0.4)', 
                borderRadius: '12px',
                border: '1px solid var(--primary-glow)'
              }}>
                {subscription?.status === 'active' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bunkable Now</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: semesterStats[subject.id]?.bunkableNow > 0 ? '#10b981' : '#ef4444' }}>
                        {semesterStats[subject.id]?.bunkableNow || 0} Classes
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semester Total</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {semesterStats[subject.id]?.totalPlanned || 0} Planned
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>TRAJECTORY</div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                        <span style={{ color: '#ef4444' }}>Miss 1: {semesterStats[subject.id]?.prediction?.ifMissNext1 ?? 0}%</span>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span style={{ color: '#10b981' }}>Attend 1: {semesterStats[subject.id]?.prediction?.ifAttendNext1 ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', py: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: '700' }}>✨ UNLOCK BUNK PREDICTIONS</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Get TrackTaps Plus to plan your semester bunking.</div>
                  </div>
                )}
              </div>

              <div style={{
                height: '4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(getAttendancePercentage(subject), 100)}%`,
                  background: getAttendanceColor(getAttendancePercentage(subject)),
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '24px' }}>
              {editingIdx !== null ? 'Edit Subject' : 'Add Subject'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-main)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['var(--primary)', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: color,
                        border: formData.color === color ? '3px solid var(--text-main)' : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  Attendance Criteria: {formData.criteria}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary)',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleSaveSubject}
                  style={{
                    flex: 1,
                    background: 'var(--primary)',
                    color: 'var(--text-main)',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                {editingIdx !== null && (
                  <button
                    onClick={() => handleDeleteSubject(editingIdx)}
                    style={{
                      background: '#ef4444',
                      color: 'var(--text-main)',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingIdx(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
