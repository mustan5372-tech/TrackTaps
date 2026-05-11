import React, { useState, useEffect } from 'react';

function Timetable() {
  const [selectedDay, setSelectedDay] = useState(2); // Wednesday
  const [timetableData, setTimetableData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    teacher: '',
    day: 2
  });

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tracktaps_timetable') || '[]');
    setTimetableData(saved);
  }, []);

  const handleSaveSlot = () => {
    if (!formData.subject.trim()) {
      alert('Please enter subject name');
      return;
    }

    const newData = [...timetableData];
    if (editingSlot !== null) {
      newData[editingSlot] = { ...formData, id: editingSlot };
    } else {
      newData.push({ ...formData, id: Date.now() });
    }

    setTimetableData(newData);
    localStorage.setItem('tracktaps_timetable', JSON.stringify(newData));
    setShowModal(false);
    setFormData({ subject: '', startTime: '09:00', endTime: '10:00', room: '', teacher: '', day: 2 });
    setEditingSlot(null);
  };

  const handleDeleteSlot = (id) => {
    const newData = timetableData.filter((_, idx) => idx !== id);
    setTimetableData(newData);
    localStorage.setItem('tracktaps_timetable', JSON.stringify(newData));
    setShowModal(false);
  };

  const handleEditSlot = (idx) => {
    setEditingSlot(idx);
    setFormData(timetableData[idx]);
    setShowModal(true);
  };

  const getDaySchedule = () => {
    return timetableData.filter(slot => slot.day === selectedDay);
  };

  const getGridSlots = () => {
    const grid = {};
    timetableData.forEach(slot => {
      if (!grid[slot.day]) grid[slot.day] = [];
      grid[slot.day].push(slot);
    });
    return grid;
  };

  return (
    <div className="timetable-view">
      <header className="view-header">
        <h2>Schedule</h2>
        <button 
          onClick={() => {
            setEditingSlot(null);
            setFormData({ subject: '', startTime: '09:00', endTime: '10:00', room: '', teacher: '', day: selectedDay });
            setShowModal(true);
          }}
          className="primary-btn"
          style={{ fontSize: '13px', padding: '10px 16px' }}
        >
          + Add Class
        </button>
      </header>

      <div className="day-tabs-wrapper">
        <div className="day-tabs">
          {days.map((day, idx) => (
            <button
              key={idx}
              className={`day-tab ${selectedDay === idx ? 'active' : ''}`}
              onClick={() => setSelectedDay(idx)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="timetable-content">
        <div id="timetable-day-view" className="day-schedule">
          {getDaySchedule().length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No classes scheduled for {days[selectedDay]}</p>
          ) : (
            getDaySchedule().map((slot, idx) => (
              <div 
                key={idx}
                className="schedule-block"
                onClick={() => handleEditSlot(timetableData.indexOf(slot))}
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ color: '#f8fafc', marginBottom: '4px' }}>{slot.subject}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                      {slot.startTime} - {slot.endTime}
                    </p>
                    {slot.room && <p style={{ color: '#a78bfa', fontSize: '12px' }}>Room: {slot.room}</p>}
                    {slot.teacher && <p style={{ color: '#a78bfa', fontSize: '12px' }}>Teacher: {slot.teacher}</p>}
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Click to edit</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="timetable-card">
          <div className="timetable-wrapper">
            <div className="timetable-grid" id="timetable-grid">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {days.map((day, dayIdx) => (
                  <div key={dayIdx} style={{ textAlign: 'center', padding: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                    {day}
                  </div>
                ))}
                {timeSlots.map((time, timeIdx) => (
                  <React.Fragment key={`time-${timeIdx}`}>
                    {days.map((day, dayIdx) => {
                      const daySlots = (getGridSlots()[dayIdx] || []).filter(s => s.startTime === time);
                      return (
                        <div
                          key={`${dayIdx}-${timeIdx}`}
                          style={{
                            background: daySlots.length > 0 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(139, 92, 246, 0.1)',
                            borderRadius: '8px',
                            padding: '8px',
                            minHeight: '60px',
                            fontSize: '11px',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            cursor: daySlots.length > 0 ? 'pointer' : 'default'
                          }}
                          onClick={() => daySlots.length > 0 && handleEditSlot(timetableData.indexOf(daySlots[0]))}
                        >
                          {daySlots.length > 0 && (
                            <div style={{ color: '#a78bfa', fontWeight: '600' }}>
                              {daySlots[0].subject}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '24px' }}>
              {editingSlot !== null ? 'Edit Class' : 'Add Class'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Room (Optional)</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="e.g., Room 101"
                />
              </div>

              <div>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Teacher (Optional)</label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="e.g., Dr. Smith"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleSaveSlot}
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
                {editingSlot !== null && (
                  <button
                    onClick={() => handleDeleteSlot(editingSlot)}
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
                    setEditingSlot(null);
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

export default Timetable;
