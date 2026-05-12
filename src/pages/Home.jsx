import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import ContactUs from '../components/ContactUs';

const BackgroundOrbs = () => (
  <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />
    <motion.div
      animate={{
        x: [0, -80, 0],
        y: [0, 100, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }}
    />
  </div>
);

function Home() {
  const {
    dashboardStats,
    insights,
    getSafeSubjects,
    getCriticalSubjects,
    getTodaySchedule,
    fullSync
  } = useAppStore();

  // Sync on mount and when data changes
  useEffect(() => {
    fullSync();
  }, [fullSync]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const shortcuts = [
    { icon: '📅', title: 'Calendar', path: '/calendar' },
    { icon: '🕒', title: 'Timetable', path: '/timetable' },
    { icon: '📚', title: 'Subjects', path: '/subjects' },
    { icon: '💡', title: 'Insights', path: '/insights' },
  ];

  return (
    <motion.div 
      className="home-view" 
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 1 }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <BackgroundOrbs />

      {/* Hero Section */}
      <motion.section 
        className="dashboard-hero" 
        variants={itemVariants}
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '20px',
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '40px'
        }}
      >
        <div className="hero-welcome">
          <motion.h2 variants={textVariants} id="hero-greeting" style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>Good Afternoon,</motion.h2>
          <motion.p variants={textVariants} id="hero-subtitle" style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '16px' }}>Ready to crush your goals today?</motion.p>
          <motion.div variants={textVariants} id="hero-date" style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </motion.div>
        </div>
        <motion.div 
          variants={textVariants}
          className="hero-overall-stats" 
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            minWidth: '200px'
          }}
        >
          <span className="overall-percentage" id="hero-overall-perc" style={{ fontSize: '48px', fontWeight: '800', color: '#a78bfa', display: 'block' }}>{dashboardStats.overallPercentage}%</span>
          <span className="overall-label" style={{ fontSize: '14px', color: '#94a3b8', display: 'block', marginTop: '8px' }}>Attendance Score</span>
          <div id="overall-trend" style={{ marginTop: '12px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↑ 2.4% from last week</div>
        </motion.div>
      </motion.section>

      {/* Quick Stats Row */}
      <motion.div 
        className="quick-stats-row" 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}
      >
        {[
          { id: 'stat-total-subjects', value: dashboardStats.totalSubjects, label: 'Total Subjects', color: '#a78bfa' },
          { id: 'stat-streak', value: dashboardStats.streak, label: '🔥 Day Streak', color: '#f59e0b' },
          { id: 'stat-safe-subjects', value: dashboardStats.safeSubjects, label: 'Safe', color: '#10b981' },
          { id: 'stat-critical-subjects', value: dashboardStats.criticalSubjects, label: 'Critical', color: '#ef4444' }
        ].map((stat) => (
          <motion.div 
            key={stat.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, translateY: -5, boxShadow: '0 10px 30px rgba(139, 92, 246, 0.1)' }}
            className="stat-pill" 
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'default'
            }}
          >
            <span className="stat-pill-value" id={stat.id} style={{ fontSize: '28px', fontWeight: '800', color: stat.color, display: 'block' }}>{stat.value}</span>
            <span className="stat-pill-label" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Prediction Widgets */}
      <motion.div 
        className="prediction-widgets-grid" 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}
      >
        {[
          { id: 'pred-safe-skip', icon: '✅', title: 'Safe to Skip', color: '#10b981', value: getSafeSubjects().length, desc: 'Subjects you can safely skip', bg: 'rgba(16, 185, 129, 0.1)' },
          { id: 'pred-critical-risk', icon: '⚠️', title: 'Critical Risk', color: '#ef4444', value: getCriticalSubjects().length, desc: 'Needs immediate attention', bg: 'rgba(239, 68, 68, 0.1)' },
          { id: 'pred-recovery-goal', icon: '🩹', title: 'Recovery Goal', color: '#f59e0b', value: getCriticalSubjects().length, desc: 'Classes to reach target', bg: 'rgba(245, 158, 11, 0.1)' }
        ].map((pred) => (
          <motion.div 
            key={pred.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, translateY: -5 }}
            className="prediction-card" 
            style={{
              background: `linear-gradient(135deg, ${pred.bg} 0%, rgba(15, 23, 42, 0.2) 100%)`,
              border: `1px solid ${pred.color}33`,
              borderRadius: '16px',
              padding: '24px',
              cursor: 'default'
            }}
          >
            <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="pred-icon" style={{ fontSize: '24px' }}>{pred.icon}</span>
              <span className="pred-title" style={{ fontSize: '14px', fontWeight: '600', color: pred.color }}>{pred.title}</span>
            </div>
            <div className="pred-value" id={pred.id} style={{ fontSize: '24px', fontWeight: '800', color: pred.color, marginBottom: '8px' }}>{pred.value}</div>
            <div className="pred-desc" style={{ fontSize: '12px', color: '#94a3b8' }}>{pred.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dashboard Grid */}
      <motion.div 
        className="dashboard-grid" 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Attendance Overview */}
        <motion.div variants={itemVariants} whileHover={{ translateY: -5 }} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '24px' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Attendance Overview</span>
          </div>
          <div className="attendance-overview-content" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div className="progress-ring-container" style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg className="progress-ring-svg" width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle className="progress-ring-circle-bg" cx="50" cy="50" r="42" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="4"></circle>
                <motion.circle 
                  id="progress-ring-bar" 
                  className="progress-ring-circle" 
                  cx="50" cy="50" r="42" fill="none" 
                  stroke="url(#gradient)" strokeWidth="4" 
                  strokeDasharray="263.89" 
                  initial={{ strokeDashoffset: 263.89 }}
                  whileInView={{ strokeDashoffset: 263.89 - (263.89 * dashboardStats.overallPercentage) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  viewport={{ once: true }}
                ></motion.circle>
              </svg>
              <span className="progress-percentage-text" id="overview-perc" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#a78bfa' }}>{dashboardStats.overallPercentage}%</span>
            </div>
            <div className="mini-stats" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Present</span>
                <span className="mini-stat-value" id="stat-present" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{dashboardStats.present}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Missed</span>
                <span className="mini-stat-value" id="stat-missed" style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{dashboardStats.missed}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Total</span>
                <span className="mini-stat-value" id="stat-total" style={{ fontSize: '20px', fontWeight: '800', color: '#a78bfa' }}>{dashboardStats.total}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Performance Insights */}
        <motion.div variants={itemVariants} whileHover={{ translateY: -5 }} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>AI Performance Insights</span>
            <span className="ai-badge-small" style={{ fontSize: '10px', fontWeight: '700', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.2)', padding: '4px 12px', borderRadius: '8px' }}>AI ACTIVE</span>
          </div>
          <div className="ai-insights-list" id="dashboard-ai-insights">
            {insights.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No insights yet. Add subjects to get started!</p>
            ) : (
              insights.slice(0, 3).map((insight, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '12px',
                    background: insight.type === 'critical' ? 'rgba(239, 68, 68, 0.1)' : insight.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: insight.type === 'critical' ? '1px solid rgba(239, 68, 68, 0.2)' : insight.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: insight.type === 'critical' ? '#fca5a5' : insight.type === 'warning' ? '#fcd34d' : '#86efac'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{insight.icon} {insight.title}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{insight.message}</div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div variants={itemVariants} whileHover={{ translateY: -5 }} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Today's Schedule</span>
            <span id="today-day-name" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
            </span>
          </div>
          <div className="schedule-list" id="dashboard-schedule-list">
            {getTodaySchedule().length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No classes scheduled for today</p>
            ) : (
              getTodaySchedule().map((event, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '12px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{event.subjectName}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{event.timeSlot}</div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Insights & Alerts */}
        <motion.div variants={itemVariants} whileHover={{ translateY: -5 }} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <span className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Insights & Alerts</span>
          </div>
          <div className="insight-pills" id="dashboard-insight-pills">
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No alerts at the moment</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Shortcuts Section */}
      <motion.section 
        className="shortcut-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
      >
        <motion.h3 variants={textVariants} style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '600' }}>Navigation Shortcuts</motion.h3>
        <div className="shortcut-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {shortcuts.map((shortcut) => (
            <motion.div key={shortcut.path} variants={itemVariants}>
              <Link
                to={shortcut.path}
                className="shortcut-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'block',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="shortcut-icon" style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>{shortcut.icon}</span>
                <div className="shortcut-info">
                  <span className="shortcut-title" style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>{shortcut.title}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* AI Import Promo */}
      <motion.section 
        className="ai-import-promo" 
        style={{ marginTop: '32px' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={itemVariants}
      >
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="dashboard-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '20px', color: '#f8fafc', marginBottom: '8px', fontWeight: '700' }}>Quick Setup with AI</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>Upload a screenshot of your subjects or timetable. Our AI will extract them automatically.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="home-ai-import-btn" className="primary-btn" style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                color: '#f8fafc',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <span>📸</span> Import from Screenshot
            </motion.button>
          </div>
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              filter: ['drop-shadow(0 0 10px rgba(139, 92, 246, 0.2))', 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.5))', 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.2))']
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="ai-promo-icon" style={{ fontSize: '64px', opacity: 0.8 }}>🤖</motion.div>
        </motion.div>
      </motion.section>

      {/* Contact Us Section */}
      <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <ContactUs />
      </motion.div>
    </motion.div>
  );
}

export default Home;
