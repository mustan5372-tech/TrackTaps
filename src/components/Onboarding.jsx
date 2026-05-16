import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';

const Onboarding = () => {
  const { subjects, user } = useAppStore();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show onboarding if user is logged in but has no subjects yet
    if (user && subjects.length === 0) {
      const hasSeen = localStorage.getItem('tracktaps_onboarding_seen');
      if (!hasSeen) {
        setShow(true);
      }
    }
  }, [user, subjects.length]);

  const steps = [
    {
      icon: '✨',
      title: 'Welcome to TrackTaps',
      text: 'The premium student ecosystem designed to help you dominate your semester while keeping your attendance in check.'
    },
    {
      icon: '📥',
      title: 'Pod.ai Integration',
      text: 'Skip manual entry. One-tap sync with Pod.ai pulls your subjects, timetable, and attendance automatically.'
    },
    {
      icon: '🏖️',
      title: 'Smart Bunking',
      text: 'Our AI engine calculates exactly how many classes you can safely skip. Know your limits before you hit them.'
    },
    {
      icon: '🏆',
      title: 'Elite Community',
      text: 'Join the top students in your college. Compete on the leaderboard and unlock exclusive premium themes.'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setShow(false);
    localStorage.setItem('tracktaps_onboarding_seen', 'true');
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(20px)' }}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, var(--bg-primary) 100%)',
            border: '1px solid var(--primary-glow)',
            borderRadius: '32px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px var(--primary-glow)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>{steps[step].icon}</div>
          <h2 style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.5px' }}>{steps[step].title}</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.6 }}>{steps[step].text}</p>

          <div style={{ display: 'flex', gap: '12px' }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  fontWeight: '700',
                  cursor: 'pointer'
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
                background: 'var(--primary)',
                border: 'none',
                color: 'white',
                fontWeight: '800',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 10px 20px var(--primary-glow)'
              }}
            >
              {step === steps.length - 1 ? 'Get Started!' : 'Next'}
            </button>
          </div>

          {/* Progress Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '100px',
                  background: i === step ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Onboarding;
