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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [timer, setTimer] = useState(0);

  const { handleUserAuthenticated } = useAppStore();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await authService.loginWithGoogle();
      handleUserAuthenticated(user);
      onClose();
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
      const user = await authService.loginWithEmail(email, password);
      handleUserAuthenticated(user);
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
      const user = await authService.signupWithEmail(email, password, fullName);
      handleUserAuthenticated(user);
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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Auto-format for Indian users: Ensure it's exactly 10 digits
      const cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      
      const formattedPhone = `+91${cleaned}`;

      console.log("🚀 [Auth] Initiating OTP for:", formattedPhone);
      const verifier = await authService.setupRecaptcha('recaptcha-container');
      const result = await authService.sendOTP(formattedPhone, verifier);
      setConfirmationResult(result);
      setView('otp');
      setTimer(60);
    } catch (err) {
      console.error("❌ [AuthModal] Send OTP Error:", err);
      let friendlyMessage = err.message || 'Failed to send OTP';
      
      if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/invalid-phone-number') {
        friendlyMessage = 'The phone number format is invalid.';
      }
      
      setError(friendlyMessage);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.verifyOTP(confirmationResult, otp);
      
      // Check if user is already complete
      // We check Firestore as well because phone auth doesn't set email/name in the auth profile initially
      const cloudData = await syncService.fetchFromCloud(user.uid);
      
      if (!user.displayName && !cloudData?.displayName) {
        setView('profile');
      } else {
        handleUserAuthenticated(user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCompletion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error("Authentication failed. Please try again.");

      // 1. Update Firebase Auth display name
      await authService.updateUserProfile(user, { displayName: fullName });

      // 2. Prepare user object with email (for identification in app state)
      const updatedUser = {
        ...user,
        displayName: fullName,
        email: email || user.email // user.email might be null for phone auth
      };

      // 3. Complete authentication in store
      await handleUserAuthenticated(updatedUser);
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

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
          padding: '32px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
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
              
              {/* Google Login Recommendation */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  border: '1px solid rgba(139, 92, 246, 0.2)', 
                  borderRadius: '12px', 
                  padding: '12px 16px', 
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '20px' }}>💡</span>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0, lineHeight: '1.4', fontWeight: '500' }}>
                  Google Login is <span style={{ color: 'var(--primary-light)', fontWeight: '700' }}>highly recommended</span> for the fastest and smoothest experience.
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
                  icon="📱" 
                  label="Login with Mobile OTP" 
                  onClick={() => setView('phone')} 
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
              
              <Input label="Full Name" type="text" value={fullName} onChange={setFullName} required />
              <Input label="Email Address" type="email" value={email} onChange={setEmail} required />
              <Input label="Password" type="password" value={password} onChange={setPassword} required />
              
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

          {view === 'phone' && (
            <motion.form key="phone" onSubmit={handleSendOTP} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Mobile Login</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Enter your 10-digit mobile number.</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ 
                  flex: '0 0 65px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  🇮🇳 +91
                </div>
                <div style={{ flex: 1 }}>
                  <Input 
                    label="Number" 
                    type="tel" 
                    placeholder="9876543210" 
                    value={phoneNumber} 
                    onChange={(val) => setPhoneNumber(val.replace(/\D/g, '').slice(0, 10))} 
                    required 
                    autoFocus
                  />
                </div>
              </div>
              
              {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
              
              <SubmitButton label="Send OTP" loading={loading} />
              
              <button type="button" onClick={() => setView('select')} style={{ ...textBtnStyle, width: '100%', marginTop: '16px', textAlign: 'center' }}>← Back</button>
            </motion.form>
          )}

          {view === 'otp' && (
            <motion.form key="otp" onSubmit={handleVerifyOTP} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Verify OTP</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Code sent to <span style={{ color: 'var(--primary-light)', fontWeight: '600' }}>+91 {phoneNumber}</span></p>
              
              <Input 
                label="6-Digit OTP" 
                type="text" 
                inputMode="numeric"
                maxLength="6" 
                placeholder="000000"
                value={otp} 
                onChange={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))} 
                required 
                autoFocus
              />
              
              {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
              
              <SubmitButton label="Verify & Login" loading={loading} />
              
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                {timer > 0 ? (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Resend in {timer}s</span>
                ) : (
                  <button type="button" onClick={handleSendOTP} style={textBtnStyle}>Resend Code</button>
                )}
              </div>
            </motion.form>
          )}

          {view === 'profile' && (
            <motion.form key="profile" onSubmit={handleProfileCompletion} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Complete Your Profile</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Please provide your details to continue.</p>
              
              <Input label="Full Name" type="text" placeholder="John Doe" value={fullName} onChange={setFullName} required />
              <Input label="Email Address" type="email" placeholder="john@example.com" value={email} onChange={setEmail} required />
              
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.2)', 
                borderRadius: '10px', 
                padding: '10px', 
                marginBottom: '20px' 
              }}>
                <p style={{ fontSize: '11px', color: '#ffc107', margin: 0, lineHeight: '1.4' }}>
                  <strong>Note:</strong> Email is required for account recovery and managing your premium subscription.
                </p>
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</p>}
              
              <SubmitButton label="Continue" loading={loading} />
            </motion.form>
          )}
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
