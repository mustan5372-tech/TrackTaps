import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion } from 'framer-motion';

export default function BetaFeatureGate({ children }) {
  const { user, role, logout } = useAppStore();
  const navigate = useNavigate();

  const isBetaUser = user && (
    user.email?.toLowerCase() === 'beta@tracktaps.online' ||
    role === 'owner' ||
    role === 'core_admin'
  );

  if (!isBetaUser) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: 'var(--text-main)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card"
          style={{
            maxWidth: '500px',
            width: '100%',
            padding: '40px 32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🧪</div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', color: '#8b5cf6' }}>
            Beta Feature Access
          </h3>
          <p style={{
            color: 'var(--text-dim)',
            fontSize: '14px',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            This feature which is implemented is beta feature and not available for everyone and is for now only accessible for accounts having access to beta or test usage.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 8px 20px var(--primary-glow)'
              }}
            >
              Back to Home Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                await logout();
                useAppStore.getState().setAuthModalOpen(true);
                navigate('/');
              }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Sign in with Beta Account
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#f59e0b',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        <span style={{ fontSize: '18px' }}>🧪</span>
        <div>
          <strong>Beta Feature:</strong> This feature which is implemented is beta feature and not available for everyone and is for now only accessible for accounts having access to beta or test usage.
        </div>
      </div>
      {children}
    </>
  );
}
