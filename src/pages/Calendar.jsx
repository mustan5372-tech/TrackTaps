import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AttendanceEngine from '../services/attendanceEngine';
import useAppStore from '../store/appStore';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  
  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]); // Array of dateStr
  const [selectionAnchor, setSelectionAnchor] = useState(null);

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
    generateInsights,
    semesterSettings,
    setSemesterSettings,
    addHoliday,
    removeHoliday,
    addExamPeriod,
    removeExamPeriod,
    addWorkingSaturday,
    removeWorkingSaturday
  } = useAppStore();

  // Sync on mount
  useEffect(() => {
    updateDashboardStats();
    updateSubjectStats();
    generateInsights();
    try {
      import('../services/analyticsService').then(m => m.default.trackFeatureUse('calendar')).catch(() => {});
    } catch (e) {}
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

    if (isSelectMode) {
      toggleDateSelection(dateStr);
    } else {
      setSelectedDate(dateStr);
      setShowModal(true);
    }
  };

  const handleDateLongPress = (day) => {
    const dateStr = AttendanceEngine.formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedDates([dateStr]);
    }
  };

  const toggleDateSelection = (dateStr) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  const handleBatchAction = (state) => {
    if (selectedDates.length === 0) return;
    
    selectedDates.forEach(date => {
      markAllForDate(date, state);
    });
    
    setIsSelectMode(false);
    setSelectedDates([]);
    updateDashboardStats();
    updateSubjectStats();
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
  
  // Adjust offset for Monday-start calendar (0=Mon, 6=Sun)
  const offset = (firstDay + 6) % 7;

  for (let i = 0; i < offset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const eventsForSelectedDate = selectedDate ? AttendanceEngine.getEventsForDate(selectedDate, calendarEvents) : [];

  // 📝 DEBUG LOGGING FOR HISTORICAL ATTENDANCE (AS REQUESTED)
  if (selectedDate) {
    const semesterStart = semesterSettings?.startDate;
    const semesterEnd = semesterSettings?.endDate;
    const weekday = AttendanceEngine.getDayName(selectedDate);
    const holidayStatus = semesterSettings?.holidays?.some(h => h.date === selectedDate);
    
    console.log("🔍 [HistoricalAttendanceDebug]", {
      selectedDate,
      semesterStart,
      semesterEnd,
      weekday,
      holidayStatus,
      eventCount: eventsForSelectedDate.length,
      shouldShowClass: eventsForSelectedDate.length > 0
    });
  }

  return (
    <div className="calendar-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @media (max-width: 768px) {
          .calendar-view {
            padding: 8px 0 120px 0 !important;
            gap: 16px !important;
          }
          .view-header {
            padding: 24px 20px !important;
            background: var(--bg-primary) !important;
            border-bottom: 1px solid var(--border) !important;
            margin-bottom: 0px !important;
          }
          .calendar-grid-container {
            padding: 16px 8px !important;
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            background: transparent !important;
          }
          .calendar-weekday-headers {
            gap: 4px !important;
            margin-bottom: 8px !important;
          }
          .calendar-weekday-headers > div {
            padding: 4px !important;
            font-size: 10px !important;
          }
          .calendar-days-grid {
            gap: 4px !important;
          }
          .calendar-day-cell {
            padding: 8px 4px !important;
            min-height: 80px !important;
            border-radius: 12px !important;
          }
          .calendar-day-number {
            font-size: 16px !important;
          }
          .calendar-day-label {
            font-size: 8px !important;
            line-height: 1.1 !important;
          }
          .calendar-day-count {
            font-size: 8px !important;
          }
          .multi-select-toolbar {
             position: fixed !important;
             bottom: 100px !important;
             left: 16px !important;
             right: 16px !important;
             padding: 16px !important;
             flex-direction: column !important;
             gap: 16px !important;
             background: rgba(15, 23, 42, 0.95) !important;
             backdrop-filter: blur(20px) !important;
          }
          .batch-actions {
             display: grid !important;
             grid-template-columns: repeat(4, 1fr) !important;
             gap: 8px !important;
             width: 100% !important;
          }
          .hide-mobile {
             display: none !important;
          }
        }
      `}</style>
      {/* Header */}
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>{monthYear}</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => window.location.href = '/ai-import'}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid var(--primary-glow)',
              color: 'var(--primary-light)',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
            }}
          >
            <span>✨</span> <span className="hide-mobile">AI Import</span>
          </button>
          <button
            onClick={() => setShowSemesterModal(true)}
            style={{
              background: 'var(--surface-glass)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🎓</span> <span className="hide-mobile">Semester Setup</span>
          </button>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={handlePrevMonth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ←
            </button>
            <button
              onClick={handleNextMonth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              →
            </button>
          </div>
        </div>
      </header>

      {/* User Guidance Banner */}
      {(!semesterSettings.startDate || !semesterSettings.endDate) && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '500' }}>
              Setup semester dates in Calendar to enable bunk predictions and planned class calculations.
            </span>
          </div>
          <button 
            onClick={() => setShowSemesterModal(true)}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Configure Now
          </button>
        </div>
      )}

      {/* Multi-select Toolbar */}
      {isSelectMode && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="multi-select-toolbar"
          style={{
            background: 'var(--primary-glow)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '16px',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 50
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--primary-light)', fontWeight: '800', fontSize: '14px' }}>
              {selectedDates.length} Days Selected
            </span>
            <button 
              onClick={() => { setIsSelectMode(false); setSelectedDates([]); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
          <div className="batch-actions" style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleBatchAction('present')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Present</button>
            <button onClick={() => handleBatchAction('absent')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Absent</button>
            <button onClick={() => handleBatchAction('off')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Off</button>
            <button onClick={() => handleBatchAction(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Clear</button>
          </div>
        </motion.div>
      )}

      {/* Calendar Grid */}
      <div className="calendar-grid-container" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        borderRadius: '20px',
        padding: '24px'
      }}>
        {/* Weekday Headers */}
        <div className="calendar-weekday-headers" style={{
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
                color: 'var(--primary-light)',
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
        <div className="calendar-days-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px'
        }}>
          {days.map((day, idx) => {
            const dateStr = day ? AttendanceEngine.formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)) : null;
            const visualState = day ? getDateVisualState(day) : null;
            const isToday = day && AttendanceEngine.isToday(dateStr);
            const isSelected = selectedDates.includes(dateStr);

            return (
              <motion.div
                key={idx}
                className="calendar-day-cell"
                onMouseDown={() => {
                  const timer = setTimeout(() => handleDateLongPress(day), 500);
                  window.datePressTimer = timer;
                }}
                onMouseUp={() => clearTimeout(window.datePressTimer)}
                onTouchStart={() => {
                  const timer = setTimeout(() => handleDateLongPress(day), 500);
                  window.datePressTimer = timer;
                }}
                onTouchEnd={() => clearTimeout(window.datePressTimer)}
                onClick={() => day && handleDateClick(day)}
                style={{
                  background: isSelected 
                    ? 'var(--primary-glow)' 
                    : visualState?.color ? `${visualState.color}15` : 'var(--surface-bright)',
                  border: isSelected
                    ? '2px solid var(--primary-light)'
                    : isToday
                    ? '2px solid var(--primary-light)'
                    : visualState?.color
                    ? `2px solid ${visualState.color}40`
                    : '1px solid var(--border)',
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
                  overflow: 'hidden',
                  boxShadow: isSelected ? '0 0 15px var(--primary-glow)' : 'none'
                }}
              >
                {day && isSelected && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '14px' }}>✅</div>
                )}
                {day && (
                  <>
                    <div className="calendar-day-number" style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: 'var(--text-main)',
                      marginBottom: '4px'
                    }}>
                      {day}
                    </div>
                    {visualState && visualState.type !== 'empty' && (
                      <div className="calendar-day-label" style={{
                        fontSize: '11px',
                        color: visualState.color,
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {visualState.label}
                      </div>
                    )}
                    {getEventsForDate(day).length > 0 && (
                      <div className="calendar-day-count" style={{
                        fontSize: '10px',
                        color: 'var(--text-dim)',
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
        background: 'var(--primary-glow)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '3px' }} />
          <span>Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '3px' }} />
          <span>Absent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }} />
          <span>Off</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--text-dim)', borderRadius: '3px' }} />
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
              background: 'linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-primary) 100%)',
              border: '1px solid var(--primary-glow)',
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
                color: 'var(--text-main)',
                fontSize: '22px',
                fontWeight: '800',
                marginBottom: '8px'
              }}>
                {AttendanceEngine.formatDateForDisplay(selectedDate)}
              </h3>
              <p style={{
                color: 'var(--text-dim)',
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
                background: 'var(--primary-glow)',
                borderRadius: '12px',
                border: '1px solid var(--primary-glow)'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMarkAllForDate('present')}
                  style={{
                    background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)',
                    color: 'var(--text-main)',
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
                    color: 'var(--text-main)',
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
                    background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                    color: 'var(--text-main)',
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
                          color: 'var(--text-main)',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>
                          {event.subjectName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-dim)'
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
                            color: state === 'present' ? 'var(--text-main)' : '#10b981',
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
                            color: state === 'absent' ? 'var(--text-main)' : '#ef4444',
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
                            background: state === 'off' ? 'var(--primary)' : 'var(--primary-glow)',
                            color: state === 'off' ? 'var(--text-main)' : 'var(--primary-light)',
                            border: `1px solid ${state === 'off' ? 'var(--primary)' : 'var(--primary-glow)'}`,
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
                padding: '40px 24px',
                color: 'var(--text-dim)',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px dashed var(--border)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.8 }}>
                  {selectedDate < semesterSettings.startDate || selectedDate > semesterSettings.endDate ? '📅' : '✨'}
                </div>
                <p style={{ marginBottom: '8px', color: 'var(--text-main)', fontWeight: '700', fontSize: '15px' }}>
                  {selectedDate < semesterSettings.startDate || selectedDate > semesterSettings.endDate 
                    ? "Outside Semester Range" 
                    : "No classes scheduled"}
                </p>
                <p style={{ fontSize: '13px', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
                  {selectedDate < semesterSettings.startDate || selectedDate > semesterSettings.endDate 
                    ? "Update your Semester Start/End dates in Semester Setup to unlock tracking."
                    : "Add subjects to your timetable to see them appear here."}
                </p>
              </div>
            )}

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--primary-glow)',
                color: 'var(--text-dim)',
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
      {/* Semester Setup Modal */}
      {showSemesterModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSemesterModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(8px)',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid var(--primary-glow)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', margin: 0 }}>🎓 Semester Intelligence</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '4px 0 0 0' }}>Configure your academic calendar for accurate predictions.</p>
              </div>
              <button onClick={() => setShowSemesterModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-dim)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="setting-item">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--primary-light)', marginBottom: '8px' }}>Semester Start Date</label>
                <input 
                  type="date" 
                  value={semesterSettings?.startDate} 
                  onChange={(e) => setSemesterSettings({ startDate: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--primary-glow)', color: 'var(--text-main)', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              <div className="setting-item">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--primary-light)', marginBottom: '8px' }}>Semester End Date</label>
                <input 
                  type="date" 
                  value={semesterSettings?.endDate} 
                  onChange={(e) => setSemesterSettings({ endDate: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--primary-glow)', color: 'var(--text-main)', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
              <div className="setting-item">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--primary-light)', marginBottom: '8px' }}>Attendance Target (%)</label>
                <input 
                  type="number" 
                  value={semesterSettings?.minRequirement} 
                  onChange={(e) => setSemesterSettings({ minRequirement: parseInt(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--primary-glow)', color: 'var(--text-main)', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Holidays */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>🏝️ Holidays & Breaks</h4>
                <button 
                  onClick={() => {
                    const name = prompt("Holiday name:");
                    const date = prompt("Date (YYYY-MM-DD):");
                    if (name && date) addHoliday({ name, date });
                  }}
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  + Add Holiday
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {!semesterSettings?.holidays || semesterSettings.holidays.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No holidays added yet.</p>
                ) : semesterSettings.holidays.map(h => (
                  <div key={h.id} style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--primary-glow)', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{h.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{h.date}</span>
                    <button onClick={() => removeHoliday(h.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exams */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>📝 Exam Periods</h4>
                <button 
                  onClick={() => {
                    const name = prompt("Exam name:");
                    const start = prompt("Start Date (YYYY-MM-DD):");
                    const end = prompt("End Date (YYYY-MM-DD):");
                    if (name && start && end) addExamPeriod({ name, startDate: start, endDate: end });
                  }}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  + Add Exam
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {!semesterSettings?.examPeriods || semesterSettings.examPeriods.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No exams defined.</p>
                ) : semesterSettings.examPeriods.map(e => (
                  <div key={e.id} style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #ef444450', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#fca5a5' }}>{e.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{e.startDate} to {e.endDate}</span>
                    <button onClick={() => removeExamPeriod(e.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSemesterModal(false)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #a855f7 0%, var(--primary) 100%)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px var(--primary-glow)'
              }}
            >
              Save Academic Calendar
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Calendar;
