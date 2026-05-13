import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 2,
    priceInPaise: 200,
    durationDays: 30,
    description: 'Perfect for a quick boost',
    color: '#8b5cf6'
  },
  {
    id: 'half_yearly',
    name: 'Half-Yearly',
    price: 5,
    priceInPaise: 500,
    durationDays: 180,
    description: 'Most popular for students',
    color: '#d946ef',
    popular: true
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 9,
    priceInPaise: 900,
    durationDays: 365,
    description: 'Best value for long-term',
    color: '#f59e0b',
    bestValue: true
  }
];

function Premium() {
  const navigate = useNavigate();
  const { user, subscription, setSubscription } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = async (plan) => {
    if (!user) {
      alert('Please sign in with Google first to upgrade to Plus.');
      navigate('/settings');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      // 1. Create order on server
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: plan.price,
          planId: plan.id 
        })
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const orderData = await orderResponse.json();

      // 2. Open Razorpay Checkout
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
            // 3. Verify payment on server
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

              setSubscription({
                plan: 'plus',
                planType: plan.id,
                status: 'active',
                expiryDate: expiryDate.toISOString(),
                paymentId: response.razorpay_payment_id,
                amountPaid: plan.price
              });

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
        prefill: {
          name: user.displayName,
          email: user.email,
        },
        theme: {
          color: plan.color,
        },
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

  const features = [
    { icon: '☁️', title: 'Cloud Sync & Backup', desc: 'Secure your data forever.' },
    { icon: '🤖', title: 'AI Insights Plus', desc: 'Advanced performance analytics.' },
    { icon: '⚡', title: 'Auto Pod.ai Sync', desc: 'Zero manual effort required.' },
    { icon: '🎨', title: 'Premium Themes', desc: 'Custom skins and animations.' },
    { icon: '📊', title: 'Smart Alerts', desc: 'Contextual notification system.' },
    { icon: '📂', title: 'Export Pro', desc: 'Detailed PDF/Excel reports.' },
  ];

  return (
    <div className="premium-view" style={{ 
      padding: '24px', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1), transparent 600px)',
      color: '#f8fafc'
    }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1px' }}>PREMIUM ACCESS</span>
          </div>
          <h2 style={{ fontSize: '42px', marginBottom: '16px', fontWeight: '800' }}>Choose Your <span style={{ color: '#a78bfa' }}>Plus</span> Plan</h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            Unlock the full potential of TrackTaps with our flexible subscription plans.
          </p>
        </motion.div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Pricing Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginBottom: '80px',
          width: '100%'
        }} className="pricing-grid">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="dashboard-card"
              style={{
                padding: '40px 32px',
                textAlign: 'center',
                position: 'relative',
                border: plan.bestValue ? '2px solid #f59e0b' : plan.popular ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                boxShadow: plan.bestValue ? '0 0 30px rgba(245, 158, 11, 0.15)' : plan.popular ? '0 0 30px rgba(139, 92, 246, 0.15)' : 'none'
              }}
            >
              {(plan.bestValue || plan.popular) && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: plan.bestValue ? '#f59e0b' : '#8b5cf6',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase'
                }}>
                  {plan.bestValue ? 'Best Value' : 'Most Popular'}
                </div>
              )}

              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{plan.name}</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>{plan.description}</p>
              
              <div style={{ marginBottom: '32px' }}>
                <span style={{ fontSize: '48px', fontWeight: '800' }}>₹{plan.price}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>/ {plan.id === 'monthly' ? 'month' : plan.id === 'yearly' ? 'year' : '6 mo'}</span>
              </div>

              <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, marginBottom: '32px', fontSize: '14px', color: '#94a3b8' }}>
                <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: '#10b981', marginRight: '8px' }}></i> All Premium Features</li>
                <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: '#10b981', marginRight: '8px' }}></i> Cloud Sync & Auto Backup</li>
                <li style={{ marginBottom: '12px' }}><i className="fas fa-check" style={{ color: '#10b981', marginRight: '8px' }}></i> Priority Support</li>
              </ul>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={loading || (subscription && subscription.planType === plan.id)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: subscription.planType === plan.id ? 'rgba(255,255,255,0.05)' : plan.color,
                  color: 'white',
                  border: 'none',
                  fontWeight: '700',
                  cursor: loading || subscription.planType === plan.id ? 'default' : 'pointer',
                  boxShadow: subscription.planType === plan.id ? 'none' : `0 4px 12px ${plan.color}40`,
                  transition: 'all 0.2s'
                }}
              >
                {(subscription && subscription.planType === plan.id) ? 'Current Plan' : loading && selectedPlan === plan.id ? 'Processing...' : `Get ${plan.name}`}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="dashboard-card" style={{ padding: '48px', marginBottom: '40px' }}>
          <h3 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '48px' }}>Free vs <span style={{ color: '#a78bfa' }}>Plus</span></h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ color: '#64748b', fontWeight: '600' }}>Features</div>
            <div style={{ textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Free</div>
            <div style={{ textAlign: 'center', color: '#a78bfa', fontWeight: '600' }}>Plus</div>
          </div>

          {features.map((feature, idx) => (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '20px', 
              padding: '20px 0',
              alignItems: 'center',
              borderBottom: idx === features.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px', minWidth: '30px' }}>{feature.icon}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{feature.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{feature.desc}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '18px' }}>
                <i className="fas fa-times-circle"></i>
              </div>
              <div style={{ textAlign: 'center', color: '#10b981', fontSize: '18px' }}>
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
          Payments are handled securely via Razorpay. Subscriptions are non-refundable.
        </p>
      </div>

      <style>{`
        .premium-view {
          font-family: 'Outfit', sans-serif;
        }
        @media (max-width: 1024px) {
          .pricing-grid {
            gridTemplateColumns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .pricing-grid {
            gridTemplateColumns: 1fr !important;
          }
          .premium-view {
            padding: 16px !important;
            padding-bottom: 120px !important;
          }
          h2 { font-size: 32px !important; }
        }
      `}</style>
    </div>
  );
}

export default Premium;
