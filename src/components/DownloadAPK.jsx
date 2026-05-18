import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';

const DownloadAPK = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('android');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: '👋 Hello! I am the TrackTaps AI assistant. Ask me anything about your attendance buffer, skip safety, or semester goals!' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    subjects,
    dashboardStats,
    getSafeSubjects,
    getCriticalSubjects,
    attendanceSettings,
    subscription,
    fullSync
  } = useAppStore();

  // Helper to detect if we are in the native APK
  const isNativeAPK = () => {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    
    // Auto-select tab based on platform
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) setActiveTab('android');
    else if (ua.includes('iphone') || ua.includes('ipad')) setActiveTab('ios');
    else setActiveTab('windows');

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const downloadAPK = () => {
    const link = document.createElement('a');
    link.href = '/TrackTaps.apk';
    link.download = 'TrackTaps.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskAI = (query) => {
    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const defaultTarget = attendanceSettings?.defaultTarget || 75;
      const overall = dashboardStats?.overallPercentage || 0;
      
      const normalizedQuery = query.toLowerCase();

      if (normalizedQuery.includes('bunk') || normalizedQuery.includes('skip')) {
        const safe = getSafeSubjects ? getSafeSubjects() : [];
        if (safe.length > 0) {
          reply = `🛡️ You can safely skip classes in ${safe.length} subjects: ${safe.map(s => s.name).join(', ')}. Keep an eye on critical classes to stay above ${defaultTarget}%.`;
        } else {
          reply = `⚠️ Alert: You currently have 0 safe bunks! Skipping any classes right now will drop your score below your ${defaultTarget}% target.`;
        }
      } else if (normalizedQuery.includes('critical') || normalizedQuery.includes('risk')) {
        const critical = getCriticalSubjects ? getCriticalSubjects() : [];
        if (critical.length > 0) {
          reply = `🚨 Critical Risk: You have ${critical.length} subjects below your target: ${critical.map(s => s.name).join(', ')}. prioritize attending these next lectures!`;
        } else {
          reply = `✨ All clear! You have 0 critical subjects below your target threshold. Great consistency!`;
        }
      } else {
        reply = `📊 Your current overall attendance score is ${overall}%. Your semester target is set to ${defaultTarget}%. You are ${overall >= defaultTarget ? 'safe & on track' : 'below target criteria'}. Keep tracking with TrackTaps!`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const platforms = [
    { id: 'android', name: 'Android', icon: '🤖', description: 'Native APK' },
    { id: 'windows', name: 'Windows', icon: '💻', description: 'Desktop PWA' },
    { id: 'ios', name: 'iOS', icon: '🍎', description: 'Web App' }
  ];

  return (
    <>
      {/* Floating AI Orb Button */}
      <div 
        className="floating-ai-orb-container"
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 16px))' : '30px',
          right: isMobile ? '16px' : '30px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px'
        }}
      >
        {/* Floating Quick Tools Glass Panel */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '24px',
                padding: '16px',
                width: '240px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(139, 92, 246, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✨</span> Smart Tools
              </div>

              {[
                { label: '🤖 Ask TrackTaps AI', action: () => { setIsChatOpen(true); setIsMenuOpen(false); } },
                { label: '🏖️ Smart Bunk', action: () => { navigate('/bunk-calculator'); setIsMenuOpen(false); } },
                { label: '📅 Semester AI', action: () => { navigate('/calendar'); setIsMenuOpen(false); } },
                { label: '📈 Quick Insights', action: () => { navigate('/insights'); setIsMenuOpen(false); } },
                ...(!isNativeAPK() ? [{ label: '📲 Get Native App', action: () => { setIsOpen(true); setIsMenuOpen(false); } }] : [])
              ].map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.03, x: 4, backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={item.action}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'left',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Floating Assistant Orb */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            width: '52px',
            height: '52px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 15px rgba(139, 92, 246, 0.2)'
          }}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 135 : 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isMenuOpen ? (
              <span style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>✕</span>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V21M3 12H21M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            )}
          </motion.div>

          {/* Pulse breathe effect */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              border: '2px solid var(--primary-light)',
              pointerEvents: 'none'
            }}
          />
        </motion.div>
      </div>

      {/* Conversational Assistant chat drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="ai-assistant-modal-card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, var(--bg-primary) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '28px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                height: '520px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.2)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🤖</span>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>TrackTaps AI</h4>
                    <span style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: '700' }}>ONLINE ASSISTANT</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Chat messages */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '16px' }}>
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                      borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      lineHeight: 1.5,
                      textAlign: 'left',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 2px', padding: '12px 16px', display: 'flex', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary-light)', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary-light)', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary-light)', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[
                  '🏖️ Can I bunk class?',
                  '🚨 Critical risks?',
                  '📊 Overall score?'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(chip)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '100px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      color: 'var(--primary-light)',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ask TrackTaps AI..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleAskAI(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Platform Chooser (Get App) */}
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)' }}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="apk-modal-card"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '450px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, var(--bg-primary) 100%)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '32px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px var(--primary-glow)',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '-0.5px' }}>Get TrackTaps</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>Choose your platform to install the app.</p>

              {/* Platform Selector Tabs */}
              <div style={{ 
                display: 'flex', 
                background: 'rgba(0,0,0,0.2)', 
                padding: '4px', 
                borderRadius: '16px', 
                marginBottom: '32px',
                gap: '4px'
              }}>
                {platforms.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActiveTab(p.id)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === p.id ? 'var(--primary)' : 'transparent',
                      color: activeTab === p.id ? 'white' : 'var(--text-dim)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{p.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'android' && (
                    <motion.div
                      key="android"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Android Application</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                          Download the native APK for the best performance and offline capabilities.
                        </p>
                      </div>
                      <button
                        onClick={downloadAPK}
                        style={{
                          width: '100%',
                          padding: '16px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: '800',
                          fontSize: '15px',
                          cursor: 'pointer',
                          boxShadow: '0 8px 20px var(--primary-glow)'
                        }}
                      >
                        Download APK (7.6 MB)
                      </button>
                    </motion.div>
                  )}

                  {activeTab === 'windows' && (
                    <motion.div
                      key="windows"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💻</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Windows Desktop App</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                          Install TrackTaps as a standalone desktop application via your browser.
                        </p>
                      </div>
                      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '8px' }}>HOW TO INSTALL:</div>
                        <ol style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-main)', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li>Look at your browser's address bar.</li>
                          <li>Click the <b>Install Icon</b> (🖥️ or ➕) on the right side.</li>
                          <li>Confirm <b>"Install"</b> to add to your desktop.</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'ios' && (
                    <motion.div
                      key="ios"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍎</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>iOS Home Screen App</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                          Add TrackTaps to your iPhone or iPad for a native full-screen experience.
                        </p>
                      </div>
                      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '8px' }}>HOW TO INSTALL:</div>
                        <ol style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-main)', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <li>Open this site in <b>Safari</b>.</li>
                          <li>Tap the <b>Share button</b> (📤) at the bottom.</li>
                          <li>Scroll down and tap <b>"Add to Home Screen"</b>.</li>
                          <li>Tap <b>"Add"</b> in the top right corner.</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  marginTop: '32px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DownloadAPK;
