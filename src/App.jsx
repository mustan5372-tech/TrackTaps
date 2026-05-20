import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Referral from './pages/Referral';
import Guide from './pages/Guide';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import useAppStore from './store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalToast from './components/GlobalToast';
import AuthModal from './components/AuthModal';
import TermsModal from './components/TermsModal';
import Onboarding from './components/Onboarding';
import DownloadAPK from './components/DownloadAPK';
import ErrorBoundary from './components/ErrorBoundary';
import analyticsService from './services/analyticsService';
import presenceService from './services/presenceService';
import OfflineBanner from './components/OfflineBanner';

const SafeRoute = ({ children }) => {
  const { user, isAuthLoading } = useAppStore();
  const location = useLocation();
  
  if (isAuthLoading) {
    return null;
  }
  
  const isPublicPage = ['/', '/guide', '/terms', '/privacy'].includes(location.pathname);
  
  if (!user && !isPublicPage) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <AppShell>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppShell>
  );
};

function App() {
  const { initAuth, isAuthLoading, isRestoringSession, isSigningOut, isAuthModalOpen, setAuthModalOpen } = useAppStore();
  const [isStaging, setIsStaging] = React.useState(false);
  const [swUpdateAvailable, setSwUpdateAvailable] = React.useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setSwUpdateAvailable(true);
    };
    window.addEventListener('swUpdateAvailable', handleUpdate);

    // 🔍 GROWTH PHASE: Capture Referral Code
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      console.log(`🎁 [Referral] Captured invite code: ${refCode}`);
      sessionStorage.setItem('tracktaps_invited_by', refCode);
    }

    // Detect environment for Staging Badge
    const hostname = window.location.hostname;
    const isProd = hostname === 'tracktaps.online' || hostname === 'www.tracktaps.online';
    setIsStaging(!isProd && hostname !== '');

    // Initialize Anonymous Visitor Intelligence Tracking System
    analyticsService.initVisitor();

    // Initialize Auth
    const unsubscribePromise = initAuth();
    
    // RETENTION PHASE 6: Smart Local Notifications
    setTimeout(() => {
      const state = useAppStore.getState();
      if (state.user && !state.isAuthLoading) {
        // 1. Sync Reminder
        const lastSync = state.lastCloudSync ? new Date(state.lastCloudSync) : null;
        const hoursSinceSync = lastSync ? (new Date() - lastSync) / (1000 * 60 * 60) : 999;
        
        if (hoursSinceSync > 24) {
          state.showToast("☁️ Backup Reminder: You haven't synced your data in 24h.", "info");
        }

        // 2. Risk Alert
        if (state.dashboardStats.criticalSubjects > 0) {
          state.showToast(`🚨 Attention: ${state.dashboardStats.criticalSubjects} subject(s) need immediate attention.`, "warning");
        }
      }
    }, 4000); // Trigger 4s after launch to avoid clash
    
    // 📱 Resume Handling (APK & Backgrounding)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("📱 [App] Resumed. Recovering state...");
        const state = useAppStore.getState();
        
        // Recover UI state smoothly
        if (state.user) {
          state.fullSync();
          
          // Presence heartbeat on resume
          presenceService.sendHeartbeat(state.user.uid);
          
          // Re-trigger sync if we came online while asleep
          if (!state.isOffline && state.pendingCloudSync) {
            state.pushToCloud();
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribePromise.then(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [initAuth]);

  if (isAuthLoading) {
    return (
      <div style={{
        height: '100vh',
        height: '100dvh',
        width: '100vw',
        width: '100dvw',
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
          <img src="/logo.png" alt="TrackTaps" style={{ width: '140px', height: '140px', filter: 'drop-shadow(0 0 30px var(--primary-glow))' }} />
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
            {isSigningOut ? 'Signing out...' : isRestoringSession ? 'Restoring Session' : 'Initializing Ecosystem'}
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
      <OfflineBanner />
      <GlobalToast />
      <ErrorBoundary>
        <Onboarding />
      </ErrorBoundary>
      <DownloadAPK />
      <AnimatePresence>
        {swUpdateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              right: '24px',
              maxWidth: '480px',
              margin: '0 auto',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              zIndex: 999999,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.15)'
            }}
          >
            <div style={{ color: 'white', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🚀</span>
              <span style={{ fontWeight: '700', textAlign: 'left' }}>New TrackTaps update available. Refresh to get latest improvements.</span>
            </div>
            <button
              onClick={() => {
                window.location.reload(true);
              }}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--primary-glow)',
                whiteSpace: 'nowrap'
              }}
            >
              Refresh Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <TermsModal />
      
      <Routes>
        <Route path="/pod" element={<ErrorBoundary><Pod /></ErrorBoundary>} />
        <Route path="/" element={<SafeRoute><Home /></SafeRoute>} />
        <Route path="/calendar" element={<SafeRoute><Calendar /></SafeRoute>} />
        <Route path="/timetable" element={<SafeRoute><Timetable /></SafeRoute>} />
        <Route path="/subjects" element={<SafeRoute><Subjects /></SafeRoute>} />
        <Route path="/insights" element={<SafeRoute><Insights /></SafeRoute>} />
        <Route path="/history" element={<SafeRoute><History /></SafeRoute>} />
        <Route path="/about" element={<SafeRoute><About /></SafeRoute>} />
        <Route path="/settings" element={<SafeRoute><Settings /></SafeRoute>} />
        <Route path="/premium" element={<SafeRoute><Premium /></SafeRoute>} />
        <Route path="/admin" element={<SafeRoute><Admin /></SafeRoute>} />
        <Route path="/ai-import" element={<SafeRoute><AiSemesterImport /></SafeRoute>} />
        <Route path="/bunk-calculator" element={<SafeRoute><BunkCalculator /></SafeRoute>} />
        <Route path="/community" element={<SafeRoute><Community /></SafeRoute>} />
        <Route path="/referral" element={<SafeRoute><Referral /></SafeRoute>} />
        <Route path="/guide" element={<SafeRoute><Guide /></SafeRoute>} />
        <Route path="/terms" element={<SafeRoute><Terms /></SafeRoute>} />
        <Route path="/privacy" element={<SafeRoute><Privacy /></SafeRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
