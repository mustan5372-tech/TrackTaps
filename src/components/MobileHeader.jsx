import React from 'react';
import logo from '../../icon.png';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';

function MobileHeader() {
  const { user, login, subscription, podaiSyncStatus } = useAppStore();
  
  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = '/TrackTaps.apk';
    link.download = 'TrackTaps.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPremium = subscription?.status === 'active';
  const isSyncing = podaiSyncStatus?.syncing;

  return (
    <header className="mobile-header">
      {/* LEFT: Logo */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <img 
          src={logo} 
          alt="TrackTaps" 
          className="mobile-header-logo" 
          style={{ 
            height: '28px', 
            width: 'auto',
            filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))'
          }} 
        />
      </div>
      
      {/* CENTER: APK Button (Disabled) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            color: 'var(--text-dim)',
            padding: '7px 12px',
            borderRadius: '100px',
            fontSize: '9px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.8
          }}
        >
          <span style={{ fontSize: '12px' }}>⏳</span> 
          <span>SOON</span>
        </div>
      </div>
 
      {/* RIGHT: Login Button or Premium Status */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {user ? (
          // If logged in, show premium status
          isPremium ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isSyncing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                padding: '6px 12px',
                borderRadius: '100px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSyncing ? '0 0 10px rgba(16, 185, 129, 0.1)' : '0 0 10px rgba(139, 92, 246, 0.1)'
              }}
            >
              <motion.div
                animate={isSyncing ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isSyncing ? '#10b981' : 'var(--primary-light)',
                  boxShadow: isSyncing ? '0 0 8px #10b981' : '0 0 8px var(--primary-light)'
                }}
              />
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '900', 
                color: isSyncing ? '#10b981' : 'var(--primary-light)',
                letterSpacing: '0.05em'
              }}>
                {isSyncing ? 'SYNCING' : 'PLUS'}
              </span>
            </motion.div>
          ) : null
        ) : (
          // If NOT logged in, show Login Button
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => login()}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)',
              border: 'none',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '800',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
              letterSpacing: '0.02em'
            }}
          >
            Login
          </motion.button>
        )}
      </div>
    </header>
  );
}

export default MobileHeader;
