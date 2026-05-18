import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';

function TermsModal() {
  const { user, termsAccepted, termsVersion, acceptTerms } = useAppStore();
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine if modal should show: user is logged in, but terms is not yet accepted/version incorrect
  const shouldShow = !!user && (!termsAccepted || termsVersion !== 'v1.0');

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await acceptTerms(marketing);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 15 }}
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '420px',
              padding: 'clamp(20px, 6vw, 32px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.1)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-main)', margin: '0 0 10px' }}>
                Welcome to TrackTaps 👋
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-dim)', lineHeight: '1.6', margin: 0 }}>
                Before continuing, please review and accept our Terms of Service and Privacy Policy to access your dashboard.
              </p>
            </div>

            {/* Quick Link Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <a 
                href="/terms" 
                target="_blank" 
                rel="noreferrer" 
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'var(--primary-light)',
                  fontSize: '12px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                📜 View Terms
              </a>
              <a 
                href="/privacy" 
                target="_blank" 
                rel="noreferrer" 
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'var(--primary-light)',
                  fontSize: '12px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                🔒 View Privacy
              </a>
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              
              {/* Mandatory */}
              <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    marginTop: '3px',
                    accentColor: 'var(--primary)',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '13px', color: agreed ? 'var(--text-main)' : 'var(--text-dim)', lineHeight: '1.5', fontWeight: '500' }}>
                  I agree to the <strong style={{ color: 'var(--primary-light)' }}>Terms & Conditions</strong> and <strong style={{ color: 'var(--primary-light)' }}>Privacy Policy</strong>.
                </span>
              </label>

              {/* Optional Marketing */}
              <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  style={{
                    marginTop: '3px',
                    accentColor: 'var(--primary)',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  I agree to receive important updates, academic resources, and campus announcements (Optional).
                </span>
              </label>

            </div>

            {/* Actions */}
            <motion.button
              whileHover={{ scale: agreed ? 1.02 : 1 }}
              whileTap={{ scale: agreed ? 0.98 : 1 }}
              onClick={handleAccept}
              disabled={!agreed || loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: agreed 
                  ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)' 
                  : 'rgba(255,255,255,0.05)',
                color: agreed ? 'white' : 'var(--text-muted)',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                cursor: agreed && !loading ? 'pointer' : 'not-allowed',
                boxShadow: agreed ? '0 10px 20px var(--primary-glow)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Securing Agreement...' : 'Accept & Continue'}
            </motion.button>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TermsModal;
