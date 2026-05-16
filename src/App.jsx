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
import AuthModal from './components/AuthModal';
import logo from '../icon.png';

function App() {
  const { initAuth, isAuthLoading, isRestoringSession, isAuthModalOpen, setAuthModalOpen } = useAppStore();
  const [isStaging, setIsStaging] = React.useState(false);

  useEffect(() => {
    // Detect environment for Staging Badge
    const hostname = window.location.hostname;
    const isProd = hostname === 'tracktaps.online' || hostname === 'www.tracktaps.online';
    setIsStaging(!isProd && hostname !== '');

    // Initialize Auth (which also initializes theme from appStore)
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
        gap: '24px'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img src={logo} alt="TrackTaps" style={{ width: '120px', height: '120px', filter: 'drop-shadow(0 0 20px var(--primary-glow))' }} />
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: '32px', height: '32px', border: '3px solid var(--primary-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}
          />
          <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {isRestoringSession ? 'Restoring your session...' : 'Initializing Ecosystem...'}
          </span>
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
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
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
    </BrowserRouter>
  );
}

export default App;
