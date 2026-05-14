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
import useAppStore from './store/appStore';
import { motion } from 'framer-motion';
import GlobalToast from './components/GlobalToast';
import logo from '../icon.png';

function App() {
  const { initAuth, isAuthLoading, isRestoringSession } = useAppStore();

  useEffect(() => {
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
      <GlobalToast />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
