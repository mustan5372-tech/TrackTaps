import React, { useState, useEffect } from 'react';

function Subjects() {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const savedSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    setSubjects(savedSubjects);
  }, []);

  return (
    <div className="subjects-view">
      <header className="view-header">
        <h2>My Subjects</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button id="ai-import-trigger" className="action-btn present" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 16px' }}>
            <span>✨</span> AI Import
          </button>
          <button id="add-subject-btn" className="primary-btn">+ Add Subject</button>
        </div>
      </header>
      <div id="subjects-grid" className="subjects-grid">
        {subjects.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>No subjects added yet. Click "Add Subject" to get started!</p>
        ) : (
          subjects.map((subject, idx) => (
            <div key={idx} className="subject-card">
              <div className="subject-header">
                <h3>{subject.name}</h3>
              </div>
              <div className="subject-stats">
                <span>{subject.attendance || 0}% Attendance</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Subjects;
