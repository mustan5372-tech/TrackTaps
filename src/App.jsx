import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Timetable from './pages/Timetable';
import Subjects from './pages/Subjects';
import Insights from './pages/Insights';
import History from './pages/History';
import About from './pages/About';
import Settings from './pages/Settings';
import Pod from './pages/Pod';
import Premium from './pages/Premium';
import Admin from './pages/Admin';
import AiSemesterImport from './pages/AiSemesterImport';
import BunkCalculator from './pages/BunkCalculator';
import Community from './community/Community';
import useAppStore from './store/appStore';
import { motion } from 'framer-motion';
import GlobalToast from './components/GlobalToast';
import DownloadAPK from './components/DownloadAPK';
import ErrorBoundary from './components/ErrorBoundary';
import logo from './assets/logo.png';

function App() {
  const { initAuth, isAuthLoading, isRestoringSession, isAuthModalOpen, setAuthModalOpen } = useAppStore();
  const [isStaging, setIsStaging] = React.useState(false);

  useEffect(() => {
    // Detect environment for Staging Badge
    const hostname = window.location.hostname;
    const isProd = hostname === 'tracktaps.online' || hostname === 'www.tracktaps.online';
    setIsStaging(!isProd && hostname !== '');

    // Initialize Auth
    const unsubscribePromise = initAuth();
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  if (isAuthLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Premium Background Ambient Glow */}
        <div style={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          opacity: 0.15,
          filter: 'blur(60px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0
        }} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: [0.95, 1, 0.95],
            opacity: 1,
            filter: ['blur(4px)', 'blur(0px)', 'blur(4px)']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ zIndex: 1 }}
        >
          <img src={logo} alt="TrackTaps" style={{ width: '140px', height: '140px', filter: 'drop-shadow(0 0 30px var(--primary-glow))' }} />
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <div style={{ width: '180px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden', position: 'relative' }}>
             <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: '100%' }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               style={{ 
                 position: 'absolute',
                 inset: 0,
                 background: 'linear-gradient(90deg, transparent, var(--primary-light), transparent)',
                 width: '60%'
               }}
             />
          </div>
          <motion.span 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ 
              color: 'var(--text-dim)', 
              fontSize: '11px', 
              fontWeight: '800', 
              letterSpacing: '0.25em', 
              textTransform: 'uppercase',
              textAlign: 'center'
            }}
          >
            {isRestoringSession ? 'Restoring Session' : 'Initializing Ecosystem'}
          </motion.span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isStaging && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'rgba(245, 158, 11, 0.9)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '10px',
          fontWeight: '900',
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          Staging Build
        </div>
      )}
      <GlobalToast />
      <ErrorBoundary>
        <Onboarding />
      </ErrorBoundary>
      <DownloadAPK />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      <ErrorBoundary>
        <Routes>
          <Route path="/pod" element={<Pod />} />
          <Route path="/" element={<AppShell><Home /></AppShell>} />
          <Route path="/calendar" element={<AppShell><Calendar /></AppShell>} />
          <Route path="/timetable" element={<AppShell><Timetable /></AppShell>} />
          <Route path="/subjects" element={<AppShell><Subjects /></AppShell>} />
          <Route path="/insights" element={<AppShell><Insights /></AppShell>} />
          <Route path="/history" element={<AppShell><History /></AppShell>} />
          <Route path="/about" element={<AppShell><About /></AppShell>} />
          <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
          <Route path="/premium" element={<AppShell><Premium /></AppShell>} />
          <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
          <Route path="/ai-import" element={<AppShell><AiSemesterImport /></AppShell>} />
          <Route path="/bunk-calculator" element={<AppShell><BunkCalculator /></AppShell>} />
          <Route path="/community" element={<AppShell><Community /></AppShell>} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
