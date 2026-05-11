import React, { useState } from 'react';

function Timetable() {
  const [selectedDay, setSelectedDay] = useState(2); // Wednesday

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="timetable-view">
      <header className="view-header">
        <h2>Schedule</h2>
      </header>

      <div className="day-tabs-wrapper">
        <div className="day-tabs">
          {days.map((day, idx) => (
            <button
              key={idx}
              className={`day-tab ${selectedDay === idx ? 'active' : ''}`}
              data-day={idx}
              onClick={() => setSelectedDay(idx)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="timetable-content">
        <div id="timetable-day-view" className="day-schedule">
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No classes scheduled for {days[selectedDay]}</p>
        </div>

        <div className="timetable-card">
          <div className="timetable-wrapper">
            <div className="timetable-grid" id="timetable-grid">
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>Add subjects to view your timetable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timetable;
