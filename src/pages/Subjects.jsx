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
    addSubject,
    updateSubject,
    deleteSubject
  } = useAppStore();

  useEffect(() => {
    // Initialize component
  }, []);

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
        color: formData.color || '#8b5cf6',
        attendance: 0,
        present: 0,
        total: 0
      });
    }

    setShowModal(false);
    setFormData({ name: '', criteria: 75, color: '#8b5cf6' });
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
    setFormData({ ...subjects[idx], color: subjects[idx].color || '#8b5cf6' });
    setShowModal(true);
  };

  const getAttendancePercentage = (subject) => {
    if (subject.total === 0) return 0;
    return Math.round((subject.present / subject.total) * 100);
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button id="ai-import-trigger" className="action-btn present" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 16px' }}>
            <span>✨</span> AI Import
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
      <div id="subjects-grid" className="subjects-grid">
        {subjects.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>No subjects added yet. Click "Add Subject" to get started!</p>
        ) : (
          subjects.map((subject, idx) => (
            <div 
              key={idx}
              className="subject-card"
              onClick={() => handleEditSubject(idx)}
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
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
                <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '600' }}>{subject.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Click to edit</span>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Attendance</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: getAttendanceColor(getAttendancePercentage(subject)) }}>
                    {getAttendancePercentage(subject)}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Classes</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#f8fafc' }}>
                    {subject.present}/{subject.total}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Target</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#a78bfa' }}>
                    {subject.criteria}%
                  </div>
                </div>
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
            background: '#0f172a',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '24px' }}>
              {editingIdx !== null ? 'Edit Subject' : 'Add Subject'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: color,
                        border: formData.color === color ? '3px solid #f8fafc' : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
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
                    accentColor: '#8b5cf6',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleSaveSubject}
                  style={{
                    flex: 1,
                    background: '#8b5cf6',
                    color: '#f8fafc',
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
                      color: '#f8fafc',
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
                    color: '#94a3b8',
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
