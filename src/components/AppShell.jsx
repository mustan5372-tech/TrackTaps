import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import DownloadAPK from './DownloadAPK';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

function AppShell({ children }) {
  const { subscription, role } = useAppStore();
  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  return (
    <div className={`app-container ${isPremium ? 'premium-theme-active' : ''}`} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Spectacular dynamic glowing background aura for premium users */}
      {isPremium && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {/* Animated Gold Aura */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -50, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '60vw',
              height: '60vw',
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.06) 0%, transparent 70%)',
              filter: 'blur(100px)'
            }}
          />
          {/* Animated Purple Aura */}
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -60, 0],
              y: [0, 60, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              bottom: '-25%',
              left: '-10%',
              width: '65vw',
              height: '65vw',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
              filter: 'blur(120px)'
            }}
          />
          
          {/* Subtle floating gold stars/dust particles */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(234, 179, 8, 0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.4
          }} />
        </div>
      )}

      <Sidebar />
      <MainContent>{children}</MainContent>
      <DownloadAPK />
    </div>
  );
}

export default AppShell;
