import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';

// 🚀 Memoized Subject Card for high-performance list rendering
const SubjectCard = React.memo(({ 
  subject, 
  stats, 
  semesterStats, 
  isPremium, 
  onEdit, 
  onCalculate,
  getAttendanceColor,
  getAttendancePercentage
}) => {
  const percentage = getAttendancePercentage(subject, stats);
  const color = getAttendanceColor(percentage);
  
  const present = stats?.present ?? Number(subject.initialPresent || subject.present || 0);
  const total = stats?.total ?? Number(subject.initialTotal || subject.total || 0);
  
  const safeBunks = semesterStats?.bunkableNow || 0;

  return (
    <div 
      className="subject-card dashboard-card"
      onClick={() => onEdit()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-glass) 100%)',
        border: '1px solid var(--border)',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '600' }}>{subject.name}</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Edit</span>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Attendance</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color }}>
            {percentage}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Classes</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>
            {present}/{total}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Target</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-light)' }}>
            {subject.criteria}%
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '8px', 
        padding: '12px', 
        background: 'var(--surface-dark)', 
        borderRadius: '12px',
        border: '1px solid var(--primary-glow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bunk Prediction</div>
           {isPremium ? (
             <div style={{ 
               fontSize: '12px', 
               fontWeight: '800', 
               color: (safeBunks > 0) ? 'var(--success)' : 'var(--text-dim)' 
             }}>
               {safeBunks} Classes Safe
             </div>
           ) : (
             <span style={{ fontSize: '9px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>PLUS</span>
           )}
        </div>
        
        {isPremium ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCalculate();
            }}
            style={{
              width: '100%',
              background: 'var(--primary-glow)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px',
              color: 'var(--primary-light)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🏖️ Smart Bunk Planner
          </button>
        ) : (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onCalculate(); // Navigates to premium for non-members
            }}
            style={{
              width: '100%',
              background: 'var(--primary-glow)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px',
              color: 'var(--text-main)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ color: 'var(--primary-light)', fontWeight: '800' }}>💎 Unlock Premium</div>
          </div>
        )}
      </div>

      {/* RECOVERY ROADMAP - PREMIUM PHASE 5 */}
      {isPremium && percentage < subject.criteria && (
        <div style={{
          marginTop: '4px',
          padding: '12px',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '12px',
          border: '1px dashed var(--success)',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Recovery Roadmap 📈
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px' }}>
            {[1, 2, 3, 4, 5].map(i => {
              const projected = Math.min(100, Math.round(((present + i) / (total + i)) * 100));
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${(projected / 100) * 30}px`, 
                    background: 'var(--success)', 
                    opacity: 0.3 + (i * 0.14),
                    borderRadius: '2px'
                  }} />
                  <span style={{ fontSize: '8px', color: 'var(--text-dim)', fontWeight: '700' }}>{projected}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
            Attend next 5 classes to reach <b>{Math.round(((present + 5) / (total + 5)) * 100)}%</b>
          </div>
        </div>
      )}

      <div style={{
        height: '4px',
        background: 'var(--surface-glass)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginTop: '8px'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(percentage, 100)}%`,
          background: color,
          transition: 'width 0.3s'
        }} />
      </div>
    </div>
  );
});

function Subjects() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    criteria: 75
  });

  const {
    subjects,
    subjectStats,
    addSubject,
    updateSubject,
    deleteSubject,
    subscription,
    semesterStats,
    fullSync
  } = useAppStore();

  const [isAiLoading, setIsAiLoading] = useState(false);
  const isPremium = subscription?.status === 'active';

  useEffect(() => {
    fullSync();
  }, [fullSync]);

  const handleSaveSubject = useCallback(() => {
    if (!formData.name.trim()) return;

    if (editingIdx !== null) {
      const subjectId = subjects[editingIdx]?.id;
      if (subjectId) updateSubject(subjectId, formData);
    } else {
      addSubject({
        ...formData,
        color: formData.color || 'var(--primary)',
        attendance: 0, present: 0, total: 0
      });
    }

    setShowModal(false);
    setFormData({ name: '', criteria: 75, color: 'var(--primary)' });
    setEditingIdx(null);
  }, [formData, editingIdx, subjects, updateSubject, addSubject]);

  const handleDeleteSubject = useCallback((idx) => {
    const subjectId = subjects[idx]?.id;
    if (subjectId) deleteSubject(subjectId);
    setShowModal(false);
  }, [subjects, deleteSubject]);

  const getAttendancePercentage = useCallback((subject, stats) => {
    if (stats && stats.total > 0) {
      return Math.round((stats.present / stats.total) * 100) || 0;
    }
    if (subject.podaiPercentage) return Math.round(Number(subject.podaiPercentage));
    const present = Number(subject.initialPresent || subject.present || 0);
    const total = Number(subject.initialTotal || subject.total || 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, []);

  const getAttendanceColor = useCallback((percentage) => {
    if (percentage >= 75) return 'var(--success)';
    if (percentage >= 65) return 'var(--warning)';
    return 'var(--danger)';
  }, []);

  return (
    <div className="subjects-view">
      <header className="view-header">
        <h2>My Subjects</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigate('/pod')}
            className="action-btn"
            style={{ padding: '10px 16px', background: 'var(--primary-glow)', border: 'none', color: 'var(--primary-light)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
          >
            📥 Sync Pod.ai
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
      </header>

      <div className="subjects-grid">
        {(!subjects || subjects.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface-glass)', borderRadius: '24px', border: '1px dashed var(--border)', width: '100%', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>📚</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>No Subjects Yet</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Sync with Pod.ai or manually add subjects to start tracking your attendance.</p>
          </div>
        ) : (
          subjects.map((subject, idx) => (
            <SubjectCard 
              key={subject.id || idx}
              subject={subject}
              stats={subjectStats?.[subject.id]}
              semesterStats={semesterStats?.[subject.id]}
              isPremium={isPremium}
              onEdit={() => {
                setEditingIdx(idx);
                setFormData({ ...subjects[idx], color: subjects[idx].color || 'var(--primary)' });
                setShowModal(true);
              }}
              onCalculate={() => {
                if (isPremium) navigate(`/bunk-calculator?subjectId=${subject.id}`);
                else navigate('/premium');
              }}
              getAttendanceColor={getAttendanceColor}
              getAttendancePercentage={getAttendancePercentage}
            />
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content dashboard-card" style={{ padding: '32px', maxWidth: '400px', width: '90%', animation: 'fadeInScale 0.3s ease-out' }}>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '24px' }}>{editingIdx !== null ? 'Edit Subject' : 'Add Subject'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Subject Name"
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '12px', borderRadius: '10px' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleSaveSubject} className="primary-btn" style={{ flex: 1 }}>Save</button>
                {editingIdx !== null && <button onClick={() => handleDeleteSubject(editingIdx)} style={{ flex: 1, background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '10px' }}>Delete</button>}
                <button onClick={() => setShowModal(false)} className="action-btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
