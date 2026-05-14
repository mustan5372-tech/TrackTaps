import React from 'react';
import logo from '../../icon.png';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';

function MobileHeader() {
  const { subscription, podaiSyncStatus } = useAppStore();
  
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
      <img src={logo} alt="TrackTaps" className="mobile-header-logo" />
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: isSyncing ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-glow)',
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${isSyncing ? 'rgba(16, 185, 129, 0.3)' : 'var(--primary-glow)'}`,
              transition: 'all 0.3s ease'
            }}
          >
            <motion.div
              animate={isSyncing ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isSyncing ? '#10b981' : 'var(--primary)'
              }}
            />
            <span style={{ 
              fontSize: '9px', 
              fontWeight: '800', 
              color: isSyncing ? '#10b981' : 'var(--primary-light)',
              letterSpacing: '0.05em'
            }}>
              {isSyncing ? 'SYNCING...' : 'AUTO-SYNC'}
            </span>
          </motion.div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={downloadFile}
          style={{
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid var(--primary-glow)',
            color: 'var(--primary-light)',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <span>🤖</span> APK
        </motion.button>
      </div>
    </header>
  );
}

export default MobileHeader;
