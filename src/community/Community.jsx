import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import communityService from './services/communityService';
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';

function Community() {
  const navigate = useNavigate();
  const { subscription, user } = useAppStore();
  const isPremium = subscription?.status === 'active';

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityService.fetchLeaderboard(20);
      setLeaderboard(data);
    } catch (err) {
      console.error("Community Page Error:", err);
      setError("Leaderboard is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="community-view" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)' }}>
      {/* Header Section */}
      <header style={{ marginBottom: '48px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ 
            display: 'inline-block', 
            padding: '8px 20px', 
            background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(139, 92, 246, 0.1) 100%)', 
            borderRadius: '100px',
            color: 'var(--primary-light)',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '16px',
            border: '1px solid var(--primary-glow)'
          }}
        >
          🏆 Champions Board
        </motion.div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: '950', marginBottom: '12px', letterSpacing: '-1.5px', lineHeight: 1 }}>
          The <span style={{ color: 'var(--primary-light)' }}>Top 3</span> Elite
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', maxWidth: '450px', margin: '0 auto', lineHeight: 1.5 }}>
          Recognizing the most disciplined and consistent students in the TrackTaps ecosystem.
        </p>
      </header>

      {/* Leaderboard Section */}
      <div className="leaderboard-container" style={{ position: 'relative', minHeight: '300px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-dim)' }}>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ fontSize: '32px', marginBottom: '16px' }}
            >
              ⌛
            </motion.div>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>Calculating rankings...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px dashed #ef4444' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Leaderboard is currently offline.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gap: '16px' }}
          >
            {/* Conditional List Rendering: Top 3 for Free, Top 20 for Premium */}
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <p>Waiting for the first champions to sync...</p>
              </div>
            ) : (
              (isPremium ? leaderboard.slice(0, 20) : leaderboard.slice(0, 3)).map((item, index) => (
                <motion.div
                  key={item.uid}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, x: 5 }}
                  style={{ 
                    background: index === 0 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, var(--surface-glass) 100%)' : 'var(--surface-glass)',
                    border: index === 0 ? '2px solid rgba(251, 191, 36, 0.5)' : 
                            index === 1 ? '1px solid rgba(203, 213, 225, 0.3)' :
                            index === 2 ? '1px solid rgba(217, 119, 6, 0.3)' :
                            '1px solid var(--border)',
                    borderRadius: '24px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: index === 0 ? '0 15px 30px rgba(251, 191, 36, 0.1)' : 'var(--shadow-sm)',
                    opacity: !isPremium && index > 2 ? 0.4 : 1, // Visual hint if we ever allow more in future
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{ 
                    width: '44px', 
                    height: '44px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: index < 3 ? '20px' : '16px', 
                    fontWeight: '900', 
                    background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 
                               index === 1 ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)' : 
                               index === 2 ? 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' :
                               'var(--surface)',
                    color: index < 3 ? '#000' : 'var(--text-main)',
                    border: index > 2 ? '1px solid var(--border)' : 'none',
                    flexShrink: 0
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  {/* Profile Info */}
                  <div style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '16px', 
                    background: 'var(--surface-dark)',
                    padding: '2px',
                    border: index < 3 ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                    flexShrink: 0
                  }}>
                    {item.photoURL ? (
                      <img src={item.photoURL} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '14px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: 'var(--primary-light)' }}>
                        {item.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>{item.name}</div>
                      {/* Badge System */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(245, 158, 11, 0.3)' }} title="Premium Plus">👑 Plus</span>
                        {item.attendance >= 90 && (
                          <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Attendance King">🔥 King</span>
                        )}
                        {item.activityScore > 50 && (
                          <span style={{ fontSize: '10px', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(14, 165, 233, 0.3)' }} title="Most Active">⚡ Active</span>
                        )}
                        {item.totalClasses >= 50 && (
                          <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid rgba(168, 85, 247, 0.3)' }} title="Campus OG">🎓 OG</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item.totalClasses || 0} classes tracked</span>
                      {item.activityScore > 0 && (
                        <>
                          <span>•</span>
                          <span>Activity Rank: {item.activityScore}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: '950', 
                      color: item.attendance >= 75 ? 'var(--success)' : 'var(--warning)',
                      lineHeight: 1,
                      textShadow: item.attendance >= 90 ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
                    }}>
                      {item.attendance}%
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* PREMIUM CONVERSION CTA */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ 
          marginTop: '60px',
          padding: '40px 24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚡</div>
          <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '12px' }}>Think you can dominate the leaderboard?</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '15px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Unlock TrackTaps Premium to have your consistency featured on the global stage and compete with the best.
          </p>
          <button 
            onClick={() => navigate('/premium')}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              padding: '16px 32px', 
              borderRadius: '16px', 
              fontWeight: '800', 
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 10px 25px var(--primary-glow)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Upgrade to Premium →
          </button>
        </div>
        
        {/* Decorative Glow */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary-glow)', filter: 'blur(100px)', opacity: 0.3 }}></div>
      </motion.section>

      <footer style={{ marginTop: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', opacity: 0.6 }}>
        <p>© 2026 TrackTaps Community • Rankings updated in real-time</p>
      </footer>
    </div>
  );
}

export default Community;
