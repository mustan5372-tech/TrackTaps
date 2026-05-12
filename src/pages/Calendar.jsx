import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AttendanceEngine from '../services/attendanceEngine';
import useAppStore from '../store/appStore';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Get data from Zustand store
  const {
    calendarEvents,
    attendanceData,
    subjects,
    markAttendance,
    markAllForDate,
    clearAttendance,
    updateDashboardStats,
    updateSubjectStats,
    generateInsights
  } = useAppStore();

  // Sync on mount
  useEffect(() => {
    updateDashboardStats();
    updateSubjectStats();
    generateInsights();
  }, [updateDashboardStats, updateSubjectStats, generateInsights]);

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
    const dateStr = AttendanceEngine.formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    setSelectedDate(dateStr);
    setShowModal(true);
  };

  const handleMarkAttendance = (eventId, state) => {
    markAttendance(eventId, state);
  };

  const handleMarkAllForDate = (state) => {
    markAllForDate(selectedDate, state);
  };

  const handleClearAttendance = (eventId) => {
    clearAttendance(eventId);
  };

  const handleClearAllForDate = () => {
    markAllForDate(selectedDate, null);
  };

  const getEventsForDate = (day) => {
    const dateStr = AttendanceEngine.formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    return AttendanceEngine.getEventsForDate(dateStr, calendarEvents);
  };

  const getDateVisualState = (day) => {
    const dateStr = AttendanceEngine.formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    return AttendanceEngine.getDateVisualState(dateStr, calendarEvents, attendanceData);
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

  const eventsForSelectedDate = selectedDate ? AttendanceEngine.getEventsForDate(selectedDate, calendarEvents) : [];

  return (
    <div className="calendar-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc' }}>{monthYear}</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            Next →
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        borderRadius: '20px',
        padding: '24px'
      }}>
        {/* Weekday Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '700',
                color: '#a78bfa',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '12px'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px'
        }}>
          {days.map((day, idx) => {
            const visualState = day ? getDateVisualState(day) : null;
            const isToday = day && AttendanceEngine.isToday(
              AttendanceEngine.formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
            );

            return (
              <motion.div
                key={idx}
                whileHover={day ? { scale: 1.05 } : {}}
                onClick={() => day && handleDateClick(day)}
                style={{
                  background: visualState?.color ? `${visualState.color}15` : 'rgba(255,255,255,0.02)',
                  border: isToday
                    ? '2px solid #a78bfa'
                    : visualState?.color
                    ? `2px solid ${visualState.color}40`
                    : '1px solid rgba(139, 92, 246, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '100px',
                  cursor: day ? 'pointer' : 'default',
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
                {day && (
                  <>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: '#f8fafc',
                      marginBottom: '4px'
                    }}>
                      {day}
                    </div>
                    {visualState && visualState.type !== 'empty' && (
                      <div style={{
                        fontSize: '11px',
                        color: visualState.color,
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {visualState.label}
                      </div>
                    )}
                    {getEventsForDate(day).length > 0 && (
                      <div style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        marginTop: '4px'
                      }}>
                        {getEventsForDate(day).length} class{getEventsForDate(day).length !== 1 ? 'es' : ''}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '16px',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }} />
          <span>Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }} />
          <span>Absent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <div style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '3px' }} />
          <span>Off</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <div style={{ width: '12px', height: '12px', background: '#94a3b8', borderRadius: '3px' }} />
          <span>Unmarked</span>
        </div>
      </div>

      {/* Attendance Modal */}
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
            backdropFilter: 'blur(4px)',
            padding: '16px'
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: '#f8fafc',
                fontSize: '22px',
                fontWeight: '800',
                marginBottom: '8px'
              }}>
                {AttendanceEngine.formatDateForDisplay(selectedDate)}
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '13px'
              }}>
                {AttendanceEngine.getDayName(selectedDate)}
              </p>
            </div>

            {/* Bulk Controls */}
            {eventsForSelectedDate.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMarkAllForDate('present')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#f8fafc',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.3s'
                  }}
                >
                  ✓ All Present
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMarkAllForDate('absent')}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#f8fafc',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.3s'
                  }}
                >
                  ✗ All Absent
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMarkAllForDate('off')}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#f8fafc',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.3s'
                  }}
                >
                  ◯ All Off
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleClearAllForDate}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.3s'
                  }}
                >
                  Clear All
                </motion.button>
              </div>
            )}

            {/* Events List */}
            {eventsForSelectedDate.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {eventsForSelectedDate.map((event) => {
                  const state = AttendanceEngine.getAttendanceState(event.id, attendanceData);
                  const color = AttendanceEngine.getStateColor(state);

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      style={{
                        background: `${color}15`,
                        border: `1px solid ${color}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#f8fafc',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>
                          {event.subjectName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#94a3b8'
                        }}>
                          {event.timeSlot} • {event.dayName}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end'
                      }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleMarkAttendance(event.id, 'present')}
                          style={{
                            background: state === 'present' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                            color: state === 'present' ? '#f8fafc' : '#10b981',
                            border: `1px solid ${state === 'present' ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ✓
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleMarkAttendance(event.id, 'absent')}
                          style={{
                            background: state === 'absent' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                            color: state === 'absent' ? '#f8fafc' : '#ef4444',
                            border: `1px solid ${state === 'absent' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ✗
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleMarkAttendance(event.id, 'off')}
                          style={{
                            background: state === 'off' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.1)',
                            color: state === 'off' ? '#f8fafc' : '#a78bfa',
                            border: `1px solid ${state === 'off' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)'}`,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ◯
                        </motion.button>
                        {state && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleClearAttendance(event.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#fca5a5',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Clear
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#94a3b8'
              }}>
                <p style={{ marginBottom: '8px' }}>No classes scheduled for this date</p>
                <p style={{ fontSize: '12px' }}>Add subjects to your timetable to see them here</p>
              </div>
            )}

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
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
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Calendar;
