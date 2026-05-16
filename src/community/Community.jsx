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
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            background: 'var(--primary-glow)', 
            borderRadius: '100px',
            color: 'var(--primary-light)',
            fontSize: '12px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px'
          }}
        >
          🏆 Global Leaderboard
        </motion.div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-1px' }}>
          TrackTaps <span style={{ color: 'var(--primary-light)' }}>Community</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
          Recognizing the most consistent students across the platform.
        </p>
      </header>

      {/* Premium CTA for Free Users */}
      {!isPremium && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.2) 100%)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Want your name featured here? 👑</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '16px' }}>
              The leaderboard exclusively features our **Premium Plus** members who maintain high attendance.
            </p>
            <button 
              onClick={() => navigate('/premium')}
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                padding: '10px 24px', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: 'pointer',
                boxShadow: '0 4px 15px var(--primary-glow)'
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Section */}
      <div className="leaderboard-container" style={{ position: 'relative', minHeight: '400px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-dim)' }}>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ fontSize: '32px', marginBottom: '16px' }}
            >
              ⌛
            </motion.div>
            <p>Loading consistent students...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px dashed #ef4444' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>😕</div>
            <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>Oops! Something went wrong</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{error}</p>
            <button 
              onClick={loadLeaderboard}
              style={{ marginTop: '20px', background: 'transparent', border: '1px solid var(--text-dim)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gap: '12px' }}
          >
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <p>No consistent students found yet. Be the first!</p>
              </div>
            ) : leaderboard.map((item, index) => (
              <motion.div
                key={item.uid}
                variants={itemVariants}
                className="leaderboard-card"
                style={{ 
                  background: 'var(--surface-glass)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: index === 0 ? '0 8px 30px rgba(139, 92, 246, 0.15)' : 'none'
                }}
              >
                {/* Rank Number */}
                <div style={{ 
                  width: '40px', 
                  height: '40px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px', 
                  fontWeight: '900', 
                  background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 
                             index === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 
                             index === 2 ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' : 
                             'rgba(255,255,255,0.05)',
                  color: index < 3 ? '#000' : 'var(--text-muted)',
                  textAlign: 'center',
                  boxShadow: index === 0 ? '0 4px 15px rgba(251, 191, 36, 0.4)' : 'none'
                }}>
                  {index + 1}
                </div>

                {/* Avatar / Initials */}
                <div style={{ 
                  width: '52px', 
                  height: '52px', 
                  borderRadius: '16px', 
                  background: 'var(--primary-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'var(--primary-light)',
                  flexShrink: 0,
                  border: index === 0 ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                  padding: '2px'
                }}>
                  {item.photoURL ? (
                    <img src={item.photoURL} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.3px' }}>{item.name}</span>
                    <motion.span 
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ 
                        fontSize: '9px', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '6px',
                        fontWeight: '900',
                        textTransform: 'uppercase'
                      }}
                    >
                      PLUS
                    </motion.span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '500' }}>
                    ⚡ {item.totalClasses} classes tracked
                  </div>
                </div>

                {/* Stats */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '22px', 
                    fontWeight: '950', 
                    color: item.attendance >= 75 ? '#10b981' : item.attendance >= 65 ? '#f59e0b' : '#ef4444',
                    lineHeight: 1
                  }}>
                    {item.attendance}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginTop: '4px' }}>
                    Efficiency
                  </div>
                </div>

                {/* Special Treatment for Top 1 */}
                {index === 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    right: '-10px', 
                    background: '#fbbf24', 
                    color: '#000', 
                    padding: '15px 15px 5px 15px', 
                    transform: 'rotate(45deg)',
                    fontSize: '12px'
                  }}>
                    👑
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        <p>Leaderboard updates automatically when students sync their attendance.</p>
      </footer>
    </div>
  );
}

export default Community;
