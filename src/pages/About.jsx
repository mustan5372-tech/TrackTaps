import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="about-view">
      <div className="aurora-bg">
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
        <div className="aurora-orb orb-3"></div>
      </div>

      <div className="about-container">
        <section className="about-hero-cinematic">
          <div className="hero-content-wrapper">
            <div className="ai-badge reveal-element">
              <span className="badge-dot"></span>
              <span>Premium SaaS Platform</span>
            </div>
            <h1 className="reveal-text">Smart Attendance <br /><span className="text-gradient">Reimagined.</span></h1>
            <p className="reveal-element reveal-stagger-1 sub-hero">A refined productivity ecosystem built for precision and academic success. Experience the next generation of attendance intelligence.</p>
            <div className="hero-actions-cinematic reveal-element reveal-stagger-2">
              <Link to="/" className="glow-btn">
                <span>Explore Dashboard</span>
                <div className="btn-glow"></div>
              </Link>
            </div>
          </div>
        </section>

        <section className="features-showcase" style={{ marginTop: '80px' }}>
          <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '48px', color: '#f8fafc' }}>Why TrackTaps?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="feature-card">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#f8fafc' }}>Smart Tracking</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Effortlessly track your attendance across all subjects with our intuitive interface.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#f8fafc' }}>AI Insights</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Get intelligent predictions and recommendations to optimize your attendance.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#f8fafc' }}>Analytics</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Visualize your attendance patterns with beautiful charts and heatmaps.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;
