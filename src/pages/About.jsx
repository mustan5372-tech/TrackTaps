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
        {/* Hero Section */}
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

        {/* Features Section */}
        <section className="features-showcase" style={{ marginTop: '80px' }}>
          <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '48px', color: '#f8fafc' }}>Why TrackTaps?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="feature-card" style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              transition: 'all 0.3s'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#f8fafc' }}>Smart Tracking</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Effortlessly track your attendance across all subjects with our intuitive interface.</p>
            </div>
            <div className="feature-card" style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              transition: 'all 0.3s'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#f8fafc' }}>AI Insights</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Get intelligent predictions and recommendations to optimize your attendance.</p>
            </div>
            <div className="feature-card" style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              transition: 'all 0.3s'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#f8fafc' }}>Analytics</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Visualize your attendance patterns with beautiful charts and heatmaps.</p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section style={{ marginTop: '80px' }}>
          <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '48px', color: '#f8fafc' }}>Built by Innovators</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨‍💻</div>
              <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Development</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Built with React, modern web technologies, and best practices.</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎨</div>
              <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Design</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Premium UI/UX with glassmorphism and smooth animations.</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Performance</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Optimized for speed, reliability, and seamless experience.</p>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section style={{ marginTop: '80px' }}>
          <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '48px', color: '#f8fafc' }}>Future Roadmap</h2>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            padding: '32px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>📱 Mobile App</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Native iOS and Android applications for on-the-go tracking.</p>
              </div>
              <div>
                <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>🔗 Integration</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Connect with college management systems and calendars.</p>
              </div>
              <div>
                <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>🤖 Advanced AI</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Machine learning models for better predictions.</p>
              </div>
              <div>
                <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>👥 Collaboration</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Share schedules and insights with classmates.</p>
              </div>
              <div>
                <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>📈 Analytics</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Advanced analytics and reporting features.</p>
              </div>
              <div>
                <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>🎓 Gamification</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Achievements, badges, and leaderboards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ marginTop: '80px', textAlign: 'center', paddingBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#f8fafc' }}>Ready to Transform Your Attendance?</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '32px' }}>Start tracking smarter today with TrackTaps.</p>
          <Link to="/" className="glow-btn" style={{ display: 'inline-block' }}>
            <span>Get Started Now</span>
            <div className="btn-glow"></div>
          </Link>
        </section>
      </div>
    </div>
  );
}

export default About;
