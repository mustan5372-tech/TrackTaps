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
        friendlyMessage = 'Too many attempts. Please try again later or use Google Login.';
      } else if (err.code === 'auth/invalid-phone-number') {
        friendlyMessage = 'The phone number format is invalid.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error. Please check your internet connection.';
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
      
      console.log("✅ [AuthModal] OTP Verified. Checking profile completeness...");
      
      // Check if user is already complete in Firestore
      const cloudData = await syncService.fetchFromCloud(user.uid);
      
      // A user is "complete" if they have both name and email in Firestore OR Firebase Auth
      const hasName = user.displayName || cloudData?.displayName;
      const hasEmail = user.email || cloudData?.email;

      if (!hasName || !hasEmail) {
        setView('profile');
      } else {
        // All good, finalize
        handleUserAuthenticated(user);
        onClose();
      }
    } catch (err) {
      console.error("❌ [AuthModal] OTP Verification Error:", err);
      setError(err.message || 'Invalid OTP. Please check the code and try again.');
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
      if (!user) throw new Error("Auth session expired. Please login again.");

      // 1. Validation
      const trimmedName = fullName.trim();
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedName.length < 2) throw new Error("Full Name is required.");
      if (!trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw new Error("Invalid Email format.");

      console.log("🔍 [AuthModal] Checking for existing accounts with this email...");
      
      // 2. Intelligent Account Linking/Merging Check
      // We look for any existing user document with this email
      const existingUser = await syncService.fetchByEmail(trimmedEmail);
      
      let mergedData = {
        displayName: trimmedName,
        email: trimmedEmail,
        phoneNumber: user.phoneNumber || `+91${phoneNumber}`,
        authProvider: 'phone',
        lastLoginAt: new Date().toISOString()
      };

      if (existingUser) {
        console.log("🤝 [AuthModal] Found existing account! Merging data...");
        // Preserve their old attendance, premium status, etc.
        mergedData = {
          ...existingUser, // Keeps subjects, attendance, premium, etc.
          ...mergedData,   // Overwrites with new identity info
          uid: user.uid,   // Map the old data to the NEW Phone UID
          authProvider: 'phone-merged'
        };
      } else {
        // New user initialization
        mergedData = {
          ...mergedData,
          uid: user.uid,
          premium: false,
          plan: 'FREE',
          createdAt: new Date().toISOString()
        };
      }

      // 3. Update Firebase Auth Profile (Client-side identity)
      await authService.updateUserProfile(user, { displayName: trimmedName });

      // 4. Persist to Cloud (Ensures Admin visibility & Data persistence)
      await syncService.saveToCloud(user.uid, mergedData);

      // 5. Initialize App State
      await handleUserAuthenticated({
        ...user,
        displayName: trimmedName,
        email: trimmedEmail
      });
      
      onClose();
    } catch (err) {
      console.error("❌ [AuthModal] Completion Error:", err);
      setError(err.message || 'Failed to complete profile.');
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
                autoComplete="one-time-code"
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
            <motion.form 
              key="profile" 
              onSubmit={handleProfileCompletion} 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
            >
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Complete Your Profile</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '28px', lineHeight: '1.5' }}>
                Almost there! We just need a few details to set up your account properly.
              </p>
              
              <Input 
                label="Full Name" 
                type="text" 
                placeholder="Enter your name" 
                value={fullName} 
                onChange={setFullName} 
                required 
                autoFocus
              />
              
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="email@example.com" 
                value={email} 
                onChange={setEmail} 
                required 
              />
              
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.1)', 
                border: '1px solid rgba(139, 92, 246, 0.2)', 
                borderRadius: '12px', 
                padding: '12px 16px', 
                marginBottom: '24px' 
              }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>🔒</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0, lineHeight: '1.5' }}>
                    Your email will be used for <span style={{ color: 'var(--primary-light)', fontWeight: '600' }}>account recovery</span> and managing your premium subscription safely.
                  </p>
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px', fontWeight: '500' }}
                >
                  ⚠️ {error}
                </motion.p>
              )}
              
              <SubmitButton label="Initialize Account" loading={loading} />
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
