import React from 'react';
import logo from '../../icon.png';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';

function MobileHeader() {
  const { user, login, subscription, podaiSyncStatus, setAuthModalOpen, setApkModalOpen } = useAppStore();
  
  const isNativeAPK = () => {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
  };

  const isPremium = subscription?.status === 'active';
  const isSyncing = podaiSyncStatus?.syncing;

  return (
    <header className="mobile-header" data-nosnippet>
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
      
      {/* CENTER: APK Button (Enabled only for Web browser) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {!isNativeAPK() && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setApkModalOpen(true)}
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: 'var(--primary-light)',
              padding: '6px 12px',
              borderRadius: '100px',
              fontSize: '9px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
              letterSpacing: '0.05em'
            }}
          >
            <span style={{ fontSize: '11px' }}>📱</span> 
            <span>GET APK</span>
          </motion.button>
        )}
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
                background: isSyncing ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
                padding: '6px 12px',
                borderRadius: '100px',
                border: `1px solid ${isSyncing ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.4)'}`,
                boxShadow: isSyncing ? '0 0 10px rgba(16, 185, 129, 0.1)' : '0 0 12px rgba(234, 179, 8, 0.2)'
              }}
            >
              <motion.div
                animate={isSyncing ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isSyncing ? '#10b981' : '#f59e0b',
                  boxShadow: isSyncing ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
                }}
              />
              <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>👑</span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '900', 
                color: isSyncing ? '#10b981' : '#f59e0b',
                letterSpacing: '0.08em'
              }}>
                {isSyncing ? 'SYNCING' : 'ELITE PLUS'}
              </span>
            </motion.div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '6px 12px',
              borderRadius: '100px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '800', 
                color: 'var(--text-dim)',
                letterSpacing: '0.05em'
              }}>
                FREE TIER
              </span>
            </div>
          )
        ) : (
          // If NOT logged in, show Login Button
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAuthModalOpen(true)}
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
