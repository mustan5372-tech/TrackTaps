import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function Timetable() {
  const [subjects, setSubjects] = useState([]);
  const [timetableData, setTimetableData] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Load subjects from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tracktaps_subjects') || '[]');
    setSubjects(saved);
  }, []);

  // Load timetable from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tracktaps_timetable_grid') || '{}');
    setTimetableData(saved);
  }, []);

  // Save timetable to localStorage
  const saveTimetable = (newData) => {
    setTimetableData(newData);
    localStorage.setItem('tracktaps_timetable_grid', JSON.stringify(newData));
    
    // Auto-sync to calendar
    syncToCalendar(newData);
  };

  // Sync timetable to calendar
  const syncToCalendar = (timetable) => {
    const calendarEvents = [];
    Object.entries(timetable).forEach(([cellKey, subject]) => {
      const [dayIdx, timeSlot] = cellKey.split('-');
      const dayNum = parseInt(dayIdx);
      const dayName = days[dayNum];
      
      calendarEvents.push({
        id: cellKey,
        subject: subject.name,
        day: dayNum,
        dayName: dayName,
        time: timeSlot,
        color: subject.color || '#8b5cf6'
      });
    });
    
    localStorage.setItem('tracktaps_calendar_events', JSON.stringify(calendarEvents));
  };

  const handleCellClick = (dayIdx, timeSlot) => {
    setSelectedCell({ dayIdx, timeSlot });
    setShowModal(true);
  };

  const handleSelectSubject = (subject) => {
    if (!selectedCell) return;

    const cellKey = `${selectedCell.dayIdx}-${selectedCell.timeSlot}`;
    const newData = { ...timetableData };
    
    if (newData[cellKey]?.name === subject.name) {
      // Remove if same subject clicked
      delete newData[cellKey];
    } else {
      // Add/update subject
      newData[cellKey] = {
        name: subject.name,
        color: subject.color || '#8b5cf6',
        criteria: subject.criteria
      };
    }

    saveTimetable(newData);
    setShowModal(false);
    setSelectedCell(null);
    setSearchQuery('');
  };

  const handleRemoveSubject = (dayIdx, timeSlot) => {
    const cellKey = `${dayIdx}-${timeSlot}`;
    const newData = { ...timetableData };
    delete newData[cellKey];
    saveTimetable(newData);
  };

  const getCellContent = (dayIdx, timeSlot) => {
    const cellKey = `${dayIdx}-${timeSlot}`;
    return timetableData[cellKey];
  };

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="timetable-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc' }}>Weekly Schedule</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Click any cell to add a subject</p>
      </header>

      {/* Timetable Grid */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        borderRadius: '20px',
        padding: '24px',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(7, 1fr)`,
          gap: '12px',
          minWidth: '100%'
        }}>
          {/* Time column header */}
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '12px'
          }}>
            TIME
          </div>

          {/* Day headers */}
          {days.map((day, idx) => (
            <div
              key={`day-${idx}`}
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#a78bfa',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '12px',
                textAlign: 'center',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '12px'
              }}
            >
              {day}
            </div>
          ))}

          {/* Time slots and cells */}
          {timeSlots.map((timeSlot, timeIdx) => (
            <React.Fragment key={`time-${timeIdx}`}>
              {/* Time label */}
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#94a3b8',
                padding: '12px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {timeSlot}
              </div>

              {/* Cells for each day */}
              {days.map((day, dayIdx) => {
                const cellContent = getCellContent(dayIdx, timeSlot);
                return (
                  <motion.div
                    key={`cell-${dayIdx}-${timeIdx}`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => handleCellClick(dayIdx, timeSlot)}
                    style={{
                      background: cellContent
                        ? `linear-gradient(135deg, ${cellContent.color}20 0%, ${cellContent.color}10 100%)`
                        : 'rgba(255,255,255,0.02)',
                      border: cellContent
                        ? `2px solid ${cellContent.color}40`
                        : '1px solid rgba(139, 92, 246, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      minHeight: '80px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {cellContent ? (
                      <>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#f8fafc',
                          marginBottom: '4px'
                        }}>
                          {cellContent.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#cbd5e1',
                          marginBottom: '8px'
                        }}>
                          {timeSlot}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSubject(dayIdx, timeSlot);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#fca5a5',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Remove
                        </motion.button>
                      </>
                    ) : (
                      <div style={{
                        fontSize: '24px',
                        color: '#475569',
                        opacity: 0.5
                      }}>
                        +
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Subject Selection Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h3 style={{
              color: '#f8fafc',
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '8px'
            }}>
              Select Subject
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              marginBottom: '24px'
            }}>
              {days[selectedCell?.dayIdx]} at {selectedCell?.timeSlot}
            </p>

            {/* Search */}
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />

            {/* Subject List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSubjects.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#94a3b8'
                }}>
                  <p style={{ marginBottom: '8px' }}>No subjects found</p>
                  <p style={{ fontSize: '12px' }}>Add subjects in the Subjects page first</p>
                </div>
              ) : (
                filteredSubjects.map((subject, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, x: 4 }}
                    onClick={() => handleSelectSubject(subject)}
                    style={{
                      background: `linear-gradient(135deg, ${subject.color || '#8b5cf6'}20 0%, ${subject.color || '#8b5cf6'}10 100%)`,
                      border: `2px solid ${subject.color || '#8b5cf6'}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{
                        color: '#f8fafc',
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {subject.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8'
                      }}>
                        Target: {subject.criteria}%
                      </div>
                    </div>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: subject.color || '#8b5cf6',
                      borderRadius: '6px',
                      opacity: 0.7
                    }} />
                  </motion.button>
                ))
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#94a3b8',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '24px',
                transition: 'all 0.3s'
              }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Timetable;
