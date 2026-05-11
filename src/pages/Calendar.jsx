import React, { useState, useEffect } from 'react';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tracktaps_attendance') || '{}');
    setAttendanceData(saved);
  }, []);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowModal(true);
  };

  const handleMarkAttendance = (status) => {
    if (!selectedDate) return;

    const newData = { ...attendanceData };
    if (!newData[selectedDate]) {
      newData[selectedDate] = {};
    }
    newData[selectedDate].status = status;
    newData[selectedDate].timestamp = new Date().toISOString();

    setAttendanceData(newData);
    localStorage.setItem('tracktaps_attendance', JSON.stringify(newData));
    setShowModal(false);
  };

  const getDateStatus = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceData[dateStr]?.status;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getStatusColor = (status) => {
    if (status === 'present') return '#10b981';
    if (status === 'absent') return '#ef4444';
    if (status === 'leave') return '#f59e0b';
    return 'transparent';
  };

  const getStatusIcon = (status) => {
    if (status === 'present') return '✓';
    if (status === 'absent') return '✗';
    if (status === 'leave') return '◯';
    return '';
  };

  return (
    <div className="calendar-view">
      <header className="calendar-header">
        <h2 id="month-year">{monthYear}</h2>
        <div className="calendar-controls">
          <button id="prev-month" className="control-btn" onClick={handlePrevMonth}>←</button>
          <button id="next-month" className="control-btn" onClick={handleNextMonth}>→</button>
        </div>
      </header>
      <div className="calendar-card">
        <div className="weekdays">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
        <div id="calendar-grid" className="calendar-grid">
          {days.map((day, idx) => {
            const status = day ? getDateStatus(day) : null;
            return (
              <div 
                key={idx}
                className="calendar-day"
                onClick={() => day && handleDateClick(day)}
                style={{
                  cursor: day ? 'pointer' : 'default',
                  background: status ? `${getStatusColor(status)}20` : 'transparent',
                  border: status ? `2px solid ${getStatusColor(status)}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}
              >
                {day && (
                  <>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>{day}</span>
                    {status && (
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        fontSize: '12px',
                        color: getStatusColor(status),
                        fontWeight: '700'
                      }}>
                        {getStatusIcon(status)}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <div style={{ width: '16px', height: '16px', background: '#10b98120', border: '2px solid #10b981', borderRadius: '4px' }} />
          <span>Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <div style={{ width: '16px', height: '16px', background: '#ef444420', border: '2px solid #ef4444', borderRadius: '4px' }} />
          <span>Absent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <div style={{ width: '16px', height: '16px', background: '#f59e0b20', border: '2px solid #f59e0b', borderRadius: '4px' }} />
          <span>Leave</span>
        </div>
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
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '24px' }}>
              Mark Attendance for {selectedDate}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleMarkAttendance('present')}
                style={{
                  background: '#10b981',
                  color: '#f8fafc',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✓ Present
              </button>
              <button
                onClick={() => handleMarkAttendance('absent')}
                style={{
                  background: '#ef4444',
                  color: '#f8fafc',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✗ Absent
              </button>
              <button
                onClick={() => handleMarkAttendance('leave')}
                style={{
                  background: '#f59e0b',
                  color: '#f8fafc',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ◯ Leave
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
