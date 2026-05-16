import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function Referral() {
  const navigate = useNavigate();
  const { referralData, user, showToast } = useAppStore();
  
  const totalInvited = referralData?.referrals?.length || 0;
  const validReferrals = referralData?.totalValidReferrals || 0;
  const target = 10;
  const progress = Math.min((validReferrals / target) * 100, 100);
  
  const referralLink = `https://tracktaps.online?ref=${referralData?.code || ''}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    showToast("📋 Invite link copied to clipboard!", "success");
  };

  const handleShareWhatsApp = () => {
    const text = `🚀 Track your attendance smarter with TrackTaps. Sync Pod.ai, calculate safe bunks, and manage your semester like a pro. Join using my link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="referral-view" style={{ paddingBottom: '120px' }}>
      <header className="view-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '20px' }}
          >
            ←
          </button>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Referral Campaign</h2>
            <p style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '700', textTransform: 'uppercase' }}>🎓 Limited Time Early Access</p>
          </div>
        </div>
      </header>

      <div className="referral-content" style={{ display: 'grid', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Campaign Hero */}
        <div className="dashboard-card" style={{ 
          padding: '32px', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid var(--primary-glow)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 5 }}
            style={{ fontSize: '48px', marginBottom: '16px' }}
          >
            🎁
          </motion.div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
            Get 30 Days Premium FREE
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px' }}>
            Invite 10 active students to TrackTaps and unlock all Plus features for a full month.
          </p>
          
          {/* Progress Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '700' }}>Campaign Progress</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary-light)' }}>{validReferrals}<span style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '500' }}> / {target}</span></span>
            </div>
            
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden', marginBottom: '8px' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)', borderRadius: '100px' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
              {validReferrals >= target ? "🎉 Reward Unlocked!" : `Invite ${target - validReferrals} more active students to unlock.`}
            </p>
          </div>
        </div>

        {/* Share Section */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>Share Your Invite Link</h4>
          
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-primary)', 
            padding: '4px', 
            borderRadius: '12px', 
            border: '1px solid var(--border)',
            marginBottom: '16px'
          }}>
            <input 
              readOnly 
              value={referralLink} 
              style={{ 
                flex: 1, 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-dim)', 
                padding: '12px', 
                fontSize: '13px',
                fontFamily: 'monospace'
              }} 
            />
            <button 
              onClick={handleCopy}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
            >
              Copy
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={handleShareWhatsApp}
              style={{ 
                padding: '14px', 
                background: '#25D366', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>WhatsApp</span>
            </button>
            <button 
              onClick={() => showToast("📱 Feature coming soon!", "info")}
              style={{ 
                padding: '14px', 
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: 'pointer'
              }}
            >
              Instagram
            </button>
          </div>
        </div>

        {/* Validation Info */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>How it works</h4>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '📩', text: 'Share your unique invite link with friends.' },
              { icon: '👤', text: 'Friend creates an account on TrackTaps.' },
              { icon: '🔄', text: 'Friend successfully syncs Pod.ai attendance.' },
              { icon: '✅', text: 'Referral becomes VALID after the sync.' }
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Referral List */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>Your Referrals ({totalInvited})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {referralData?.referrals?.length > 0 ? referralData.referrals.map((ref, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>Student #{ref.uid.substring(0, 5)}</div>
                <div style={{ 
                  fontSize: '10px', 
                  padding: '4px 10px', 
                  borderRadius: '100px', 
                  fontWeight: '800',
                  background: ref.status === 'synced' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: ref.status === 'synced' ? 'var(--success)' : 'var(--warning)',
                  textTransform: 'uppercase'
                }}>
                  {ref.status === 'synced' ? '✓ Validated' : '⌛ Pending Sync'}
                </div>
              </div>
            )) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>
                No referrals yet. Start sharing to unlock premium!
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Referral;
