import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function DownloadPage() {
  const navigate = useNavigate();

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
        {/* Animated Icon Orb */}
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 28px auto' }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, rgba(234, 179, 8, 0) 70%)',
              filter: 'blur(8px)'
            }}
          />
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px'
          }}>
            🛠️
          </div>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'white', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          APK Coming Soon! ⏳
        </h2>
        
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
          The native TrackTaps Android APK is currently under internal stability testing to ensure high performance and seamless background sync.
        </p>

        <div style={{ 
          background: 'rgba(234, 179, 8, 0.1)', 
          border: '1px solid rgba(234, 179, 8, 0.25)', 
          borderRadius: '16px', 
          padding: '16px 20px',
          color: '#fde047',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '28px',
          textAlign: 'left',
          lineHeight: '1.5'
        }}>
          💡 <b>Tip:</b> TrackTaps Web App is 100% functional, responsive, and syncs across all your devices!
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--primary, #8b5cf6) 0%, #6d28d9 100%)',
            border: 'none',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
          }}
        >
          Open TrackTaps Web App 🚀
        </motion.button>
      </motion.div>
    </div>
  );
}

export default DownloadPage;

