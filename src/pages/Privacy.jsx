import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-main)',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '24px',
          fontWeight: '600'
        }}
      >
        ← Go Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-card"
        style={{
          padding: 'clamp(20px, 5vw, 40px)',
          background: 'var(--surface-glass)',
          border: '1px solid var(--border)',
          lineHeight: '1.7',
          fontSize: '14px',
          color: 'var(--text-dim)'
        }}
      >
        <h1 style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: '850', marginBottom: '8px', marginTop: 0 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--primary-light)', marginBottom: '32px', fontWeight: '700' }}>
          Last Updated: May 18, 2026 (Version v1.0)
        </p>

        <section style={{ marginBottom: '24px' }}>
          <p>
            At TrackTaps, we prioritize student trust and security. This Privacy Policy outlines what information we store, how we keep it safe, and the lightweight methods we use to run a high-performance ecosystem.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            1. Attendance Data Storage & Cloud Sync
          </h2>
          <p>
            Your college subjects, schedules, daily logs, and custom holidays are stored securely on your local device. If you log in, these details are synchronized with your secure Firebase Firestore account. This allows your dashboard stats to recover immediately when you access TrackTaps from multiple web browsers or native APK platforms.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            2. Google Authentication
          </h2>
          <p>
            We leverage Google Authentication to log you into TrackTaps. We do not store or see your Google account password. We only capture your email address, display name, and avatar image to personalize your profile and verify your account.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            3. Anonymous Analytics (Visitor Intelligence)
          </h2>
          <p>
            To understand total visits, active platforms, conversion funnels, and feature adoption without compromising student privacy, TrackTaps uses a custom **lightweight anonymous tracking system**.
            We generate a randomized guest visitor ID on launch. This tracks non-identifiable events like app opens, platform types (Browser, APK, or PWA), active durations, and features used. This data does not contain individual names, emails, or student credentials.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            4. Referral Tracking & Premium Transactions
          </h2>
          <p>
            Referral codes are tracked using secure server-side validations to ensure invite attributions are credited perfectly to your profile. Premium payment details, transaction references, and paid amounts are handled through secure gateways (Razorpay) and mapped strictly to verify premium feature gates.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            5. Secure Database Practices
          </h2>
          <p>
            We enforce strict database protection rules on Firestore, ensuring that only authenticated users can access their private schedules or edit entries. We NEVER share, rent, or distribute personal campus logs or identity credentials to third-party brokers.
          </p>
        </section>

        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '40px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          © 2026 TrackTaps • Designed for Elite Campus Productivity
        </footer>

      </motion.div>
    </div>
  );
}

export default Privacy;
