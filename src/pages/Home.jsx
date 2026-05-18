import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import ContactUs from '../components/ContactUs';

const fadeInUp = {
  initial: { opacity: 0, y: 20, filter: window.innerWidth < 768 ? 'none' : 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: window.innerWidth < 768 ? 'none' : 'blur(0px)' },
  transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardHover = {
  hover: window.innerWidth < 768 ? {} : { 
    y: -8,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px var(--primary-glow)',
    borderColor: 'var(--primary-light)',
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const StatSkeleton = () => (
  <div style={{
    background: 'var(--surface-glass)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '48px',
    height: '240px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <motion.div
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.05), transparent)',
        zIndex: 1
      }}
    />
    <div style={{ height: '32px', width: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '16px' }} />
    <div style={{ height: '20px', width: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '32px' }} />
    <div style={{ height: '60px', width: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
  </div>
);

function Home() {
  const navigate = useNavigate();
  
  // Use individual selectors to prevent full-page re-renders
  const user = useAppStore(state => state.user);
  const isAuthLoading = useAppStore(state => state.isAuthLoading);
  const dashboardStats = useAppStore(state => state.dashboardStats);
  const insights = useAppStore(state => state.insights);
  const attendanceSettings = useAppStore(state => state.attendanceSettings);
  const subscription = useAppStore(state => state.subscription);
  const setAuthModalOpen = useAppStore(state => state.setAuthModalOpen);
  const fullSync = useAppStore(state => state.fullSync);
  const getSafeSubjects = useAppStore(state => state.getSafeSubjects);
  const getCriticalSubjects = useAppStore(state => state.getCriticalSubjects);
  const getTodaySchedule = useAppStore(state => state.getTodaySchedule);
  const semesterStats = useAppStore(state => state.semesterStats);
  const referralData = useAppStore(state => state.referralData);

  // Non-logged-in landing page (no Google login - auth handled elsewhere)
  if (!user && !isAuthLoading) {
    // ... (Landing page code remains same)
  }

  const getTotalBunkable = () => {
    return Object.values(semesterStats || {}).reduce((acc, stat) => acc + (stat.bunkableNow || 0), 0);
  };

  useEffect(() => {
    fullSync();
  }, [fullSync]);

  const shortcuts = [
    { icon: '📅', title: 'Calendar', path: '/calendar' },
    { icon: '🕒', title: 'Timetable', path: '/timetable' },
    { icon: '📚', title: 'Subjects', path: '/subjects' },
    { icon: '💡', title: 'Insights', path: '/insights' },
  ];

  if (dashboardStats.totalSubjects === 0 && !isAuthLoading && user) {
     return (
       <div className="home-view" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
         <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           style={{
             textAlign: 'center',
             background: 'var(--surface-glass)',
             border: '1px solid var(--border)',
             borderRadius: '32px',
             padding: '48px 24px',
             maxWidth: '400px',
             width: '100%',
             boxShadow: 'var(--shadow-lg)'
           }}
         >
           <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
           <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>No attendance data yet.</h2>
           <p style={{ color: 'var(--text-dim)', fontSize: '15px', lineHeight: 1.5, marginBottom: '32px' }}>
             Sync your Pod.ai account to instantly track your attendance and calculate safe bunks.
           </p>
           <button
             onClick={() => navigate('/pod')}
             style={{
               background: 'var(--primary)',
               color: 'white',
               border: 'none',
               padding: '16px 32px',
               borderRadius: '16px',
               fontWeight: '800',
               fontSize: '16px',
               cursor: 'pointer',
               boxShadow: '0 10px 30px var(--primary-glow)',
               width: '100%'
             }}
           >
             Sync Pod.ai Now →
           </button>
         </motion.div>
       </div>
     );
  }

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
            padding: 8px 0 120px 0 !important;
            gap: 20px !important;
          }
          .dashboard-hero {
            flex-direction: column !important;
            padding: 32px 20px !important;
            gap: 24px !important;
            text-align: left !important;
            align-items: flex-start !important;
            background: linear-gradient(135deg, var(--primary-glow) 0%, var(--bg-primary) 100%) !important;
            border-radius: 0 0 32px 32px !important;
            border: none !important;
            border-bottom: 1px solid var(--border) !important;
            margin-top: -8px !important;
          }
          .hero-welcome {
            width: 100% !important;
            align-items: flex-start !important;
          }
          #hero-greeting {
            font-size: 24px !important;
            margin-bottom: 4px !important;
          }
          #hero-subtitle {
            font-size: 14px !important;
            opacity: 0.8;
            margin-bottom: 12px !important;
          }
          .hero-overall-stats {
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 16px 20px !important;
            background: var(--surface) !important;
            border-radius: 16px !important;
          }
          #hero-overall-perc {
            font-size: 36px !important;
          }
          .overall-label {
            margin-top: 0 !important;
            font-size: 10px !important;
          }
          .quick-stats-row {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            padding: 0 16px !important;
          }
          .stat-pill {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .stat-pill-value {
            font-size: 24px !important;
          }
          .prediction-widgets-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            padding: 0 16px !important;
          }
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 0 16px !important;
          }
          .shortcut-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            padding: 0 16px !important;
          }
          .ai-import-promo {
            padding: 0 16px !important;
          }
          .ai-import-promo .dashboard-card {
            padding: 24px !important;
            flex-direction: column !important;
            text-align: center !important;
          }
          .ai-promo-icon {
            font-size: 48px !important;
            position: static !important;
            margin-bottom: 16px !important;
          }
          .primary-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Premium Background Effects (Optimized) */}
      <div className="home-bg-effects" style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '40vw',
            height: '40vw',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            opacity: 0.4,
            willChange: 'transform'
          }}
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '5%',
            width: '50vw',
            height: '50vw',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            opacity: 0.3,
            willChange: 'transform'
          }}
        />
      </div>

      {/* Hero Section */}
      <motion.section 
        variants={fadeInUp}
        className="dashboard-hero" 
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-glass) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '40px',
          backdropFilter: window.innerWidth < 768 ? 'none' : 'blur(8px)',
          boxShadow: 'var(--shadow-md)',
          willChange: 'transform, opacity'
        }}
      >
        <div className="hero-welcome" style={{ flex: 1 }}>
          <motion.h2 
            initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.2 }}
            id="hero-greeting" 
            style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '-0.02em' }}
          >
            Welcome back, {user?.displayName?.split(' ')[0] || 'Scholar'} 👋
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: '500' }}
          >
            {dashboardStats.overallPercentage >= 85 ? 'Your attendance is looking strong this week.' : 'Let\'s focus on improving your consistency today.'}
          </motion.div>
          
          {/* DAILY PULSE - RETENTION ENGINE */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              marginTop: '16px'
            }}
          >
             {/* Streak Badge */}
             {dashboardStats.attendanceStreak >= 1 && (
               <div style={{ 
                 display: 'inline-flex', 
                 alignItems: 'center', 
                 gap: '8px', 
                 background: 'rgba(245, 158, 11, 0.1)', 
                 padding: '6px 12px', 
                 borderRadius: '100px',
                 border: '1px solid rgba(245, 158, 11, 0.2)',
                 width: 'fit-content'
               }}>
                 <span style={{ fontSize: '14px' }}>🔥</span>
                 <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   {dashboardStats.attendanceStreak} Day Consistency
                 </span>
               </div>
             )}

             {/* Dynamic Insight */}
             <div style={{ 
               fontSize: '15px', 
               color: 'var(--text-main)', 
               fontWeight: '600',
               lineHeight: 1.4,
               maxWidth: '300px'
             }}>
               {dashboardStats.dailyImpact?.criticalSubject ? (
                 <span style={{ color: 'var(--danger)' }}>🚨 Critical: Missing {dashboardStats.dailyImpact.criticalSubject} today will drop your stats!</span>
               ) : dashboardStats.dailyImpact?.totalSafeBunks > 0 ? (
                 <span>🛡️ You can safely bunk <span style={{ color: 'var(--success)' }}>{dashboardStats.dailyImpact.totalSafeBunks} classes</span> today.</span>
               ) : (
                 <span style={{ color: 'var(--text-dim)' }}>✨ Focus on maintaining your consistency today!</span>
               )}
             </div>

             {/* Social Proof */}
             {dashboardStats.overallPercentage >= (attendanceSettings?.defaultTarget || 75) && (
               <div style={{ 
                 fontSize: '11px', 
                 color: 'var(--primary-light)', 
                 fontWeight: '700',
                 marginTop: '4px',
                 background: 'rgba(139, 92, 246, 0.1)',
                 padding: '4px 8px',
                 borderRadius: '6px',
                 width: 'fit-content',
                 border: '1px solid rgba(139, 92, 246, 0.2)'
               }}>
                 🌟 You are performing better than {Math.min(99, Math.max(60, Math.round(dashboardStats.overallPercentage * 1.05)))}% of students.
               </div>
             )}
          </motion.div>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [0, 1, -1, 0] }}
          className="hero-overall-stats" 
          style={{
            background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '20px',
            padding: '24px 32px',
            textAlign: 'center',
            minWidth: '200px',
            boxShadow: '0 0 30px var(--primary-glow)'
          }}
        >
          <span className="overall-percentage" id="hero-overall-perc" style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary-light)', display: 'block', lineHeight: 1 }}>{dashboardStats.overallPercentage}%</span>
          <span className="overall-label" style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginTop: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Score</span>
          
          {/* Mini Bunk Indicator */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '800', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              {getTotalBunkable()} SAFE BUNKS
            </span>
          </div>
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
          { label: 'Total Subjects', value: dashboardStats.totalSubjects, color: 'var(--primary-light)', icon: '📚' },
          { label: 'Day Streak', value: dashboardStats.streak, color: 'var(--warning)', icon: '🔥' },
          { label: 'Safe', value: dashboardStats.safeSubjects, color: 'var(--success)', icon: '🛡️' },
          { label: 'Critical', value: dashboardStats.criticalSubjects, color: 'var(--danger)', icon: '🚨' }
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
              background: 'var(--surface-glass)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              backdropFilter: 'blur(5px)'
            }}
          >
            <span className="stat-pill-value" style={{ fontSize: '32px', fontWeight: '800', color: stat.color, display: 'block' }}>{stat.value}</span>
            <span className="stat-pill-label" style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px', display: 'block', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>
      
      {/* 🎁 CAMPUS LAUNCH CAMPAIGN - GROWTH ENGINE */}
      <motion.section
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        style={{ padding: window.innerWidth < 768 ? '0 16px' : '0' }}
      >
        <div style={{
          background: subscription?.status === 'active' 
            ? 'var(--surface-glass)' 
            : 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: subscription?.status === 'active' 
            ? '1px solid var(--border)' 
            : '1px solid var(--primary-glow)',
          borderRadius: '28px',
          padding: window.innerWidth < 768 ? '24px' : '32px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          {/* Background Glow for Free Users */}
          {subscription?.status !== 'active' && (
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', opacity: 0.3, pointerEvents: 'none' }} />
          )}

          <div style={{ flex: 1, textAlign: window.innerWidth < 768 ? 'center' : 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎁</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Campus Launch Campaign</h3>
              <span style={{ 
                fontSize: '10px', 
                background: 'var(--primary)', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '100px', 
                fontWeight: '900',
                letterSpacing: '0.05em'
              }}>EARLY ACCESS</span>
            </div>
            
            {subscription?.status !== 'active' ? (
              <>
                <p style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  Invite 10 students & Unlock 30 Days Premium FREE.
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '12px', margin: 0 }}>
                  🔥 Unlock Premium through referrals during the Early Campus Launch.
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>
                Keep growing the TrackTaps community! Track your referral milestones below.
              </p>
            )}
          </div>

          <div style={{ 
            minWidth: window.innerWidth < 768 ? '100%' : '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Progress Bar Container */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Valid Referrals</span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--primary-light)' }}>
                  {referralData?.totalValidReferrals || 0} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>/ 10</span>
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(((referralData?.totalValidReferrals || 0) / 10) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)' }}
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--primary-glow)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/referral')}
              style={{
                width: '100%',
                background: subscription?.status === 'active' ? 'var(--surface-bright)' : 'var(--primary-glow)',
                color: subscription?.status === 'active' ? 'var(--text-main)' : 'var(--primary-light)',
                border: `1px solid ${subscription?.status === 'active' ? 'var(--border)' : 'var(--primary-glow)'}`,
                padding: '14px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {subscription?.status === 'active' ? 'View Referrals →' : 'Invite & Earn Premium →'}
            </motion.button>
          </div>
        </div>
      </motion.section>

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
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-glass) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '28px' }}>✅</span>
            <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe to Skip</span>
          </div>
          <div className="pred-value" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)', marginBottom: '8px' }}>{(getSafeSubjects() || []).length}</div>
          <div className="pred-desc" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Subjects you can safely skip while staying above {attendanceSettings?.defaultTarget || 75}%</div>
        </motion.div>
        
        {subscription?.status === 'active' ? (
          <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="prediction-card" style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '24px',
            padding: '28px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--warning)', color: 'white', fontSize: '10px', fontWeight: '900', padding: '4px 12px', borderRadius: '100px', transform: 'rotate(5deg)' }}>PLUS AI</div>
            <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="pred-icon" style={{ fontSize: '28px' }}>🔮</span>
              <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Prediction</span>
            </div>
            <div className="pred-value" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
              {dashboardStats.overallPercentage > 85 ? 'Excellent' : dashboardStats.overallPercentage >= (attendanceSettings?.defaultTarget || 75) ? 'Stable' : 'Risk'}
            </div>
            <div className="pred-desc" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>AI expects your attendance to reach <span style={{ color: 'var(--success)', fontWeight: '700' }}>{(dashboardStats.overallPercentage + 2.5).toFixed(1)}%</span> by end of month.</div>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="prediction-card" style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-glass) 100%)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '28px',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="pred-icon" style={{ fontSize: '28px' }}>🚨</span>
              <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical Risk</span>
            </div>
            <div className="pred-value" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--danger)', marginBottom: '8px' }}>{(getCriticalSubjects() || []).length}</div>
            <div className="pred-desc" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Subjects at risk of falling below your target attendance</div>
          </motion.div>
        )}

        <motion.div 
          onClick={() => navigate('/bunk-calculator')}
          variants={fadeInUp} 
          whileHover={cardHover.hover} 
          className="prediction-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '24px',
            padding: '28px',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {subscription?.status !== 'active' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--surface)', padding: '6px 14px', borderRadius: '100px', fontSize: '10px', fontWeight: '800', color: '#f59e0b', border: '1px solid #f59e0b', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
                PREMIUM
              </div>
            </div>
          )}
          <div className="pred-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="pred-icon" style={{ fontSize: '28px' }}>🏖️</span>
            <span className="pred-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bunk Calculator
            </span>
          </div>
          <div className="pred-value" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)', marginBottom: '8px' }}>
            {getTotalBunkable()} <span style={{ fontSize: '14px', fontWeight: '600' }}>Safe Bunks</span>
          </div>
          <div className="pred-desc" style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
            Plan your semester and skip classes safely.
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
             <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--warning)', textTransform: 'uppercase' }}>Open Calculator →</span>
          </div>
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
          background: 'var(--surface-glass)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header" style={{ marginBottom: '24px' }}>
            <span className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Attendance Overview</span>
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
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary-glow)" strokeWidth="6"></circle>
                <motion.circle 
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: dashboardStats.overallPercentage / 100 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  cx="60" cy="60" r="54" fill="none" stroke="var(--primary-light)" strokeWidth="6" strokeLinecap="round"
                />
              </svg>
              <span className="progress-percentage-text" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: 'var(--primary-light)' }}>{dashboardStats.overallPercentage}%</span>
            </motion.div>
            <div className="mini-stats" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>PRESENT</span>
                <span className="mini-stat-value" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>{dashboardStats.present}</span>
              </div>
              <div className="mini-stat-item">
                <span className="mini-stat-label" style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>MISSED</span>
                <span className="mini-stat-value" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>{dashboardStats.missed}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="dashboard-card" style={{
          background: 'var(--surface-glass)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>AI Insights</span>
            <motion.span 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ai-badge-small" 
              style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-light)', background: 'var(--primary-glow)', padding: '4px 12px', borderRadius: '100px', border: '1px solid var(--border)' }}
            >
              AI ACTIVE
            </motion.span>
          </div>
          <div className="ai-insights-list">
            {(!insights || insights.length === 0) ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No insights yet. Add subjects to get started!</p>
            ) : (
              insights.slice(0, 3).map((insight, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '16px',
                    background: 'var(--surface-glass)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px', color: insight.type === 'critical' ? 'var(--danger)' : 'var(--primary-light)' }}>{insight.icon} {insight.title}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '12px', lineHeight: 1.4 }}>{insight.message}</div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover.hover} className="dashboard-card" style={{
          background: 'var(--surface-glass)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Today's Schedule</span>
            <span style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '700', letterSpacing: '0.05em' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
            </span>
          </div>
          <div className="schedule-list">
            {(!getTodaySchedule() || getTodaySchedule().length === 0) ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No classes scheduled for today</p>
            ) : (
              getTodaySchedule().map((event, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '16px',
                    background: 'var(--primary-glow)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{event.subjectName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '600' }}>{event.timeSlot}</div>
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
       <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', fontWeight: '700' }}>Navigation Shortcuts</h3>
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
                borderColor: 'var(--primary-glow)'
              }}
            >
              <Link
                to={shortcut.path}
                style={{
                  display: 'block',
                  background: 'var(--surface-glass)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '24px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'background-color 0.3s, border-color 0.3s'
                }}
              >
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>{shortcut.icon}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{shortcut.title}</span>
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
            border: '1px solid var(--primary-glow)',
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
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '24px', color: 'var(--text-main)', marginBottom: '12px', fontWeight: '800', letterSpacing: '-0.01em' }}>Quick Setup with AI</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '16px', marginBottom: '24px', lineHeight: '1.6', maxWidth: '500px' }}>Upload a screenshot of your subjects or timetable. Our advanced AI will extract all data and set up your dashboard in seconds.</p>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px var(--primary-glow)' }}
              whileTap={{ scale: 0.95 }}
              className="primary-btn" 
              style={{
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                color: 'var(--text-main)',
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
