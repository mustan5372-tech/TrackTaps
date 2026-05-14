import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const PLANS = [
  {
    id: 'monthly',
    name: 'Starter',
    price: 2,
    priceInPaise: 200,
    durationDays: 30,
    description: 'Perfect for a quick performance boost',
    color: 'var(--primary)',
    features: ['Cloud Sync', 'AI Insights', 'Basic Support']
  },
  {
    id: 'half_yearly',
    name: 'Super Saver',
    price: 5,
    priceInPaise: 500,
    durationDays: 180,
    description: 'Most popular for focused students',
    color: '#d946ef',
    popular: true,
    features: ['Unlimited AI', 'Cloud Backup', 'Theme Unlock', 'Priority Support']
  },
  {
    id: 'yearly',
    name: 'Mega Saver',
    price: 9,
    priceInPaise: 900,
    durationDays: 365,
    description: 'Best value for academic excellence',
    color: '#f59e0b',
    bestValue: true,
    features: ['Everything in Super Saver', 'Advanced Reports', 'AI Prediction', 'Lifetime Updates']
  }
];

function Premium() {
  const navigate = useNavigate();
  const { user, subscription, setSubscription, setAuthModalOpen } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = async (plan) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, planId: plan.id })
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const orderData = await orderResponse.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TrackTaps Plus",
        description: `${plan.name} Subscription`,
        image: "/assets/logo.png",
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                uid: user.uid,
                planId: plan.id,
                amount: plan.price
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setSubscription(verifyData.subscription);

              alert(`✨ Welcome to TrackTaps Plus! Your ${plan.name} plan is now active.`);
              navigate('/');
            } else {
              alert('❌ Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('❌ An error occurred during verification.');
          } finally {
            setLoading(false);
            setSelectedPlan(null);
          }
        },
        prefill: { name: user.displayName, email: user.email },
        theme: { color: plan.color },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      alert('❌ Failed to initialize payment. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const comparisonFeatures = [
    { icon: '☁️', title: 'Cloud Sync & Backup', desc: 'Secure your data forever.' },
    { icon: '🤖', title: 'Unlimited AI Usage', desc: 'No daily limits for AI tools.' },
    { icon: '⚡', title: 'Auto Pod.ai Sync', desc: 'Zero manual effort required.' },
    { icon: '🎨', title: 'Premium Themes', desc: 'Exclusive skins and animations.' },
    { icon: '📊', title: 'Smart Alerts', desc: 'Contextual notification system.' },
    { icon: '📂', title: 'Export Pro (PDF/JSON)', desc: 'Detailed attendance reports.' },
    { icon: '🔮', title: 'AI Prediction System', desc: 'Forecast future attendance scores.' },
    { icon: '🚀', title: 'Smart Recovery Planner', desc: 'AI-driven path to safety.' }
  ];

  return (
    <div className="premium-view" style={{ 
      padding: '40px 24px', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, var(--primary-glow), transparent 800px)',
      color: 'var(--text-main)',
      paddingBottom: '120px'
    }}>
      {/* Animated Background Blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity }} style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 12, repeat: Infinity }} style={{ position: 'absolute', bottom: '10%', right: '10%', width: '500px', height: '500px', background: 'rgba(217, 70, 239, 0.08)', borderRadius: '50%', filter: 'blur(120px)' }} />
      </div>

      <header style={{ marginBottom: '80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ display: 'inline-block', padding: '8px 24px', background: 'var(--primary-glow)', borderRadius: '100px', border: '1px solid var(--primary-glow)', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary-light)', letterSpacing: '2px' }}>THE ULTIMATE STUDENT COMPANION</span>
          </div>
          <h2 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.02em' }}>Unlock <span style={{ background: 'linear-gradient(135deg, var(--primary-light), #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TrackTaps Plus</span></h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '19px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            Join 1,000+ students mastering their attendance with AI-powered insights and secure cloud synchronization.
          </p>
        </motion.div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '100px' }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -12 }}
              viewport={{ once: true }}
              style={{
                padding: '48px 32px',
                borderRadius: '32px',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
                border: plan.bestValue ? '2px solid #f59e0b' : plan.popular ? '2px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.bestValue ? '0 20px 50px rgba(245, 158, 11, 0.15)' : plan.popular ? '0 20px 50px rgba(139, 92, 246, 0.15)' : '0 20px 40px rgba(0,0,0,0.3)'
              }}
            >
              {(plan.bestValue || plan.popular) && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', background: plan.bestValue ? '#f59e0b' : 'var(--primary-light)', color: 'white', padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                  {plan.bestValue ? 'Best Value' : 'Popular'}
                </div>
              )}

              <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{plan.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', minHeight: '40px' }}>{plan.description}</p>
              
              <div style={{ marginBottom: '40px' }}>
                <span style={{ fontSize: '56px', fontWeight: '900' }}>₹{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '16px', marginLeft: '4px' }}>/ {plan.id === 'monthly' ? 'month' : plan.id === 'yearly' ? 'year' : '6 months'}</span>
              </div>

              <div style={{ flex: 1, marginBottom: '40px' }}>
                {plan.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#cbd5e1', fontSize: '15px' }}>
                    <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-check" style={{ color: '#10b981', fontSize: '10px' }}></i>
                    </div>
                    {feat}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={loading || (subscription && subscription.status === 'active' && subscription.planType === plan.id)}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  background: (subscription && subscription.status === 'active' && subscription.planType === plan.id) ? 'rgba(255,255,255,0.05)' : plan.color,
                  color: 'white',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: (loading || (subscription && subscription.status === 'active' && subscription.planType === plan.id)) ? 'default' : 'pointer',
                  boxShadow: (subscription && subscription.status === 'active' && subscription.planType === plan.id) ? 'none' : `0 8px 24px ${plan.color}40`,
                  transition: 'all 0.3s ease'
                }}
              >
                {(subscription && subscription.status === 'active' && subscription.planType === plan.id) ? 'Current Plan' : loading && selectedPlan === plan.id ? 'Starting Checkout...' : `Upgrade to ${plan.name}`}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="dashboard-card" style={{ padding: '60px 48px', borderRadius: '40px', background: 'rgba(15, 23, 42, 0.4)' }}>
          <h3 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', marginBottom: '64px' }}>Feature Comparison</h3>
          
          <div className="comparison-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px', marginBottom: '24px' }}>
            <div style={{ color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>Feature</div>
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>Free</div>
            <div style={{ textAlign: 'center', color: 'var(--primary-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>TrackTaps Plus</div>
          </div>

          {comparisonFeatures.map((f, i) => (
            <div key={i} className="comparison-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', padding: '24px 0', borderBottom: i === comparisonFeatures.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '24px' }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{f.desc}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}>
                  <i className="fas fa-times"></i>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <i className="fas fa-check"></i>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        .premium-view { font-family: 'Outfit', sans-serif; }
        @media (max-width: 768px) {
          .premium-view { padding: 40px 0 120px 0 !important; }
          .premium-view > header { padding: 0 20px !important; margin-bottom: 40px !important; }
          .premium-view h2 { font-size: 32px !important; }
          .premium-view p { font-size: 15px !important; }
          .plans-grid { padding: 0 16px !important; gap: 20px !important; grid-template-columns: 1fr !important; }
          .dashboard-card { padding: 32px 20px !important; margin: 0 16px !important; border-radius: 32px !important; }
          .feature-comparison-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .comparison-row { grid-template-columns: 1.5fr 1fr 1fr !important; gap: 12px !important; padding: 16px 0 !important; }
          .comparison-header { grid-template-columns: 1.5fr 1fr 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </div>
  );
}

export default Premium;
