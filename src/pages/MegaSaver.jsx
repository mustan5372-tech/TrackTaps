import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

function MegaSaver() {
  const navigate = useNavigate();
  const { 
    subjects, 
    semesterStats, 
    subscription, 
    attendanceSettings, 
    role 
  } = useAppStore();

  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  // Dynamic user inputs for travel calculations
  const [dailyCommuteCost, setDailyCommuteCost] = useState(() => {
    return parseFloat(localStorage.getItem('tracktaps_commute_cost') || '8.50');
  });
  const [dailyCommuteTime, setDailyCommuteTime] = useState(() => {
    return parseInt(localStorage.getItem('tracktaps_commute_time') || '60'); // in minutes
  });

  useEffect(() => {
    localStorage.setItem('tracktaps_commute_cost', dailyCommuteCost.toString());
  }, [dailyCommuteCost]);

  useEffect(() => {
    localStorage.setItem('tracktaps_commute_time', dailyCommuteTime.toString());
  }, [dailyCommuteTime]);

  // Calculations for total safe bunks
  let totalSafeBunks = 0;
  const bunkabilityMatrix = subjects.map(subject => {
    const stats = semesterStats[subject.id];
    if (!stats) return { name: subject.name, bunkable: 0, rating: 'Unknown', color: 'var(--text-muted)' };

    const bunkable = stats.bunkableNow || 0;
    if (bunkable > 0) {
      totalSafeBunks += bunkable;
    }

    // Dynamic AI Bunkability Rating
    let rating = 'CRITICAL (DO NOT BUNK)';
    let color = 'var(--danger)';
    if (stats.percentage >= 90) {
      rating = 'ULTRA SAFE (HIGH BUFFER)';
      color = 'var(--success)';
    } else if (stats.percentage >= (subject.criteria || 75) + 5) {
      rating = 'SAFE (MODERATE BUFFER)';
      color = 'var(--success)';
    } else if (stats.percentage >= (subject.criteria || 75)) {
      rating = 'CAUTION (LIMIT REACHED)';
      color = '#f59e0b';
    }

    return {
      id: subject.id,
      name: subject.name,
      bunkable,
      percentage: stats.percentage,
      target: subject.criteria || attendanceSettings?.defaultTarget || 75,
      rating,
      color
    };
  });

  // Mega Saver Financial & Time calculations
  const totalMoneySaved = (totalSafeBunks * dailyCommuteCost).toFixed(2);
  const totalHoursSaved = ((totalSafeBunks * dailyCommuteTime) / 60).toFixed(1);
  const carbonFootprintReduced = (totalSafeBunks * 2.3).toFixed(1); // 2.3kg CO2 saved per average car/bus trip bunked

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  if (!isPremium) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <header className="view-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '28px' }}>💰</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Mega Saver Mode</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: '4px 0 0' }}>Commute & Expense Reduction Engine</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1.5px dashed rgba(245, 158, 11, 0.4)',
            borderRadius: '28px',
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div style={{ fontSize: '64px' }}>🔒</div>
          <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>Unlock Mega Saver Portal</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '500px', lineHeight: '1.6' }}>
            Convert your attendance buffer directly into **financial savings, free hours, and fuel conservation statistics**. Unlock the AI Bunkability Matrix and schedule your weekly savings strategy.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '12px 0' }}>
            <div style={{ background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', minWidth: '120px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>💵</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Financial Advisor</div>
            </div>
            <div style={{ background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', minWidth: '120px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>⏳</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Commute Optimizer</div>
            </div>
            <div style={{ background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', minWidth: '120px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌱</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Eco Travel Tracker</div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/premium')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            👑 Upgrade to TrackTaps Plus
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>💰</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Mega Saver Portal</h2>
            <span style={{ fontSize: '9px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: '100px', fontWeight: '900', border: '1px solid var(--border)' }}>MEGA ADVANCED</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Exclusively optimized travel expense & commute reduction analytics</p>
        </div>
      </header>

      {/* Dynamic Strategy Summary Widgets */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}
      >
        <motion.div variants={itemVariants} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💵</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--success)' }}>${totalMoneySaved}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Financial Cash Saved</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Commute round trips safely optimized</div>
        </motion.div>

        <motion.div variants={itemVariants} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1.5px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary-light)' }}>{totalHoursSaved}h</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Commute Time Saved</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Hours of commute transit converted to free time</div>
        </motion.div>

        <motion.div variants={itemVariants} className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: '#38bdf8' }}>{carbonFootprintReduced}kg</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase' }}>CO2 Carbon Reduced</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Eco environmental transit footprints reduced</div>
        </motion.div>
      </motion.div>

      {/* Travel Cost Parameter Optimizer Card */}
      <div className="dashboard-card" style={{ padding: '24px', background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: '24px' }}>
        <h3 style={{ margin: '0 0 12px', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>🛠️ Commute Cost Optimizer</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
          Adjust your standard round-trip parameters to calculate accurate financial and travel time savings automatically.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Round Trip Transit Cost ($)</label>
            <input 
              type="number" 
              step="0.50"
              value={dailyCommuteCost} 
              onChange={(e) => setDailyCommuteCost(Math.max(0, parseFloat(e.target.value) || 0))}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Round Trip Travel Time (min)</label>
            <input 
              type="number" 
              value={dailyCommuteTime} 
              onChange={(e) => setDailyCommuteTime(Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700'
              }}
            />
          </div>
        </div>
      </div>

      {/* AI Bunkability Matrix List */}
      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔮 AI Bunkability Matrix</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bunkabilityMatrix.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No subjects added yet. Add subjects to build your strategy.</p>
          ) : bunkabilityMatrix.map((item, idx) => (
            <div 
              key={item.id || idx} 
              style={{ 
                background: 'rgba(15, 23, 42, 0.4)', 
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: item.color, fontWeight: '800' }}>{item.rating}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>| Target: {item.target}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>SAFE SKIP LIMIT</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: item.bunkable > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {item.bunkable} Classes
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>SAVINGS</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-light)' }}>
                    +${(item.bunkable * dailyCommuteCost).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MegaSaver;
