import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import ContactUs from '../components/ContactUs';

const fadeInUp = {
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardHover = {
  hover: { 
    y: -8,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

function Home() {
  const {
    dashboardStats,
    insights,
    getSafeSubjects,
    getCriticalSubjects,
    getTodaySchedule,
    fullSync
  } = useAppStore();

  useEffect(() => {
    fullSync();
  }, [fullSync]);

  const shortcuts = [
    { icon: '📅', title: 'Calendar', path: '/calendar' },
    { icon: '🕒', title: 'Timetable', path: '/timetable' },
    { icon: '📚', title: 'Subjects', path: '/subjects' },
    { icon: '💡', title: 'Insights', path: '/insights' },
  ];

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      className="home-view" 
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}
    >
      <style>{`
        @media (max-width: 768px) {
          .home-view {
            padding: 4px 12px 100px 12px !important;
            gap: 20px !important;
            overflow-x: hidden !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .dashboard-hero {
            flex-direction: column !important;
            padding: 32px 20px !important;
            gap: 28px !important;
            text-align: center !important;
            align-items: center !important;
            width: 100% !important;
            box-sizing: border-box !important;
            margin-top: 8px !important;
          }
          .hero-welcome {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          #hero-greeting {
            font-size: 26px !important;
            margin-bottom: 8px !important;
            width: 100% !important;
            display: block !important;
            line-height: 1.2 !important;
            white-space: normal !important;
          }
          #hero-subtitle {
            font-size: 14px !important;
            max-width: 280px !important;
            margin: 0 auto 12px !important;
            line-height: 1.5 !important;
          }
          #hero-date {
            font-size: 12px !important;
          }
          .hero-overall-stats {
            width: 100% !important;
            min-width: 0 !important;
            padding: 24px 16px !important;
            box-sizing: border-box !important;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%) !important;
          }
          #hero-overall-perc {
            font-size: 48px !important;
          }
          .quick-stats-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .stat-pill {
            padding: 20px 12px !important;
          }
          .stat-pill-value {
            font-size: 24px !important;
          }
          .prediction-widgets-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .dashboard-card {
            padding: 24px 20px !important;
          }
          .attendance-overview-content {
            flex-direction: column !important;
            gap: 20px !important;
            text-align: center !important;
          }
          .shortcut-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .ai-import-promo .dashboard-card {
            flex-direction: column !important;
            padding: 32px 20px !important;
            text-align: center !important;
            gap: 24px !important;
          }
          .ai-promo-icon {
            font-size: 64px !important;
            order: -1 !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>

      {/* Premium Background Effects */}
      <div className="home-bg-effects" style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)'
          }}
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '5%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(100px)'
          }}
        />
      </div>

      {/* Hero Section */}
      <motion.section 
        variants={fadeInUp}
        className="dashboard-hero" 
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '24px',
          padding: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '40px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}
      >
        <div className="hero-welcome">
          <motion.h2 
            initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.2 }}
            id="hero-greeting" 
            style={{ fontSize: '36px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}
          >
            Good Afternoon,
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.4 }}
            id="hero-subtitle" 
            style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '16px' }}
          >
            Ready to crush your goals today?
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            id="hero-date" 
            style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </motion.div>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [0, 1, -1, 0] }}
          className="hero-overall-stats" 
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            minWidth: '220px',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)'
          }}
        >
          <span className="overall-percentage" id="hero-overall-perc" style={{ fontSize: '56px', fontWeight: '800', color: '#a78bfa', display: 'block', lineHeight: 1 }}>{dashboardStats.overallPercentage}%</span>
          <span className="overall-label" style={{ fontSize: '14px', color: '#94a3b8', display: 'block', marginTop: '12px', fontWeight: '600' }}>Attendance Score</span>
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            id="overall-trend" 
            style={{ marginTop: '12px', fontSize: '12px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <span>↑</span> 2.4% from last week
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Quick Stats Row */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="quick-stats-row" 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}
      >
        {[
          { label: 'Total Subjects', value: dashboardStats.totalSubjects, color: '#a78bfa', icon: '📚' },
          { label: 'Day Streak', value: dashboardStats.streak, color: '#f59e0b', icon: '🔥' },
          { label: 'Safe', value: dashboardStats.safeSubjects, color: '#10b981', icon: '🛡️' },
          { label: 'Critical', value: dashboardStats.criticalSubjects, color: '#ef4444', icon: '🚨' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover="hover"
            variants={{
              ...fadeInUp,
              ...cardHover
            }}
            className="stat-pill" 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              backdropFilter: 'blur(5px)'
            }}
          >
            <span className="stat-pill-value" style={{ fontSize: '32px', fontWeight: '800', color: stat.color, display: 'block' }}>{stat.value}</span>
            <span className="stat-pill-label" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', display: 'block', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Prediction Widgets */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        className="prediction-widgets-grid" 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}
      >
        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="prediction-card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '28px' }}>✅</span>
            <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe to Skip</span>
          </div>
          <div className="pred-value" style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>{getSafeSubjects().length}</div>
          <div className="pred-desc" style={{ fontSize: '13px', color: '#94a3b8' }}>Subjects you can safely skip while staying above 75%</div>
        </motion.div>
        
        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="prediction-card" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '28px' }}>🚨</span>
            <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical Risk</span>
          </div>
          <div className="pred-value" style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>{getCriticalSubjects().length}</div>
          <div className="pred-desc" style={{ fontSize: '13px', color: '#94a3b8' }}>Subjects at risk of falling below your target attendance</div>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="prediction-card" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '28px' }}>🩹</span>
            <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery Goal</span>
          </div>
          <div className="pred-value" style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>{getCriticalSubjects().length}</div>
          <div className="pred-desc" style={{ fontSize: '13px', color: '#94a3b8' }}>Next milestone to reach overall safety threshold</div>
        </motion.div>
      </motion.div>

      {/* Dashboard Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        className="dashboard-grid" 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}
      >
        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="dashboard-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header" style={{ marginBottom: '24px' }}>
            <span className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>Attendance Overview</span>
          </div>
          <div className="attendance-overview-content" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <motion.div 
              initial={{ rotate: -180, opacity: 0 }}
              whileInView={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="progress-ring-container" 
              style={{ position: 'relative', width: '120px', height: '120px' }}
            >
              <svg className="progress-ring-svg" width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="6"></circle>
                <motion.circle 
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: dashboardStats.overallPercentage / 100 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  cx="60" cy="60" r="54" fill="none" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round"
                />
              </svg>
              <span className="progress-percentage-text" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: '#a78bfa' }}>{dashboardStats.overallPercentage}%</span>
            </motion.div>
            <div className="mini-stats" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>PRESENT</span>
                <span className="mini-stat-value" style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{dashboardStats.present}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>MISSED</span>
                <span className="mini-stat-value" style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{dashboardStats.missed}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="dashboard-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>AI Insights</span>
            <motion.span 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ai-badge-small" 
              style={{ fontSize: '10px', fontWeight: '800', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.15)', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.3)' }}
            >
              AI ACTIVE
            </motion.span>
          </div>
          <div className="ai-insights-list">
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
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px', color: insight.type === 'critical' ? '#ef4444' : '#a78bfa' }}>{insight.icon} {insight.title}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.4 }}>{insight.message}</div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="dashboard-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>Today's Schedule</span>
            <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.05em' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
            </span>
          </div>
          <div className="schedule-list">
            {getTodaySchedule().length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No classes scheduled for today</p>
            ) : (
              getTodaySchedule().map((event, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '16px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#f8fafc' }}>{event.subjectName}</div>
                  <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600' }}>{event.timeSlot}</div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Shortcuts Section */}
      <motion.section 
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="shortcut-section"
      >
        <h3 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', fontWeight: '700' }}>Navigation Shortcuts</h3>
        <div className="shortcut-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '20px'
        }}>
          {shortcuts.map((shortcut, i) => (
            <motion.div
              key={shortcut.path}
              variants={fadeInUp}
              whileHover={{ 
                y: -5, 
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                borderColor: 'rgba(139, 92, 246, 0.4)'
              }}
            >
              <Link
                to={shortcut.path}
                style={{
                  display: 'block',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px',
                  padding: '24px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'background-color 0.3s, border-color 0.3s'
                }}
              >
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>{shortcut.icon}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>{shortcut.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* AI Import Promo */}
      <motion.section 
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="ai-import-promo" 
        style={{ marginTop: '16px' }}
      >
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="dashboard-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '28px',
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Internal Glow for Promo */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '24px', color: '#f8fafc', marginBottom: '12px', fontWeight: '800', letterSpacing: '-0.01em' }}>Quick Setup with AI</h3>
            <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '24px', lineHeight: '1.6', maxWidth: '500px' }}>Upload a screenshot of your subjects or timetable. Our advanced AI will extract all data and set up your dashboard in seconds.</p>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="primary-btn" 
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                color: '#f8fafc',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
              }}
            >
              <span>📸</span> Import from Screenshot
            </motion.button>
          </div>
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="ai-promo-icon" 
            style={{ fontSize: '84px', opacity: 0.8, filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))' }}
          >
            🤖
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Contact Us Section */}
      <motion.div variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
        <ContactUs />
      </motion.div>
    </motion.div>
  );
}

export default Home;
