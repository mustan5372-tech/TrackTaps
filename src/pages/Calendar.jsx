import React, { useState, useEffect } from 'react';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026

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
          {days.map((day, idx) => (
            <div key={idx} className="calendar-day">
              {day && <span>{day}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
