import React, { useState } from 'react';
import useAppStore from '../store/appStore';

function ContactUs({ initialCategory = 'support', minimal = false, initialTab = 'new_ticket' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subject: '',
    category: initialCategory,
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const { user: currentUser } = useAppStore();
  const [myQueries, setMyQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'new_ticket' or 'my_tickets'

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch support tickets submitted by this email (case-insensitive & exact matching combined)
  const fetchMyQueries = async (email) => {
    if (!email) return;
    setLoadingQueries(true);
    try {
      const { db } = await import('../services/firebase');
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      
      const emailLower = email.trim().toLowerCase();
      const emailExact = email.trim();
      
      const q1 = query(collection(db, 'support_queries'), where('email', '==', emailLower));
      const q1Snap = await getDocs(q1);
      
      const listMap = new Map();
      q1Snap.forEach(docSnap => {
        listMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
      
      if (emailExact !== emailLower) {
        const q2 = query(collection(db, 'support_queries'), where('email', '==', emailExact));
        const q2Snap = await getDocs(q2);
        q2Snap.forEach(docSnap => {
          listMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      }
      
      const list = Array.from(listMap.values());
      list.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
      setMyQueries(list);
    } catch (err) {
      console.error('Failed to fetch user support queries:', err);
    } finally {
      setLoadingQueries(false);
    }
  };

  // Listen to store user login changes
  React.useEffect(() => {
    if (currentUser?.email) {
      fetchMyQueries(currentUser.email);
    } else {
      setMyQueries([]);
    }
  }, [currentUser]);

  // Autofill name/email if user logs in
  React.useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || currentUser.displayName || '',
        email: prev.email || currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const categories = [
    { value: 'support', label: '🆘 Support' },
    { value: 'bug', label: '🐛 Bug Report' },
    { value: 'feature', label: '✨ Feature Request' },
    { value: 'feedback', label: '💬 Feedback' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!/^\+?[0-9\s\-()]{10,20}$/.test(formData.phoneNumber.trim())) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Please enter your message');
      return false;
    }
    return true;
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToastMessage(error, 'error');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Direct write to Firestore 'support_queries'
      const { addDoc, collection } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      const trackingId = String(Math.floor(10000000 + Math.random() * 90000000));
      console.log(`🔥 Generated tracking ID: ${trackingId}`);

      console.log('🔥 Writing contact query directly to Firestore support_queries...');
      await addDoc(collection(db, 'support_queries'), {
        trackingId,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        subject: formData.subject,
        category: formData.category,
        message: formData.message,
        status: 'pending',
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      });

      // 2. Direct API Submission (No mailto fallback as requested)
      const apiUrl = '/api/contact';
      
      console.log('📤 Sending secure feedback directly from website...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          trackingId,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      console.log('📨 API Response:', data);

      if (response.ok && data.success) {
        setSubmitted(true);
        showToastMessage('✅ Your query has been logged and sent directly to the team!', 'success');
        if (formData.email) {
          fetchMyQueries(formData.email);
        }
        resetForm();
      } else {
        // Fallback: If email delivery fails, the query is still logged in Firestore successfully!
        setSubmitted(true);
        showToastMessage('✅ Your query was successfully logged in our system!', 'success');
        if (formData.email) {
          fetchMyQueries(formData.email);
        }
        resetForm();
      }

    } catch (err) {
      console.error('❌ Submission Error:', err);
      showToastMessage(err.message || 'Server error. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        subject: '',
        category: 'support',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section className="contact-us-section" style={{
      marginTop: minimal ? '0' : '48px',
      padding: '0'
    }}>
      {/* Section Header */}
      {!minimal && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
            opacity: 1,
            transform: 'translateY(0)'
          }}
        >
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: 'var(--text-main)',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Need Help?
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-dim)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Send your questions, feedback, or support requests directly to the TrackTaps team.
          </p>
        </div>
      )}

      {/* Contact Form Container */}
      <div
        style={minimal ? {
          opacity: 1,
          transform: 'translateY(0)'
        } : {
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '24px',
          padding: '48px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          maxWidth: '700px',
          margin: '0 auto',
          opacity: 1,
          transform: 'translateY(0)'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('new_ticket')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'new_ticket' ? 'var(--primary-light)' : 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: '700',
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'new_ticket' ? '2px solid var(--primary-light)' : 'none',
              transition: 'all 0.2s ease',
              marginBottom: '-13px'
            }}
          >
            📩 Send Query
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('my_tickets');
              if (currentUser) {
                fetchMyQueries(currentUser.email);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'my_tickets' ? 'var(--primary-light)' : 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: '700',
              padding: '8px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'my_tickets' ? '2px solid var(--primary-light)' : 'none',
              transition: 'all 0.2s ease',
              marginBottom: '-13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 My Tickets
            {myQueries.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '100px',
                fontWeight: '700'
              }}>
                {myQueries.filter(q => q.status !== 'resolved').length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'new_ticket' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Name Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>👤</span> Your Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--primary-glow)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            />
          </div>

          {/* Email Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📧</span> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--primary-glow)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            />
          </div>

          {/* Phone Number Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📞</span> Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--primary-glow)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              🔒 Note: Your phone number is only visible to admins to help resolve your query.
            </span>
          </div>

          {/* Subject Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📝</span> Subject
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What is this about?"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--primary-glow)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            />
          </div>

          {/* Category Dropdown */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🏷️</span> Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--primary-glow)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} style={{ background: 'var(--surface)', color: 'var(--text-main)' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>💬</span> Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what's on your mind..."
              rows="5"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: 'var(--text-main)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '120px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--primary-glow)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || submitted}
            style={{
              background: submitted 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%)'
                : 'linear-gradient(135deg, #a855f7 0%, var(--primary) 100%)',
              color: 'var(--text-main)',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: loading || submitted ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading || submitted ? 0.8 : 1,
              boxShadow: '0 10px 30px var(--primary-glow)'
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                  ⏳
                </span>
                Sending...
              </>
            ) : submitted ? (
              <>
                <span>✅</span>
                Message Sent!
              </>
            ) : (
              <>
                <span>✈️</span> Send Message
              </>
            )}
          </button>
        </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loadingQueries ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span>
                Loading your queries...
              </div>
            ) : myQueries.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                <p style={{ color: 'var(--text-dim)', margin: '0' }}>You haven't submitted any support queries yet.</p>
                <button 
                  type="button"
                  onClick={() => setActiveTab('new_ticket')}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: 'var(--primary-light)',
                    border: '1px solid var(--primary-glow)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '12px',
                    fontWeight: '600'
                  }}
                >
                  Submit New Query
                </button>
              </div>
            ) : (
              myQueries.map(query => (
                <div 
                  key={query.id} 
                  style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        background: 'rgba(139, 92, 246, 0.15)', 
                        color: 'var(--primary-light)', 
                        padding: '3px 8px', 
                        borderRadius: '100px', 
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {query.category || 'support'}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        background: query.status === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : query.status === 'spam' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                        color: query.status === 'resolved' ? '#10b981' : query.status === 'spam' ? '#ef4444' : '#f59e0b', 
                        padding: '3px 8px', 
                        borderRadius: '100px', 
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {query.status || 'pending'}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: 'var(--text-dim)', 
                        padding: '3px 8px', 
                        borderRadius: '100px', 
                        fontWeight: '700',
                        fontFamily: 'monospace'
                      }}>
                        T.ID: {query.trackingId || query.id.substring(0, 8)}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {query.timestamp ? new Date(query.timestamp).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-main)', fontWeight: '700' }}>
                      {query.subject}
                    </h4>
                    <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {query.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toastType === 'success' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(16, 185, 129, 0.7) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(239, 68, 68, 0.7) 100%)',
            color: 'var(--text-main)',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: toastType === 'success'
              ? '1px solid rgba(16, 185, 129, 0.5)'
              : '1px solid rgba(239, 68, 68, 0.5)',
            zIndex: 9999,
            maxWidth: '90%',
            animation: 'slideUp 0.3s ease forwards'
          }}
        >
          {toastMessage}
        </div>
      )}
    </section>
  );
}

export default ContactUs;
