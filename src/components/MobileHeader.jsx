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
    <header className="mobile-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: '64px',
      position: 'relative'
    }}>
      {/* LEFT: Logo */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <img src={logo} alt="TrackTaps" className="mobile-header-logo" style={{ height: '32px', width: 'auto' }} />
      </div>
      
      {/* CENTER: APK Button */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={downloadFile}
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            color: 'var(--primary-light)',
            padding: '6px 14px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)'
          }}
        >
          <span>🤖</span> APK
        </motion.button>
      </div>

      {/* RIGHT: Login Button or Premium Status */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
        {user ? (
          // If logged in, show premium status or nothing (to keep it clean as requested)
          isPremium && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: isSyncing ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <motion.div
                animate={isSyncing ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: isSyncing ? '#10b981' : 'var(--primary)'
                }}
              />
              <span style={{ fontSize: '8px', fontWeight: '800', color: isSyncing ? '#10b981' : 'var(--primary-light)' }}>
                {isSyncing ? 'SYNC' : 'PLUS'}
              </span>
            </motion.div>
          )
        ) : (
          // If NOT logged in, show Login Button
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => login()}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #6d28d9 100%)',
              border: 'none',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: '800',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
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
