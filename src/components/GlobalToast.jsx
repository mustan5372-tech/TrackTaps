import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';

export default function GlobalToast() {
  const { toast } = useAppStore();

  return (
    <AnimatePresence>
      {toast && toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          style={{
            position: 'fixed',
            bottom: '100px', // Above mobile nav
            left: '50%',
            zIndex: 9999,
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--primary-glow)'}`,
            padding: '12px 24px',
            borderRadius: '16px',
            color: 'var(--text-main)',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 15px var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✨'}</span>
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
