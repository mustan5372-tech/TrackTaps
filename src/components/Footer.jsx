import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer 
      className="global-app-footer"
      style={{
        marginTop: '60px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(15, 23, 42, 0.95)',
        color: 'var(--text-dim)',
        padding: '40px 24px 110px 24px',
        fontSize: '13px',
        lineHeight: '1.6',
        position: 'relative',
        zIndex: 5
      }}
    >
      <style>{`
        .footer-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 36px;
        }
        .footer-title {
          color: var(--text-main);
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        .footer-link {
          color: var(--text-dim);
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-block;
          cursor: pointer;
          font-weight: 500;
        }
        .footer-link:hover {
          color: var(--primary-light);
          transform: translateX(2px);
        }
        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-contact-item:hover {
          color: var(--primary-light);
        }
        @media (min-width: 769px) {
          .global-app-footer {
            padding-bottom: 40px !important;
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .global-app-footer {
            padding: 32px 16px 110px 16px !important;
            text-align: center;
          }
          .footer-contact-list {
            align-items: center !important;
          }
          .footer-social-btn {
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: Brand & Team Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '900',
                fontSize: '16px',
                boxShadow: '0 0 12px var(--primary-glow)'
              }}>
                ⚡
              </div>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '18px', fontWeight: '800' }}>
                TrackTaps
              </h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Built with ❤️ by the <strong>TrackTaps Team</strong>. Empowering college and university students nationwide to seamlessly manage attendance, automate Pod.ai sync, and make smart academic choices with AI.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--primary-light)'
            }}>
              <span>🎓</span> Engineered for Academic Excellence
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><span onClick={() => navigate('/')} className="footer-link">🏠 Dashboard</span></li>
              <li><span onClick={() => navigate('/guide')} className="footer-link">📖 How to Use / Guide</span></li>
              <li><span onClick={() => navigate('/settings')} className="footer-link">⚙️ Account Settings</span></li>
              <li><span onClick={() => navigate('/terms')} className="footer-link">📜 Terms of Service</span></li>
              <li><span onClick={() => navigate('/privacy')} className="footer-link">🔒 Privacy Policy</span></li>
            </ul>
          </div>

          {/* Column 3: Contact & Community */}
          <div>
            <h4 className="footer-title">Contact & Support</h4>
            <div className="footer-contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="mailto:tracktaps@gmail.com" className="footer-contact-item">
                <span style={{ fontSize: '16px' }}>✉️</span>
                <span style={{ fontWeight: '600' }}>tracktaps@gmail.com</span>
              </a>

              <a 
                href="https://chat.whatsapp.com/FnqY8vehe4wLrRgK6MKVly" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)'
                }}
              >
                <span>💬</span> TrackTaps Official Community
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Rights Reserved */}
        <div style={{
          marginTop: '36px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} <strong>TrackTaps</strong>. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Version 4.0.0</span>
            <span>•</span>
            <span>Crafted for University Students</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
