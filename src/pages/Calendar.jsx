import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AttendanceEngine from '../services/attendanceEngine';
import useAppStore from '../store/appStore';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDate, setSelectedDate] = useState('2026-05-25');
  const [showModal, setShowModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  
  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]); // Array of dateStr
  const [selectionAnchor, setSelectionAnchor] = useState(null);

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const selectedDateDetailRef = useRef(null);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    toggleExamConductClasses,
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

  const handleDateClick = (day, e) => {
    const dateStr = AttendanceEngine.formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );

    const isCtrlPressed = e && (e.ctrlKey || e.metaKey);

    if (isCtrlPressed) {
      if (!isSelectMode) {
        setIsSelectMode(true);
        setSelectedDates([dateStr]);
      } else {
        toggleDateSelection(dateStr);
      }
    } else if (isSelectMode) {
      toggleDateSelection(dateStr);
    } else {
      setSelectedDate(dateStr);
      // Auto-scroll to the detail section after a short delay for render
      setTimeout(() => {
        if (selectedDateDetailRef.current) {
          selectedDateDetailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    }
  };

  const handleDateLongPress = (day) => {
    // Only trigger long press multi-select on mobile touch devices
    if (!isMobileDevice) return;

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
    
    const holiday = semesterSettings?.holidays?.find(h => h.date === dateStr);
    if (holiday) {
      return { type: 'holiday', color: '#c084fc', label: holiday.name || 'Holiday' };
    }
    
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
    <div className="calendar-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @media (max-width: 768px) {
          .calendar-view {
            padding: 8px 0 200px 0 !important;
            gap: 16px !important;
          }
          .view-header {
            padding: 24px 20px 8px 20px !important;
            background: var(--bg-primary) !important;
            margin-bottom: 0px !important;
          }
          .calendar-grid-container {
            padding: 16px 12px !important;
            border-radius: 20px !important;
            background: transparent !important;
            margin: 0 8px !important;
          }
          .calendar-weekday-headers {
            gap: 6px !important;
            margin-bottom: 8px !important;
          }
          .calendar-weekday-headers > div {
            font-size: 10px !important;
            padding: 4px 0 !important;
          }
          .calendar-days-grid {
            gap: 8px !important;
          }
          .calendar-day-cell {
            aspect-ratio: 1/1 !important;
            border-radius: 50% !important;
            padding: 4px !important;
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
        }
      `}</style>

      {/* Modern Uncluttered Header */}
      <header className="view-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 20px 8px 20px',
        maxWidth: '800px',
        width: 'calc(100% - 40px)',
        margin: '0 auto 8px auto'
      }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{monthYear}</h2>
        
        {/* Month Pagination Control */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(255,255,255,0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            →
          </button>
        </div>
      </header>

      {/* Relocated descriptive setup options in the calendar view for crystal-clear readability */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '0 20px',
        maxWidth: '800px',
        width: 'calc(100% - 40px)',
        margin: '0 auto 8px auto'
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/ai-import'}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1.5px solid var(--primary-glow)',
            color: 'var(--primary-light)',
            padding: '12px 16px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.15)'
          }}
        >
          <span>✨ AI Import Timetable</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSemesterModal(true)}
          style={{
            background: 'var(--surface-glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-main)',
            padding: '12px 16px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span>🎓 Semester Setup</span>
        </motion.button>
      </div>

      {/* Dynamic Selector Assistance Tip */}
      <div style={{
        textAlign: 'center',
        padding: '0 20px',
        maxWidth: '800px',
        width: 'calc(100% - 40px)',
        margin: '4px auto 12px auto'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--primary-light)',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          padding: '8px 18px',
          borderRadius: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
        }}>
          💡 Tip: {isMobileDevice ? 'Long-press a day to select multiple days' : 'Hold Ctrl + Click to select multiple days'}
        </span>
      </div>

      {/* User Guidance Banner */}
      {(!semesterSettings.startDate || !semesterSettings.endDate) && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '16px',
          padding: '16px 20px',
          maxWidth: '800px',
          width: 'calc(100% - 40px)',
          margin: '0 auto 16px auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
              Configure semester bounds to unlock automated attendance projections.
            </span>
          </div>
          <button 
            onClick={() => setShowSemesterModal(true)}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Configure
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
            maxWidth: '800px',
            width: 'calc(100% - 40px)',
            margin: '0 auto 16px auto',
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

      {/* Calendar Grid Container */}
      <div className="calendar-grid-container" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        borderRadius: '24px',
        padding: '20px',
        maxWidth: '800px',
        width: 'calc(100% - 40px)',
        margin: '0 auto 16px auto'
      }}>
        {/* Weekday Headers */}
        <div className="calendar-weekday-headers" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--primary-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '6px 0'
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
          gap: '8px'
        }}>
          {days.map((day, idx) => {
            const dateStr = day ? AttendanceEngine.formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)) : null;
            const visualState = day ? getDateVisualState(day) : null;
            const isToday = day && AttendanceEngine.isToday(dateStr);
            const isSelected = day && selectedDate === dateStr;
            const isMultiSelected = day && isSelectMode && selectedDates.includes(dateStr);

            // Render empty cells for offsets with no borders to keep it perfectly clean
            if (!day) {
              return (
                <div 
                  key={idx} 
                  style={{ 
                    aspectRatio: '1', 
                    background: 'transparent', 
                    border: 'none' 
                  }} 
                />
              );
            }

            const dateEvents = getEventsForDate(day);
            const hasClasses = dateEvents.length > 0;

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
                onClick={(e) => handleDateClick(day, e)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)'
                    : isMultiSelected
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)'
                    : isToday
                    ? 'rgba(139, 92, 246, 0.15)'
                    : visualState?.color
                    ? `${visualState.color}15`
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected
                    ? '2px solid var(--primary-light)'
                    : isMultiSelected
                    ? '2.5px solid #a855f7'
                    : isToday
                    ? '2px dashed var(--primary-light)'
                    : visualState?.color
                    ? `2.5px solid ${visualState.color}`
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isSelected 
                    ? '0 0 15px var(--primary-glow)' 
                    : isMultiSelected
                    ? '0 0 12px rgba(168, 85, 247, 0.5)'
                    : visualState?.color
                    ? `0 0 10px ${visualState.color}25`
                    : 'none'
                }}
              >
                {/* Floating check badge for multi-select */}
                {isMultiSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '1.5px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '900',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                    zIndex: 5
                  }}>
                    ✓
                  </div>
                )}

                <span style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: (isSelected || isMultiSelected) ? 'white' : 'var(--text-main)',
                  lineHeight: 1
                }}>
                  {day}
                </span>

                {/* Elegant glowing class status indicator dots */}
                {hasClasses && !isSelected && !isMultiSelected && (
                  <div style={{
                    display: 'flex',
                    gap: '3px',
                    marginTop: '4px',
                    justifyContent: 'center'
                  }}>
                    {dateEvents.slice(0, 3).map((event) => {
                      const state = AttendanceEngine.getAttendanceState(event.id, attendanceData);
                      const dotColor = AttendanceEngine.getStateColor(state);
                      return (
                        <div 
                          key={event.id}
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: dotColor,
                            boxShadow: `0 0 4px ${dotColor}`
                          }}
                        />
                      );
                    })}
                    {dateEvents.length > 3 && (
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--text-dim)'
                      }} />
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Attendance Manager for Highlighted Date */}
      {selectedDate && (
        <motion.div
          ref={selectedDateDetailRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-glass) 100%)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '24px',
            maxWidth: '800px',
            width: 'calc(100% - 40px)',
            margin: '0 auto 24px auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                {AttendanceEngine.formatDateForDisplay(selectedDate)}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                {AttendanceEngine.getDayName(selectedDate)} • Daily Schedule Tracker
              </p>
            </div>
            
            {/* Bulk options */}
            {selectedDate && AttendanceEngine.getEventsForDate(selectedDate, calendarEvents).length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleMarkAllForDate('present')}
                  style={{ background: 'rgba(16, 185, 129, 0.15)', border: 'none', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  ✓ All Present
                </button>
                <button
                  onClick={() => handleMarkAllForDate('absent')}
                  style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  ✗ All Absent
                </button>
              </div>
            )}
          </div>

          {/* Events List */}
          {selectedDate && AttendanceEngine.getEventsForDate(selectedDate, calendarEvents).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AttendanceEngine.getEventsForDate(selectedDate, calendarEvents).map((event) => {
                const state = AttendanceEngine.getAttendanceState(event.id, attendanceData);
                const color = AttendanceEngine.getStateColor(state);

                return (
                  <div
                    key={event.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${state ? `${color}40` : 'var(--border)'}`,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>
                        {event.subjectName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {event.timeSlot}
                      </div>
                    </div>

                    {/* Compact Tracker Buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleMarkAttendance(event.id, 'present')}
                        style={{
                          background: state === 'present' ? '#10b981' : 'rgba(16, 185, 129, 0.05)',
                          color: state === 'present' ? 'white' : '#10b981',
                          border: `1px solid ${state === 'present' ? '#10b981' : 'rgba(16, 185, 129, 0.2)'}`,
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(event.id, 'absent')}
                        style={{
                          background: state === 'absent' ? '#ef4444' : 'rgba(239, 68, 68, 0.05)',
                          color: state === 'absent' ? 'white' : '#ef4444',
                          border: `1px solid ${state === 'absent' ? '#ef4444' : 'rgba(239, 68, 68, 0.2)'}`,
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✗
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(event.id, 'off')}
                        style={{
                          background: state === 'off' ? 'var(--primary)' : 'rgba(139, 92, 246, 0.05)',
                          color: state === 'off' ? 'white' : 'var(--primary-light)',
                          border: `1px solid ${state === 'off' ? 'var(--primary)' : 'rgba(139, 92, 246, 0.2)'}`,
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        ◯
                      </button>
                      {state && (
                        <button
                          onClick={() => handleClearAttendance(event.id)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-dim)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '0 8px',
                            height: '32px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (() => {
            const isHoliday = semesterSettings?.holidays?.find(h => h.date === selectedDate);
            if (isHoliday) {
              return (
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--text-dim)',
                  background: 'rgba(192, 132, 252, 0.05)',
                  borderRadius: '16px',
                  border: '1.5px dashed #c084fc'
                }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎉</span>
                  <p style={{ margin: '0 0 6px 0', color: '#c084fc', fontWeight: '800', fontSize: '16px' }}>
                    {isHoliday.name}
                  </p>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    Official Academic Holiday • Enjoy your day off!
                  </p>
                </div>
              );
            }
            return (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                color: 'var(--text-dim)',
                background: 'rgba(255, 255, 255, 0.01)',
                borderRadius: '16px',
                border: '1px dashed var(--border)'
              }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>
                  {selectedDate < semesterSettings.startDate || selectedDate > semesterSettings.endDate ? '📅' : '✨'}
                </span>
                <p style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>
                  {selectedDate < semesterSettings.startDate || selectedDate > semesterSettings.endDate 
                    ? "Outside Semester Range" 
                    : "No classes scheduled"}
                </p>
                <p style={{ fontSize: '12px', margin: 0, lineHeight: 1.4 }}>
                  {selectedDate < semesterSettings.startDate || selectedDate > semesterSettings.endDate 
                    ? "Adjust semester bounds in Semester Setup above."
                    : "Enjoy your free day, or customize your timetable settings."}
                </p>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '16px',
        margin: '0 20px 20px 20px',
        background: 'var(--primary-glow)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%' }} />
          <span>Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%' }} />
          <span>Absent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }} />
          <span>Off</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!semesterSettings?.examPeriods || semesterSettings.examPeriods.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No exams defined.</p>
                ) : semesterSettings.examPeriods.map(e => (
                  <div 
                    key={e.id} 
                    style={{ 
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)', 
                      border: '1px solid rgba(255, 255, 255, 0.05)', 
                      padding: '12px 16px', 
                      borderRadius: '14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{e.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📅 {AttendanceEngine.formatDateForDisplay(e.startDate)} to {AttendanceEngine.formatDateForDisplay(e.endDate)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => toggleExamConductClasses(e.id)}
                        style={{
                          background: e.conductClasses ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${e.conductClasses ? 'var(--success)' : '#ef444450'}`,
                          color: e.conductClasses ? 'var(--success)' : '#fca5a5',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: e.conductClasses ? '0 0 8px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                      >
                        <span>{e.conductClasses ? '📚 Classes Conducted' : '🛑 Classes Suspended'}</span>
                        <span style={{ fontSize: '9px', opacity: 0.6 }}>(Toggle)</span>
                      </button>

                      <button 
                        onClick={() => removeExamPeriod(e.id)} 
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.03)', 
                          border: '1px solid rgba(255, 255, 255, 0.05)', 
                          color: '#ef4444', 
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          transition: 'all 0.2s'
                        }}
                      >
                        ×
                      </button>
                    </div>
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
