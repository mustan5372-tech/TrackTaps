import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function DownloadPage() {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Countdown timer before triggering download
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerDownload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const triggerDownload = () => {
    // Redirect directly to the self-hosted path to download the latest compiled APK
    window.location.href = '/TrackTaps_v1.8.2.apk';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .step-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
        }
        .step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #a78bfa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 850;
          flex-shrink: 0;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '28px',
          padding: '40px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Animated Download Orb */}
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 28px auto' }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)',
              filter: 'blur(8px)'
            }}
          />
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px'
          }}>
            📥
          </div>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          {countdown > 0 ? `Starting Download in ${countdown}s...` : 'Downloading TrackTaps...'}
        </h2>
        
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
          Please wait while the latest stable Version 1.8.2 APK package downloads to your phone.
        </p>

        {/* Retry trigger */}
        {countdown === 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={triggerDownload}
            style={{
              width: '100%',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#c084fc',
              padding: '14px 20px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '36px',
              transition: 'background 0.2s'
            }}
          >
            Not downloading? Tap to retry 🔄
          </motion.button>
        )}

        {/* Reassuring Steps */}
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0', textAlign: 'left' }}>
          Quick Installation Steps
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="step-card">
            <div className="step-num">1</div>
            <div>
              <h5 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: 'white' }}>Tap "Download Anyway"</h5>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>If your phone warns you about third-party applications.</p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-num">2</div>
            <div>
              <h5 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: 'white' }}>Open the APK file</h5>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Pull down your notification drawer or check your downloads.</p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-num">3</div>
            <div>
              <h5 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: 'white' }}>Allow Installation</h5>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Allow "Install from Unknown Sources" if prompted by Android.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DownloadPage;
