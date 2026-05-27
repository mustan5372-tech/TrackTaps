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
  
  // Advanced UX states
  const [filterType, setFilterType] = useState('attendance'); // 'attendance' | 'classes'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLeaderboard();
    try {
      import('../services/analyticsService').then(m => m.default.trackFeatureUse('community')).catch(() => {});
    } catch (e) {}
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityService.fetchLeaderboard(20);
      setLeaderboard(data);
    } catch (err) {
      console.error("Community Page Error:", err);
      const { isOffline } = useAppStore.getState();
      if (isOffline) {
        setError("You are offline. Please check your internet connection.");
      } else {
        setError("Leaderboard is currently unavailable. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Sorting & Filtering logic
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (filterType === 'classes') {
      return (b.totalClasses || 0) - (a.totalClasses || 0);
    }
    return (b.attendance || 0) - (a.attendance || 0);
  });

  const filteredLeaderboard = sortedLeaderboard.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myLeaderboardRank = user ? leaderboard.findIndex(x => x.uid === user.uid) : -1;
  const myRecord = myLeaderboardRank !== -1 ? leaderboard[myLeaderboardRank] : null;

  // Podium variables based on percentage attendance
  const podiumScholars = [...leaderboard].sort((a, b) => (b.attendance || 0) - (a.attendance || 0)).slice(0, 3);
  const goldChamp = podiumScholars[0];
  const silverChamp = podiumScholars[1];
  const bronzeChamp = podiumScholars[2];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="community-view" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)', paddingBottom: '120px' }}>
      {/* Header Section */}
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
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
          🏆 TRACKTAPS ELITE SQUAD
        </motion.div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: '950', marginBottom: '12px', letterSpacing: '-1.5px', lineHeight: 1 }}>
          The Academic <span style={{ background: 'linear-gradient(135deg, var(--primary-light), #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hall of Fame</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
          Celebrating consistent class attendees and elite discipline stars across our campus network.
        </p>
      </header>

      {/* INTERACTIVE CHAMPION PODIUM DECK */}
      {!loading && !error && leaderboard.length > 0 && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid var(--border)', 
          borderRadius: '32px', 
          padding: '24px 16px', 
          marginBottom: '40px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '24px', letterSpacing: '0.5px' }}>🏆 CORE PODIUM CHAMPIONS</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', maxWidth: '600px', margin: '0 auto', height: '260px' }}>
            {/* 2nd Place */}
            {silverChamp && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
              >
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <div style={{ width: '58px', height: '58px', borderRadius: '50%', border: '3px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                    {silverChamp.photoURL ? (
                      <img src={silverChamp.photoURL} alt={silverChamp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#000' }}>
                        {silverChamp.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#cbd5e1', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                </div>
                <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-main)', textAlign: 'center', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{silverChamp.name?.split(' ')[0]}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 8px', fontWeight: '700' }}>{silverChamp.attendance}%</div>
                <div style={{ width: '100%', height: '70px', background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.15) 0%, rgba(203, 213, 225, 0.02) 100%)', border: '1px solid rgba(203, 213, 225, 0.2)', borderBottom: 'none', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '20px' }}>🥈</span>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {goldChamp && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 120 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.2, zIndex: 10 }}
              >
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <motion.div 
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '22px' }}
                  >
                    👑
                  </motion.div>
                  <div style={{ width: '74px', height: '74px', borderRadius: '50%', border: '4px solid #fbbf24', overflow: 'hidden', boxShadow: '0 12px 24px rgba(251, 191, 36, 0.3)' }}>
                    {goldChamp.photoURL ? (
                      <img src={goldChamp.photoURL} alt={goldChamp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: '#000' }}>
                        {goldChamp.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#fbbf24', color: '#000', width: '22px', height: '22px', borderRadius: '50%', fontSize: '12px', fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>1</span>
                </div>
                <div style={{ fontWeight: '900', fontSize: '14px', color: '#fbbf24', textAlign: 'center', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goldChamp.name?.split(' ')[0]}</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--success)', margin: '2px 0 8px' }}>{goldChamp.attendance}%</div>
                <div style={{ width: '100%', height: '110px', background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.02) 100%)', border: '2px solid rgba(251, 191, 36, 0.3)', borderBottom: 'none', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, transparent 75%)', pointerEvents: 'none' }} />
                  <span style={{ fontSize: '28px', filter: 'drop-shadow(0 4px 6px rgba(251, 191, 36, 0.3))' }}>🥇</span>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {bronzeChamp && (
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
              >
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '50%', border: '3px solid #f97316', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                    {bronzeChamp.photoURL ? (
                      <img src={bronzeChamp.photoURL} alt={bronzeChamp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: '#000' }}>
                        {bronzeChamp.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#f97316', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                </div>
                <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-main)', textAlign: 'center', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bronzeChamp.name?.split(' ')[0]}</div>
                <div style={{ fontSize: '11px', color: '#f97316', margin: '2px 0 8px', fontWeight: '700' }}>{bronzeChamp.attendance}%</div>
                <div style={{ width: '100%', height: '55px', background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.02) 100%)', border: '1px solid rgba(249, 115, 22, 0.2)', borderBottom: 'none', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px' }}>🥉</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* PERSONAL LIVE RANK CARD */}
      {!loading && !error && myRecord && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '24px',
            padding: '16px 20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '32px' }}>⚡</div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Your Live Position</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '2px 0 0' }}>
                You currently rank <strong style={{ color: 'var(--primary-light)' }}>#{myLeaderboardRank + 1}</strong> out of all tracked scholars!
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '950', color: 'var(--primary-light)', lineHeight: 1.1 }}>{myRecord.attendance}%</div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{myRecord.totalClasses || 0} classes</span>
          </div>
        </motion.div>
      )}

      {/* FILTER BUTTONS & SEARCH BAR */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Toggle */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '4px', display: 'inline-flex', gap: '4px' }}>
              <button
                onClick={() => setFilterType('attendance')}
                style={{
                  background: filterType === 'attendance' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                📊 Score Leader
              </button>
              <button
                onClick={() => setFilterType('classes')}
                style={{
                  background: filterType === 'classes' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Grind Streak
              </button>
            </div>

            {/* Premium Indicator Notice */}
            {!isPremium && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                🔒 Free plan shows Top 3. <strong style={{ color: 'var(--primary-light)', cursor: 'pointer' }} onClick={() => navigate('/premium')}>Unlock Top 20</strong>
              </span>
            )}
          </div>

          {/* Search bar input */}
          <input
            type="text"
            placeholder="🔍 Search scholars in community..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '14px 18px',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-light)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="leaderboard-container" style={{ position: 'relative', minHeight: '300px' }}>
        <style>{`
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          .skeleton-shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite linear;
            background-color: rgba(255,255,255,0.02);
          }
        `}</style>
        {loading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-shimmer" style={{ height: '94px', borderRadius: '24px', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px dashed #ef4444' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            <button 
              onClick={loadLeaderboard}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gap: '16px' }}
          >
            {/* Conditional List Rendering: Top 3 for Free, Top 20 for Premium */}
            {filteredLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <p>No champions matched your query...</p>
              </div>
            ) : (
              (isPremium ? filteredLeaderboard.slice(0, 20) : filteredLeaderboard.slice(0, 3)).map((item, index) => (
                <motion.div
                  key={item.uid}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="leaderboard-item-row"
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
                    opacity: !isPremium && index > 2 ? 0.4 : 1, 
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
