import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GuideCard = ({ title, icon, color, steps }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      layout
      className="dashboard-card"
      style={{
        padding: '24px',
        borderLeft: `4px solid ${color}`,
        cursor: 'pointer',
        background: isOpen ? 'rgba(255,255,255,0.02)' : 'var(--surface-glass)',
        transition: 'background 0.3s'
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '16px', 
            background: `${color}20`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '24px',
            color: color
          }}>
            {icon}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{title}</h3>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function Guide() {
  const guides = [
    {
      title: 'Pod.ai Sync',
      icon: '🔄',
      color: '#8b5cf6',
      steps: [
        'Navigate to the Pod.ai module from the top header button.',
        'Sign in securely with your college email and password.',
        'TrackTaps securely fetches your subjects and attendance data.',
        'Tap "Sync to TrackTaps" to automatically update all your classes.'
      ]
    },
    {
      title: 'Smart Bunk Calculator',
      icon: '🏖️',
      color: '#ec4899',
      steps: [
        'Select any subject to view its specific bunk calculator.',
        'Your current attendance percentage and target criteria will be automatically applied.',
        'Instantly see how many classes you can afford to skip, or how many you need to attend to recover.'
      ]
    },
    {
      title: 'Community Leaderboard',
      icon: '🏆',
      color: '#f59e0b',
      steps: [
        'The leaderboard ranks students globally based on their average attendance.',
        'Top 3 elite students are showcased in the Champions Board.',
        'Ensure you sync your Pod.ai data regularly to stay at the top of the rankings.'
      ]
    },
    {
      title: 'AI Insights',
      icon: '📈',
      color: '#10b981',
      steps: [
        'AI Insights analyze your attendance patterns across all subjects.',
        'Receive actionable advice on which subjects need urgent attention.',
        'Unlock AI-driven predictions and weekly summaries with Premium Plus.'
      ]
    },
    {
      title: 'Premium Plus & Referrals',
      icon: '💎',
      color: '#3b82f6',
      steps: [
        'Premium Plus unlocks Cloud Sync, Advanced AI Insights, and exclusive themes.',
        'You can get 15 Days of Premium Plus for FREE by inviting 10 friends.',
        'Go to the Referral menu, copy your unique link, and share it with classmates.'
      ]
    }
  ];

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>
          How to Use <span style={{ color: 'var(--primary-light)' }}>TrackTaps</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
          Master your attendance and never worry about falling behind again. Explore the interactive guides below.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {guides.map((guide, idx) => (
          <GuideCard key={idx} {...guide} />
        ))}
      </div>

      <div className="dashboard-card" style={{ marginTop: '32px', padding: '32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0) 100%)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>Still need help?</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
          If you encounter any issues or have suggestions for TrackTaps, feel free to reach out to the core team.
        </p>
        <button style={{
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '12px',
          fontWeight: '700',
          cursor: 'pointer'
        }}>
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default Guide;
