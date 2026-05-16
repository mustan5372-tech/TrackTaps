import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function Referral() {
  const navigate = useNavigate();
  const { referralData, user, showToast } = useAppStore();
  
  const ensureReferralData = useAppStore(state => state.ensureReferralData);
  
  useEffect(() => {
    ensureReferralData();
  }, [ensureReferralData]);

  const validReferrals = referralData?.totalValidReferrals || 0;
  const analytics = referralData?.analytics || { totalSignups: 0, activeUsers: 0 };
  const target = 10;
  const progress = Math.min((validReferrals / target) * 100, 100);
  const isCampaignCompleted = referralData?.referralCampaignCompleted || false;
  
  const activeCode = referralData?.referralCode || '';
  const referralLink = activeCode ? `https://tracktaps.online?ref=${activeCode}` : '';

  const handleCopy = () => {
    if (!referralLink) {
      showToast("⏳ Generating your link, please wait...", "info");
      return;
    }
    navigator.clipboard.writeText(referralLink);
    showToast("📋 Invite link copied to clipboard!", "success");
  };

  const handleShareWhatsApp = () => {
    if (!referralLink) return;
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎓 Campus Launch</span>
               <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>•</span>
               <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {referralData?.referralId || 'Generating...'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="referral-content" style={{ display: 'grid', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Campaign Status Banner */}
        {isCampaignCompleted ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="dashboard-card" 
            style={{ 
              padding: '40px 32px', 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '2px solid var(--success)',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)'
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px' }}>Reward Successfully Claimed!</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px' }}>
              You have already completed the Early Campus Campaign and unlocked <strong>15 Days of Premium Plus</strong>.
            </p>
            <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Campaign Status: <span style={{ color: 'var(--success)', fontWeight: '800' }}>COMPLETED</span>
            </div>
          </motion.div>
        ) : (
          <div className="dashboard-card" style={{ 
            padding: '32px', 
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid var(--primary-glow)',
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
              Unlock 15 Days Premium Plus
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px' }}>
              🎓 Invite 10 Active Students and Unlock<br/>
              <strong>15 Days of TrackTaps Premium Plus FREE</strong>
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
                {validReferrals >= target ? "🎉 Threshold met! Activating Premium..." : `Only unique active students who sync Pod.ai count towards your reward.`}
              </p>
            </div>
          </div>
        )}

        {/* Analytics Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="dashboard-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '8px' }}>Total Signups</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)' }}>{analytics.totalSignups || 0}</span>
          </div>
          <div className="dashboard-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '8px' }}>Active Users</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--success)' }}>{analytics.validReferrals || 0}</span>
          </div>
        </div>

        {/* Share Section */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
            {isCampaignCompleted ? 'Continue Sharing' : 'Start Sharing Your Invite Link'}
          </h4>
          
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
              value={referralLink || 'Generating your unique code...'} 
              style={{ 
                flex: 1, 
                background: 'none', 
                border: 'none', 
                color: referralLink ? 'var(--text-dim)' : 'var(--text-muted)', 
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
              disabled={!referralLink}
              style={{ 
                padding: '14px', 
                background: '#25D366', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: referralLink ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: referralLink ? 1 : 0.5
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
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>Anti-Abuse Rules</h4>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '👤', text: 'Each referral must be a UNIQUE student identity.' },
              { icon: '🔄', text: 'Validation requires a successful Pod.ai Sync.' },
              { icon: '🚫', text: 'Duplicate Pod.ai accounts will NOT be counted.' },
              { icon: '🔒', text: 'One-time reward: 15 days of Premium Plus.' }
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Referral List */}
        <div className="referral-list-section">
          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '800' }}>
            Referral Activity Funnel
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {referralData?.referrals?.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--surface-glass)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤝</div>
                <p style={{ fontSize: '14px' }}>No referrals yet. Share your link to start earning!</p>
              </div>
            ) : (
              [...(referralData?.referrals || [])].reverse().map((ref, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '16px',
                    background: 'var(--surface-glass)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Student Joined</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ref.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: '900', 
                      padding: '4px 10px', 
                      borderRadius: '100px', 
                      background: ref.status === 'synced' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: ref.status === 'synced' ? 'var(--success)' : 'var(--warning)',
                      border: `1px solid ${ref.status === 'synced' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {ref.status === 'synced' ? 'VALIDATED' : 'PENDING'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '600' }}>
                      {ref.status === 'synced' ? 'Active student verified' : 'Awaiting Pod.ai Sync'}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Referral;
