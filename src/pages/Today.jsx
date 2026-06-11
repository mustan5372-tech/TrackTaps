import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import AttendanceEngine from '../services/attendanceEngine';

function Today() {
  const navigate = useNavigate();
  
  // Store values and actions
  const todaySchedule = useAppStore(state => state.dashboardStats.todaySchedule) || [];
  const markAttendance = useAppStore(state => state.markAttendance);
  const clearAttendance = useAppStore(state => state.clearAttendance);
  const updateDashboardStats = useAppStore(state => state.updateDashboardStats);
  const dashboardStats = useAppStore(state => state.dashboardStats);
  const subjects = useAppStore(state => state.subjects) || [];
  const attendanceSettings = useAppStore(state => state.attendanceSettings);
  const role = useAppStore(state => state.role);
  const subscription = useAppStore(state => state.subscription);

  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  // Force re-calculation on mount
  useEffect(() => {
    updateDashboardStats();
  }, [updateDashboardStats]);

  // Bulk Actions
  const handleMarkAll = (state) => {
    if (todaySchedule.length === 0) return;
    
    todaySchedule.forEach(event => {
      markAttendance(event.id, state);
    });

    const stateLabel = state === 'present' ? 'Present' : state === 'absent' ? 'Absent' : 'Off';
    useAppStore.getState().showToast(`All classes marked as ${stateLabel}! ⚡`, 'success');
  };

  const handleClearAll = () => {
    if (todaySchedule.length === 0) return;
    
    todaySchedule.forEach(event => {
      clearAttendance(event.id);
    });
    
    useAppStore.getState().showToast(`All attendance logs cleared for today! ◯`, 'info');
  };

  // Date Formatting for Header
  const todayDate = new Date();
  const formattedDay = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = todayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Calculate Real-Time Stats for Today
  const totalClasses = todaySchedule.length;
  const markedClasses = todaySchedule.filter(e => e.attendanceState).length;
  const presentClasses = todaySchedule.filter(e => e.attendanceState === 'present').length;
  const absentClasses = todaySchedule.filter(e => e.attendanceState === 'absent').length;
  const offClasses = todaySchedule.filter(e => e.attendanceState === 'off').length;

  const completionRate = totalClasses > 0 ? Math.round((markedClasses / totalClasses) * 100) : 0;

  // Impact Prediction Calculation
  const currentOverall = dashboardStats.overallPercentage || 0;
  
  // Helper to forecast impact
  const getForecastStats = () => {
    if (totalClasses === 0) return { presentForecast: currentOverall, absentForecast: currentOverall };
    
    const totalPresent = dashboardStats.present || 0;
    const totalLogged = dashboardStats.total || 0;
    
    // Unmarked count
    const unmarkedCount = todaySchedule.filter(e => !e.attendanceState).length;

    // Best-case scenario (all remaining today are marked Present)
    const bestPresent = totalPresent + unmarkedCount + (totalClasses - markedClasses);
    const bestTotal = totalLogged + unmarkedCount + (totalClasses - markedClasses);
    const presentForecast = bestTotal > 0 ? Math.round((bestPresent / bestTotal) * 100) : currentOverall;

    // Worst-case scenario (all remaining today are marked Absent)
    const worstPresent = totalPresent;
    const worstTotal = totalLogged + unmarkedCount + (totalClasses - markedClasses);
    const absentForecast = worstTotal > 0 ? Math.round((worstPresent / worstTotal) * 100) : currentOverall;

    return { presentForecast, absentForecast };
  };

  const { presentForecast, absentForecast } = getForecastStats();

  return (
    <div className="main-content" style={{ paddingBottom: '120px', maxWidth: '800px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px' }}>
      
      {/* Back & Page Header */}
      <header style={{ marginBottom: '24px', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '100px',
              padding: '8px 20px',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            ← Dashboard
          </motion.button>
          <span style={{
            fontSize: '11px',
            background: 'var(--primary-glow)',
            color: 'var(--primary-light)',
            padding: '4px 12px',
            borderRadius: '100px',
            fontWeight: '900',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            border: '1px solid rgba(139, 92, 246, 0.15)'
          }}>
            Agenda Logger
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.1 }}>
          Today's <span style={{ color: 'var(--primary-light)' }}>Schedule</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', margin: 0 }}>
          {formattedDay}, {formattedDate}
        </p>
      </header>

      {todaySchedule.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Progress Overview Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-card" 
            style={{ 
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '28px',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Logging Progress</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>
                  {markedClasses} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>/ {totalClasses} classes logged</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: '800', padding: '4px 10px', borderRadius: '6px' }}>{presentClasses} P</span>
                <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontWeight: '800', padding: '4px 10px', borderRadius: '6px' }}>{absentClasses} A</span>
                {offClasses > 0 && <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontWeight: '800', padding: '4px 10px', borderRadius: '6px' }}>{offClasses} Off</span>}
              </div>
            </div>

            {/* Premium Progress Bar */}
            <div style={{ marginTop: '20px', position: 'relative' }}>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)',
                    borderRadius: '100px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>{completionRate}% completed</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Streak: {dashboardStats.streak} days 🔥</span>
              </div>
            </div>
          </motion.div>

          {/* Bulk Actions Menu */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="dashboard-card" 
            style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '28px',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)'
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>
              ⚡ Bulk Log Attendance
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMarkAll('present')}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '100px',
                  padding: '12px',
                  color: 'var(--success)',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>✓</span> All Present
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMarkAll('absent')}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '100px',
                  padding: '12px',
                  color: 'var(--danger)',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>✗</span> All Absent
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMarkAll('off')}
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '100px',
                  padding: '12px',
                  color: 'var(--warning)',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>◯</span> All Off
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearAll}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '100px',
                  padding: '12px',
                  color: 'var(--text-main)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>↺</span> Clear All
              </motion.button>
            </div>
          </motion.div>

          {/* Today's Classes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📚 Scheduled Classes Today
            </h3>
            
            {todaySchedule.map((event, idx) => {
              const attendance = event.attendanceState;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="dashboard-card"
                  style={{
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '28px',
                    background: attendance === 'present' 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.06) 100%)' 
                      : attendance === 'absent' 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.06) 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    boxShadow: attendance === 'present'
                      ? '0 8px 30px rgba(16, 185, 129, 0.06)'
                      : attendance === 'absent'
                      ? '0 8px 30px rgba(239, 68, 68, 0.06)'
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        {event.subjectName}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🕒</span> {event.timeSlot}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {attendance ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                          background: attendance === 'present' ? 'rgba(16, 185, 129, 0.15)' : attendance === 'absent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: attendance === 'present' ? 'var(--success)' : attendance === 'absent' ? 'var(--danger)' : 'var(--warning)',
                          border: `1px solid ${attendance === 'present' ? 'rgba(16, 185, 129, 0.3)' : attendance === 'absent' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {attendance}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-dim)',
                          border: '1px solid var(--border)'
                        }}>
                          Not Logged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Status Switcher */}
                  <div style={{ 
                    display: 'flex', 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '6px', 
                    borderRadius: '100px', 
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    alignItems: 'center'
                  }}>
                    {[
                      { state: 'present', label: 'Present', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
                      { state: 'absent', label: 'Absent', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
                      { state: 'off', label: 'Off', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' }
                    ].map((opt) => {
                      const isSelected = attendance === opt.state;
                      return (
                        <button
                          key={opt.state}
                          onClick={() => markAttendance(event.id, opt.state)}
                          style={{
                            flex: 1,
                            background: isSelected ? opt.bg : 'transparent',
                            border: isSelected ? `1px solid ${opt.border}` : '1px solid transparent',
                            borderRadius: '100px',
                            color: isSelected ? opt.color : 'var(--text-dim)',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {isSelected && <span style={{ fontSize: '10px' }}>●</span>}
                          {opt.label}
                        </button>
                      );
                    })}

                    {attendance && (
                      <button
                        onClick={() => clearAttendance(event.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          marginLeft: '4px'
                        }}
                        title="Clear log"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Daily Attendance Impact Advisor */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="dashboard-card" 
            style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)', 
              borderRadius: '28px',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#f59e0b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Daily Impact Advisor
              </h4>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Logging today's classes alters your global attendance score dynamically. Review predictions below to make smart skip decisions.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>If Perfect Day (All Present)</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--success)' }}>
                  {presentForecast}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  {presentForecast > currentOverall ? `+${(presentForecast - currentOverall).toFixed(1)}% boost` : 'maintain score'}
                </span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>If Worst Day (All Absent)</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--danger)' }}>
                  {absentForecast}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                  {absentForecast < currentOverall ? `-${(currentOverall - absentForecast).toFixed(1)}% drop` : 'maintain score'}
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      ) : (
        /* Empty State */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="dashboard-card" 
          style={{ 
            padding: '48px 24px', 
            textAlign: 'center', 
            background: 'var(--surface-glass)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            marginTop: '20px'
          }}
        >
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }}>🏖️</span>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            No Classes Scheduled Today
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Enjoy your free day! There are no events loaded in your timetable for today. Go make some premium plans or review insights.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/timetable')}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px var(--primary-glow)'
              }}
            >
              Configure Timetable 🕒
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/insights')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: 'var(--text-main)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              View AI Insights 📈
            </motion.button>
          </div>
        </motion.div>
      )}

    </div>
  );
}

export default Today;
