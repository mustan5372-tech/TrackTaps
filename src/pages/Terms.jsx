import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function Terms() {
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
          Terms of Conditions
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--primary-light)', marginBottom: '32px', fontWeight: '700' }}>
          Last Updated: May 18, 2026 (Version v1.0)
        </p>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            1. Educational Tool Disclaimer
          </h2>
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid #f59e0b', padding: '16px', borderRadius: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
            <strong>CRITICAL NOTICE:</strong> TrackTaps is an academic assistance platform and does not guarantee academic outcomes or attendance accuracy. Always cross-reference attendance parameters with your college's official registration records.
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            2. User Responsibility
          </h2>
          <p>
            As a user of TrackTaps, you assume full responsibility for managing your attendance logs, schedule listings, and college portal sync settings. Any decision to skip lectures, classes, or exams based on the calculations of the Bunk Calculator or AI insights is strictly at your own discretion.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            3. Premium Subscription Policy
          </h2>
          <p>
            Premium Plus subscriptions unlock priority access to prediction modules, dynamic theme systems, and manual cloud sync slots. Payments are securely processed via third-party providers (Razorpay). Subscriptions are strictly non-refundable and self-managed on a regular renewal structure.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            4. Referral Abuse Prevention
          </h2>
          <p>
            TrackTaps rewards real user engagement. Any attempts to manipulate our campus referral system (including creating fake visitor accounts, utilizing temporary email domains, self-referring, or triggering automated signup bots) will lead to immediate account suspension, permanent deletion of cloud backups, and forfeit of rewards.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            5. Acceptable & Account Use Rules
          </h2>
          <p>
            You must be a real student enrolled in a registered college to hold a TrackTaps profile. Sharing accounts, distributing private authentication credentials, or attempting to compromise the synchronization pipelines (such as the Pod.ai connectors) will invalidate your terms.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            6. Attendance Calculation Disclaimer
          </h2>
          <p>
            Calculated skip potentials, bunk warnings, and risk levels are mathematical forecasts based on the dates and parameters input into your settings profile. Actual class timetables, unexpected schedule variations, and college grading boards may affect your criteria. TrackTaps holds no liability for criteria failures.
          </p>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', margin: '0 0 12px' }}>
            7. Limitation of Liability
          </h2>
          <p>
            TrackTaps, including its owner, core developers, and contributors, is not liable for any disciplinary or academic penalties, debarment from examination rosters, grade decreases, or other operational issues arising from app usage or sync downtime.
          </p>
        </section>

        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '40px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          © 2026 TrackTaps • Designed for Elite Campus Productivity
        </footer>

      </motion.div>
    </div>
  );
}

export default Terms;
