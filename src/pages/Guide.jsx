import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Browser } from '@capacitor/browser';
import ContactUs from '../components/ContactUs';

const FAQCard = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{question}</h4>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.6', margin: 0 }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GuideCard = ({ title, icon, color, steps }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      layout
      className="dashboard-card"
      style={{
        padding: '24px',
        borderLeft: `4px solid ${color}`,
        cursor: 'pointer',
        background: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '28px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'background 0.3s'
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '16px', 
            background: `${color}20`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '24px',
            color: color
          }}>
            {icon}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{title}</h3>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function Guide() {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'whatsapp' | 'email' | 'bug' | 'feature' | null
  const [errorMsg, setErrorMsg] = useState('');
  const [supportMethod, setSupportMethod] = useState(null); // null | 'choice' | 'in_app'
  const [selectedCategory, setSelectedCategory] = useState('support'); // 'support' | 'bug' | 'feature'
  const [emailDetails, setEmailDetails] = useState({ subject: '', body: '' });
  const [initialSupportTab, setInitialSupportTab] = useState('new_ticket');

  const handleSupportChoice = (category, subject, body = '') => {
    setSelectedCategory(category);
    setEmailDetails({ subject, body });
    setSupportMethod('choice');
  };

  const WHATSAPP_LINK = "https://chat.whatsapp.com/FnqY8vehe4wLrRgK6MKVly";
  const SUPPORT_EMAIL = "tracktaps@gmail.com";

  const handleOpenLink = async (url, type) => {
    setLoadingAction(type);
    setErrorMsg('');
    try {
      // Use Capacitor Browser open for native Android APK compatibility
      await Browser.open({ url });
      setLoadingAction(null);
    } catch (error) {
      console.warn("Capacitor Browser failed, falling back to window.open", error);
      try {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) throw new Error("Popup blocked");
        setLoadingAction(null);
      } catch (err) {
        setLoadingAction(null);
        if (type === 'whatsapp') {
          setErrorMsg("Unable to open WhatsApp. Please try again or contact support via email.");
        } else {
          setErrorMsg("Unable to open URL. Please email support directly at " + SUPPORT_EMAIL);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setShowSupportModal(false);
    setErrorMsg('');
    setSupportMethod(null);
    setInitialSupportTab('new_ticket');
  };

  const handleEmailAction = (subject, body = '') => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    handleOpenLink(mailtoUrl, 'email');
  };

  const guides = [
    {
      title: 'Pod.ai Sync',
      icon: '🔄',
      color: '#8b5cf6',
      steps: [
        'Navigate to the Pod.ai module from the top header button.',
        'Sign in securely with your college email and password.',
        'TrackTaps securely fetches your subjects and attendance data.',
        'Tap "Sync to TrackTaps" to automatically update all your classes.'
      ]
    },
    {
      title: 'Smart Bunk Calculator',
      icon: '🏖️',
      color: '#ec4899',
      steps: [
        'Select any subject to view its specific bunk calculator.',
        'Your current attendance percentage and target criteria will be automatically applied.',
        'Instantly see how many classes you can afford to skip, or how many you need to attend to recover.'
      ]
    },
    {
      title: 'Community Leaderboard',
      icon: '🏆',
      color: '#f59e0b',
      steps: [
        'The leaderboard ranks students globally based on their average attendance.',
        'Top 3 elite students are showcased in the Champions Board.',
        'Ensure you sync your Pod.ai data regularly to stay at the top of the rankings.'
      ]
    },
    {
      title: 'AI Insights',
      icon: '📈',
      color: '#10b981',
      steps: [
        'AI Insights analyze your attendance patterns across all subjects.',
        'Receive actionable advice on which subjects need urgent attention.',
        'Unlock AI-driven predictions and weekly summaries with Premium Plus.'
      ]
    },
    {
      title: 'Premium Plus & Referrals',
      icon: '💎',
      color: '#3b82f6',
      steps: [
        'Premium Plus unlocks Cloud Sync, Advanced AI Insights, and exclusive themes.',
        'You can get 15 Days of Premium Plus for FREE by inviting 10 friends.',
        'Go to the Referral menu, copy your unique link, and share it with classmates.'
      ]
    }
  ];

  const faqs = [
    {
      question: "How does the Pod.ai sync keep my credentials secure?",
      answer: "TrackTaps uses isolated, browser-safe client-side processing. Your Pod.ai credentials are never saved on our databases and are used only to establish a direct secure sync token with your college portal."
    },
    {
      question: "Why is my Bunk Calculator showing 0 class buffer?",
      answer: "Make sure you have correctly set up your semester duration dates in the Semester Setup calendar modal, as bunk calculation maps out the exact remaining teaching slots left in the schedule."
    },
    {
      question: "What happens when I lose internet connectivity?",
      answer: "TrackTaps features custom Smart Offline Safety. All your bunks, calendar updates, and logs are secured locally inside secure device memory and will auto-reconcile once connection recovers."
    }
  ];

  return (
    <div style={{ paddingBottom: '120px', maxWidth: '800px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px' }}>
      
      {/* Header */}
      <header style={{ marginBottom: '32px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>
              How to Use <span style={{ color: 'var(--primary-light)' }}>TrackTaps</span>
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
              Master your attendance and never worry about falling behind again. Explore the interactive guides below.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.removeItem('tracktaps_onboarding_seen');
              window.dispatchEvent(new Event('trigger-onboarding'));
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.3) 100%)',
              border: '1.5px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '16px',
              padding: '10px 18px',
              color: 'white',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.1)'
            }}
          >
            ✨ Replay Guide Tour
          </motion.button>
        </div>
      </header>

      {/* Main Guides Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
        {guides.map((guide, idx) => (
          <GuideCard key={idx} {...guide} />
        ))}
      </div>

      {/* FAQ & Troubleshooting grid */}
      <div className="faq-trouble-grid">
        
        {/* FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px' }}>💬 Frequently Asked Questions</h3>
          {faqs.map((faq, idx) => (
            <FAQCard key={idx} {...faq} />
          ))}
        </div>

        {/* Quick Troubleshooting Guide */}
        <div className="dashboard-card" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 12px' }}>🛠️ Troubleshooting Quick Card</h3>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6' }}>
            <li><strong>Empty Calendar Events:</strong> Double check your timetable is fully filled in the Timetable section.</li>
            <li><strong>Invalid Pod.ai Credentials:</strong> Reset your password on the official Pod portal and try sync again.</li>
            <li><strong>Sync Pending status:</strong> Simply click Backup now in Settings once stable WiFi or cellular recovers.</li>
          </ul>
        </div>
      </div>

      {/* Support Card with micro-animations */}
      <div className="dashboard-card" style={{ 
        padding: '32px 24px', 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '28px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Still need help?</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px', lineHeight: '1.6' }}>
          If you encounter any issues or have suggestions for TrackTaps, feel free to reach out to the core team. We are available 24/7.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setInitialSupportTab('new_ticket');
              setShowSupportModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              boxShadow: '0 0 15px var(--primary-glow)',
              color: '#fff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '100px',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Contact Support 💬
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setInitialSupportTab('my_tickets');
              setSupportMethod('in_app');
              setSelectedCategory('support');
              setShowSupportModal(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-main)',
              padding: '14px 32px',
              borderRadius: '100px',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Track My Tickets 📋
          </motion.button>
        </div>
      </div>

      {/* Futuristic Help Options Support Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                width: '100%',
                maxWidth: supportMethod === 'in_app' ? '550px' : '460px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '28px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '32px 24px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={handleCloseModal}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '100px',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: '900',
                  fontSize: '14px',
                  zIndex: 10
                }}
              >
                ✕
              </button>

              {supportMethod === null ? (
                <>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px' }}>Need Help?</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>
                    Select an option below to connect with our official support channels immediately.
                  </p>

                  {/* Error messages fallback */}
                  {errorMsg && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '12px',
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      {errorMsg}
                    </div>
                  )}

                  {/* Support Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Option 1: WhatsApp Community */}
                    <button
                      onClick={() => handleOpenLink(WHATSAPP_LINK, 'whatsapp')}
                      disabled={loadingAction === 'whatsapp'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderRadius: '100px',
                        border: '1px solid rgba(37, 211, 102, 0.2)',
                        background: 'rgba(37, 211, 102, 0.05)',
                        color: '#25d366',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🟢</span> Join WhatsApp Community
                      </span>
                      <span>{loadingAction === 'whatsapp' ? 'Opening...' : '→'}</span>
                    </button>

                    {/* Option 2: Email support */}
                    <button
                      onClick={() => handleSupportChoice('support', 'TrackTaps Help Inquiry')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderRadius: '100px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        background: 'rgba(59, 130, 246, 0.05)',
                        color: '#60a5fa',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>📧</span> Email Support
                      </span>
                      <span>→</span>
                    </button>

                    {/* Option 3: Bug Report */}
                    <button
                      onClick={() => handleSupportChoice('bug', 'Bug Report - TrackTaps', 'Please describe the bug details, expected behavior, and screenshot links if available:')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderRadius: '100px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#f87171',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🐞</span> Report a Bug
                      </span>
                      <span>→</span>
                    </button>

                    {/* Option 4: Feature Request */}
                    <button
                      onClick={() => handleSupportChoice('feature', 'Feature Suggestion - TrackTaps', 'Provide your idea or feature request details here:')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderRadius: '100px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        background: 'rgba(139, 92, 246, 0.05)',
                        color: '#c084fc',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>💡</span> Suggest a Feature
                      </span>
                      <span>→</span>
                    </button>

                  </div>
                </>
              ) : supportMethod === 'choice' ? (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px' }}>
                    {selectedCategory === 'bug' ? '🐞 Bug Reporting' : selectedCategory === 'feature' ? '💡 Feature Suggestion' : '📧 Email Support'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: '1.4' }}>
                    How would you like to submit your {selectedCategory === 'bug' ? 'bug report' : selectedCategory === 'feature' ? 'feature suggestion' : 'inquiry'}?
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                      onClick={() => setSupportMethod('in_app')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '16px 20px',
                        borderRadius: '24px',
                        border: '1.5px solid var(--primary)',
                        background: 'rgba(139, 92, 246, 0.08)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--primary-light)', marginBottom: '4px' }}>
                        ⚡ Submit In-App (Recommended)
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        Send your query directly to our admins without opening any email apps.
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleEmailAction(emailDetails.subject, emailDetails.body);
                        handleCloseModal();
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '16px 20px',
                        borderRadius: '24px',
                        border: '1.5px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>
                        📧 Open Email App
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        Compose the email using Gmail, Outlook, or your default mail application.
                      </span>
                    </button>

                    <button
                      onClick={() => setSupportMethod(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginTop: '8px',
                        textAlign: 'center',
                        textDecoration: 'underline'
                      }}
                    >
                      ← Back to Options
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
                    {selectedCategory === 'bug' ? '🐞 Submit Bug Report' : selectedCategory === 'feature' ? '💡 Suggest a Feature' : '📩 Support Inquiry'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '20px' }}>
                    Fill out the form below to submit directly to our core administration team.
                  </p>

                  <ContactUs initialCategory={selectedCategory} minimal={true} initialTab={initialSupportTab} />

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      onClick={() => setSupportMethod('choice')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Guide;
