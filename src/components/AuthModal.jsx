import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';
import useAppStore from '../store/appStore';
import syncService from '../services/syncService';

function AuthModal({ isOpen, onClose }) {
  const [view, setView] = useState('select'); // select, login, signup, reset, phone, otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const { login, setUser } = useAppStore();
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the centralized store login which handles everything
      const user = await login();
      if (user) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.loginWithEmail(email, password);
      // Handled by store observer
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (fullName.trim().length < 2) throw new Error("Full Name is required.");
      
      const user = await authService.signupWithEmail(email, password, fullName);
      
      // Force sync to cloud for Admin visibility
      await syncService.saveToCloud(user.uid, {
        uid: user.uid,
        displayName: fullName,
        email: user.email,
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        premium: false,
        role: 'USER'
      });

      // Handled by store observer
      onClose();
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(email);
      alert('Password reset email sent!');
      setView('login');
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  // Phone/OTP Handlers removed

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="auth-overlay"
      onClick={view === 'profile' ? null : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="auth-modal"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          scrollbarWidth: 'none'
        }}
      >
        <style>{`
          .auth-modal::-webkit-scrollbar { display: none; }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        `}</style>
        <div id="recaptcha-container"></div>

        {view !== 'profile' && (
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-dim)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >✕</button>
        )}

        <AnimatePresence mode="wait">
          {view === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', textAlign: 'center' }}>Welcome Back</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '24px' }}>Choose your preferred login method.</p>
              
              {/* Subtle Google Login Recommendation */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                onClick={handleGoogleLogin}
                style={{ 
                  background: 'rgba(139, 92, 246, 0.05)', 
                  border: '1px solid rgba(139, 92, 246, 0.15)', 
                  borderRadius: '16px', 
                  padding: '14px 18px', 
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                  transform: 'translateX(-100%)',
                  animation: 'shimmer 3s infinite'
                }} />
                <span style={{ fontSize: '24px' }}>✨</span>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>Fastest Access:</span> Google Login is recommended for a seamless one-tap experience.
                </p>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AuthButton 
                  icon="🌐" 
                  label="Continue with Google" 
                  onClick={handleGoogleLogin} 
                  loading={loading}
                />
                <AuthButton 
                  icon="📧" 
                  label="Email & Password" 
                  onClick={() => setView('login')} 
                />
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
                By continuing, you agree to our <span style={{ color: 'var(--primary-light)' }}>Terms of Service</span>.
              </p>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.form key="login" onSubmit={handleEmailLogin} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>Login with Email</h3>
              
              <Input label="Email Address" type="email" value={email} onChange={setEmail} required />
              <Input label="Password" type="password" value={password} onChange={setPassword} required />
              
              {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
              
              <SubmitButton label="Login" loading={loading} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button type="button" onClick={() => setView('signup')} style={textBtnStyle}>Create account</button>
                <button type="button" onClick={() => setView('reset')} style={textBtnStyle}>Forgot password?</button>
              </div>
              
              <button type="button" onClick={() => setView('select')} style={{ ...textBtnStyle, width: '100%', marginTop: '24px', textAlign: 'center' }}>← Back to options</button>
            </motion.form>
          )}

          {view === 'signup' && (
            <motion.form key="signup" onSubmit={handleEmailSignup} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>Create Account</h3>
              
              <Input label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Enter your name" required />
              <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="email@example.com" required />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
              
              {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
              
              <SubmitButton label="Sign Up" loading={loading} />
              
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px' }}>
                Already have an account? <button type="button" onClick={() => setView('login')} style={textBtnStyle}>Login</button>
              </p>
            </motion.form>
          )}

          {view === 'reset' && (
            <motion.form key="reset" onSubmit={handlePasswordReset} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Reset Password</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Enter your email to receive a reset link.</p>
              
              <Input label="Email Address" type="email" value={email} onChange={setEmail} required />
              
              {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
              
              <SubmitButton label="Send Link" loading={loading} />
              
              <button type="button" onClick={() => setView('login')} style={{ ...textBtnStyle, width: '100%', marginTop: '16px', textAlign: 'center' }}>← Back to login</button>
            </motion.form>
          )}

          {/* Phone/OTP Views removed */}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Sub-components
function AuthButton({ icon, label, onClick, loading }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        color: 'var(--text-main)',
        fontSize: '15px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      <span style={{ fontSize: '20px' }}>{loading ? '⏳' : icon}</span>
      {label}
    </motion.button>
  );
}

function Input({ label, type, value, onChange, ...props }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '12px',
          color: 'var(--text-main)',
          fontSize: '15px',
          outline: 'none'
        }}
        {...props}
      />
    </div>
  );
}

function SubmitButton({ label, loading }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '700',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 10px 20px var(--primary-glow)'
      }}
    >
      {loading ? 'Please wait...' : label}
    </motion.button>
  );
}

const textBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--primary-light)',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  padding: 0
};

export default AuthModal;
