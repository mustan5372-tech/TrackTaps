import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Custom Confetti Component
const Confetti = () => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: -10 - Math.random() * 20, // start above screen
      size: 6 + Math.random() * 10,
      color: ['#8b5cf6', '#c084fc', '#3b82f6', '#10b981', '#fbbf24', '#f43f5e'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
      shape: Math.random() > 0.5 ? 'circle' : 'rect'
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60000, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 1, 
            x: `${p.x}vw`, 
            y: `${p.y}vh`, 
            rotate: p.rotation 
          }}
          animate={{ 
            y: '110vh', 
            rotate: p.rotation + 360 + Math.random() * 360,
            x: `${p.x + (Math.random() * 20 - 10)}vw`
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay,
            ease: 'easeOut',
            repeat: 0
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.shape === 'circle' ? p.size : p.size * 0.6}px`,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
};

const Onboarding = () => {
  const { subjects, user } = useAppStore();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Pod.ai simulated sync state
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'completed'

  // Bunk Crew simulation state
  const [bunkCrew, setBunkCrew] = useState([
    { name: 'You', attendance: '82%', status: 'safe' },
    { name: 'Alex', attendance: '68%', status: 'warning' },
    { name: 'Sam', attendance: '79%', status: 'safe' }
  ]);

  useEffect(() => {
    // Show onboarding automatically only if logged in and has not completed it yet
    if (user) {
      const hasSeen = localStorage.getItem('tracktaps_onboarding_seen') || 
                      localStorage.getItem('tracktaps_onboarding_completed') || 
                      localStorage.getItem('tracktaps_completed_tour');
      if (!hasSeen) {
        setShow(true);
      }
    }
  }, [user]);

  // Listen for replay event from Guide page
  useEffect(() => {
    const handleReplay = () => {
      setStep(0);
      setTriggerConfetti(false);
      setSyncProgress(0);
      setSyncStatus('idle');
      setShow(true);
    };
    window.addEventListener('trigger-onboarding', handleReplay);
    return () => window.removeEventListener('trigger-onboarding', handleReplay);
  }, []);

  // Handle Pod.ai simulation restart on page switch
  useEffect(() => {
    if (step === 2) {
      setSyncStatus('syncing');
      setSyncProgress(0);
      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setSyncStatus('completed');
            return 100;
          }
          return prev + 10;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNext = () => {
    if (step < 9) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setTriggerConfetti(true);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem('tracktaps_onboarding_seen', 'true');
      localStorage.setItem('tracktaps_onboarding_completed', 'true');
      localStorage.setItem('tracktaps_completed_tour', 'true');
      
      if (user && user.uid && db && typeof db.app === 'object') {
        try {
          const userRef = doc(db, "users", user.uid);
          setDoc(userRef, { onboardingCompleted: true }, { merge: true });
        } catch (e) {
          console.warn("Failed to save onboardingCompleted to Cloud:", e);
        }
      }
    }, 2500);
  };

  // Swipe gesture handling
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 60;
    const isRightSwipe = distance < -60;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe && step > 0) {
      setStep(step - 1);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        {triggerConfetti && <Confetti />}
      </AnimatePresence>

      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 55000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '16px',
          boxSizing: 'border-box',
          fontFamily: "'Outfit', sans-serif"
        }}
      >
        {/* Ambient background glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(5, 5, 10, 0.9)', 
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)'
          }}
        />

        {/* Soft background light orb */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Main Onboarding Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1.5px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '32px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.15)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)'
          }}
        >
          {/* Top Progress and Controls */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(139, 92, 246, 0.8)', fontWeight: '800', letterSpacing: '0.05em' }}>
                ONBOARDING GUIDE
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step ? '20px' : '6px',
                      height: '6px',
                      borderRadius: '100px',
                      background: i === step ? 'var(--primary-light)' : 'rgba(255,255,255,0.15)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
              {step < 9 ? (
                <button
                  onClick={handleComplete}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  Skip
                </button>
              ) : (
                <div style={{ width: '30px' }} />
              )}
            </div>

            {/* Slides Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                {/* PAGE 1: Welcome to TrackTaps */}
                {step === 0 && (
                  <div>
                    {/* Animated App Logo Assembling Simulation */}
                    <div style={{ position: 'relative', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '28px' }}>
                      <motion.div
                        animate={{ 
                          scale: [0.9, 1.05, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '24px',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '48px',
                          boxShadow: '0 15px 35px var(--primary-glow)',
                          border: '1.5px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        🎓
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.15, scale: 1.2 }}
                        style={{
                          position: 'absolute',
                          width: '130px',
                          height: '130px',
                          borderRadius: '50%',
                          border: '2px dashed var(--primary-light)',
                        }}
                      />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '950', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                      👋 Welcome to TrackTaps
                    </h2>
                    <h3 style={{ fontSize: '18px', fontWeight: '750', color: 'var(--primary-light)', margin: '0 0 16px 0' }}>
                      Your College Life, Smarter.
                    </h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto' }}>
                      Attendance. AI. Timetable. Community. <br/>Everything in one premium glassmorphic place.
                    </p>
                  </div>
                )}

                {/* PAGE 2: Smart Attendance */}
                {step === 1 && (
                  <div>
                    {/* Mini Calendar Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: 'white' }}>
                        <span>📅 ATTENDANCE CALCULATOR</span>
                        <span style={{ color: '#10b981' }}>78.5% (Safe)</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                          <div key={idx} style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{day}</span>
                            <span style={{ fontSize: '12px' }}>{idx === 2 ? '❌' : '✅'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
                      ✅ Completely Free
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>
                      📅 Smart Attendance
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', maxWidth: '350px', margin: '0 auto' }}>
                      Mark attendance in seconds with automatic percentage calculations, a beautiful visual calendar, and subject-wise logs.
                    </p>
                  </div>
                )}

                {/* PAGE 3: Pod.AI Sync */}
                {step === 2 && (
                  <div>
                    {/* Mini Pod.AI Sync Simulator */}
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '24px' }}>🔄</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>Pod.ai Secure Sync</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {syncStatus === 'syncing' ? `Fetching Timetable... ${syncProgress}%` : 'Sync Completed Successfully!'}
                          </div>
                        </div>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${syncProgress}%` }}
                          transition={{ ease: 'easeOut' }}
                          style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)' }}
                        />
                      </div>
                    </div>

                    <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
                      ⭐ Exclusive Feature
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>
                      🤖 Pod.AI Sync
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', maxWidth: '350px', margin: '0 auto' }}>
                      Skip manual entry. Securely sync your official college attendance, subjects, and timetables directly from Pod.ai in one tap.
                    </p>
                  </div>
                )}

                {/* PAGE 4: Bunk Together */}
                {step === 3 && (
                  <div>
                    {/* Mini Bunk Crew Dashboard */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '16px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#c084fc', marginBottom: '12px' }}>
                        <span>👥 BUNK CREW (GROUP)</span>
                        <span>🟢 ONLINE</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {bunkCrew.map((member, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>{member.name}</span>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: member.status === 'safe' ? '#10b981' : '#f43f5e' }}>{member.attendance}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <span style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
                      🔥 Only on TrackTaps
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>
                      🤝 Bunk Together
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto' }}>
                      Create a private group with classmates. Sync attendance in real time, see who is safe to skip, and coordinate class group plans securely.
                    </p>
                  </div>
                )}

                {/* PAGE 5: AI Insights */}
                {step === 4 && (
                  <div>
                    {/* Mini Insights Alert */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '20px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🤖</span>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>AI RISK RECOMMENDATION</div>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#a7f3d0', lineHeight: 1.4 }}>
                        "Mathematics requires 2 more lectures to hit your 75% target safely. Avoid bunking next lecture."
                      </p>
                    </div>

                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
                      Powered by AI
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>
                      📈 AI Insights
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', maxWidth: '350px', margin: '0 auto' }}>
                      Get customized semester projections, smart subject suggestions, risk warnings, and actionable logs automatically processed by AI.
                    </p>
                  </div>
                )}

                {/* PAGE 6: Community */}
                {step === 5 && (
                  <div>
                    {/* Mini Chat bubble simulation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '16px', marginBottom: '24px' }}>
                      <div style={{ alignSelf: 'flex-start', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '10px 14px', borderRadius: '14px 14px 14px 2px', maxWidth: '80%', textAlign: 'left' }}>
                        <span style={{ fontSize: '12px', color: 'white', lineHeight: '1.4' }}>Hey! Who has the math assignment notes?</span>
                      </div>
                      <div style={{ alignSelf: 'flex-end', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '14px 14px 2px 14px', maxWidth: '80%', textAlign: 'left' }}>
                        <span style={{ fontSize: '12px', color: 'white', lineHeight: '1.4' }}>Uploaded them in the notes channel! check it out 📚</span>
                      </div>
                    </div>

                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 10px 0', letterSpacing: '-0.01em' }}>
                      🌍 Community
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', maxWidth: '350px', margin: '0 auto' }}>
                      Meet classmates in verified college channels, share notes, ask questions, coordinate study partners, and stay updated.
                    </p>
                  </div>
                )}

                {/* PAGE 7: FREE FEATURES */}
                {step === 6 && (
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                      🎁 Completely Free Features
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '0 0 16px 0' }}>
                      Everything you need to master your calendar and goals.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left' }}>
                      {[
                        'Attendance Tracker',
                        'Smart Calendar',
                        'Timetable Sync',
                        'Bunk Calculator',
                        'GeoTrack Engine',
                        'Basic Insights',
                        'Guide Center',
                        'Class Community'
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                          <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 8: PREMIUM FEATURES */}
                {step === 7 && (
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                      💎 Premium Enhancements
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '0 0 16px 0' }}>
                      Take control of your college life with advanced tools.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxHeight: '220px', overflowY: 'auto' }}>
                      {[
                        { title: 'Pod.AI Sync', desc: 'Secure automated official portal updates.' },
                        { title: 'Bunk Together', desc: 'Coordinate safe skip opportunities with friends.' },
                        { title: 'AI Recommendations', desc: 'Custom smart recommendations.' },
                        { title: 'Cloud Backup & Restore', desc: 'Never lose your history or analytics.' },
                        { title: 'Advanced Semester Projections', desc: 'Full predictive math trends.' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '10px 14px', borderRadius: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '16px' }}>⭐</span>
                          <div>
                            <div style={{ fontSize: '12px', color: 'white', fontWeight: '800' }}>{item.title}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 9: Why Students Love TrackTaps */}
                {step === 8 && (
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>
                      🚀 Built by Students, For Students
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
                      {[
                        { title: '🎯 Thousands Strong', desc: 'Over thousands of records processed daily.' },
                        { title: '📚 AI Planning', desc: 'Calculates skip options with absolute safety.' },
                        { title: '⚡ Instant Speed', desc: 'Optimized offline engine works instantly.' },
                        { title: '☁ Cloud Sync', desc: 'Access your account from any device.' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 12px', borderRadius: '16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 10: Ready? */}
                {step === 9 && (
                  <div>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
                    <h2 style={{ fontSize: '28px', fontWeight: '950', color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                      You're All Set!
                    </h2>
                    
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '20px', padding: '18px 16px', margin: '16px 0 24px 0', textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '850', color: '#c084fc', marginBottom: '4px' }}>
                        You've only seen the beginning...
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                        Discover AI-powered attendance planning, coordinated group bunks, premium analytics, and much more inside TrackTaps.
                      </p>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 auto 8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>💡</span> Need help? Open Guide Center from More anytime.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Actions Row */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px var(--primary-glow)',
                  transition: 'all 0.2s'
                }}
              >
                {step === 9 ? 'Start My Journey 🚀' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Onboarding;
