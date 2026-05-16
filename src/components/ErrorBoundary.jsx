import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 [ErrorBoundary] Critical UI Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: 'var(--bg-deep)',
          borderRadius: '24px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          margin: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Module Unavailable</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
            We encountered a small glitch while loading this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Retry Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
