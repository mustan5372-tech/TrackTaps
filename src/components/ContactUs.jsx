import React, { useState } from 'react';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'support',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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
      // Direct API Submission (No mailto fallback as requested)
      const apiUrl = '/api/contact';
      
      console.log('📤 Sending secure feedback directly from website...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      console.log('📨 API Response:', data);

      if (response.ok && data.success) {
        setSubmitted(true);
        showToastMessage('✅ Your message has been sent directly to the team!', 'success');
        resetForm();
      } else {
        // Handle specific server-side configuration issues
        if (data.message && data.message.includes('not configured')) {
          throw new Error('Email service is currently being configured. Please check back in a few minutes.');
        }
        throw new Error(data.message || 'Failed to send message via website. Please try again later.');
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
        subject: '',
        category: 'support',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section className="contact-us-section" style={{
      marginTop: '48px',
      padding: '0'
    }}>
      {/* Section Header */}
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
          color: '#f8fafc',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Need Help?
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#94a3b8',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Send your questions, feedback, or support requests directly to the TrackTaps team.
        </p>
      </div>

      {/* Contact Form Container */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Name Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#f8fafc',
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
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
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
              color: '#f8fafc',
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
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            />
          </div>

          {/* Subject Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#f8fafc',
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
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
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
              color: '#f8fafc',
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
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.target.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                e.target.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} style={{ background: '#0f172a', color: '#f8fafc' }}>
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
              color: '#f8fafc',
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
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
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
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
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
                : 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
              color: '#f8fafc',
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
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
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
            color: '#f8fafc',
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
