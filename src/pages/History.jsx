import React, { useState, useEffect } from 'react';

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
    setHistory(savedHistory);
  }, []);

  return (
    <div className="history-view">
      <header className="view-header">
        <h2>Attendance History</h2>
      </header>
      <div id="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No attendance history yet</p>
        ) : (
          history.map((entry, idx) => (
            <div key={idx} className="history-entry">
              <p>{entry.date}: {entry.subject} - {entry.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default History;
