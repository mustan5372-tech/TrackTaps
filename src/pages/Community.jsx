import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import communityService from '../services/communityService';
import { useNavigate } from 'react-router-dom';

function Community() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const data = await communityService.getLeaderboard();
      setLeaderboard(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  return (
    <div className="community-page" style={{ padding: '24px 16px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '14px', marginBottom: '16px', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>
          Community <span style={{ color: 'var(--primary)' }}>Pulse</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Compete with the top achievers this week.</p>
      </div>

      {/* The Podium (Top 3) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', marginBottom: '40px', height: '240px' }}>
        {/* Silver - 2nd */}
        {top3[1] && <PodiumCard user={top3[1]} rank={2} color="#94a3b8" height="160px" />}
        {/* Gold - 1st */}
        {top3[0] && <PodiumCard user={top3[0]} rank={1} color="#f59e0b" height="200px" highlight />}
        {/* Bronze - 3rd */}
        {top3[2] && <PodiumCard user={top3[2]} rank={3} color="#b45309" height="140px" />}
      </div>

      {/* Motivation Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '32px',
          textAlign: 'center'
        }}
      >
        <h4 style={{ color: 'var(--primary-light)', fontSize: '14px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Daily Spark ✨</h4>
        <p style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>
          "Success is the sum of small efforts, repeated day in and day out. Keep your streak alive!"
        </p>
      </motion.div>

      {/* The Rest of the Leaderboard */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Top Achievers</h3>
        {others.map((u, idx) => (
          <motion.div 
            key={u.uid}
            variants={item}
            style={{ 
              background: 'var(--surface-glass)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-dim)', width: '24px' }}>{idx + 4}</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              {u.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', margin: 0 }}>
                {u.name} {u.isPremium && <span title="Premium Member">💎</span>}
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '12px', margin: 0 }}>Attendance: {u.attendance}%</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--primary-light)', fontWeight: '900', fontSize: '14px' }}>{Math.round(u.score)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Pts</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function PodiumCard({ user, rank, color, height, highlight }) {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: rank * 0.1 }}
      style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ 
          width: highlight ? '64px' : '48px', 
          height: highlight ? '64px' : '48px', 
          borderRadius: '50%', 
          border: `3px solid ${color}`,
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: highlight ? '24px' : '20px',
          boxShadow: highlight ? `0 0 20px ${color}44` : 'none'
        }}>
          {user.name.charAt(0)}
        </div>
        <div style={{ 
          position: 'absolute', 
          bottom: '-8px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: color,
          color: '#fff',
          borderRadius: '8px',
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: '900'
        }}>
          #{rank}
        </div>
      </div>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
          {user.name}
        </p>
        <p style={{ fontSize: '14px', fontWeight: '900', color: color, margin: 0 }}>{user.attendance}%</p>
      </div>
      <div style={{ 
        width: '100%', 
        height: height, 
        background: `linear-gradient(to bottom, ${color}22, ${color}05)`,
        border: `1px solid ${color}33`,
        borderBottom: 'none',
        borderRadius: '12px 12px 0 0'
      }} />
    </motion.div>
  );
}

export default Community;
