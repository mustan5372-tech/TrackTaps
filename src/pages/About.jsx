import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Scroll Reveal Hook
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Blur Reveal Text Component
const BlurRevealText = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={isVisible ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

// Premium Team Card Component
const TeamCard = ({ name, role, description, initials }) => {
  const [ref, isVisible] = useScrollReveal();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        padding: '32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Avatar with glow */}
      <motion.div
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: '700',
          color: '#f8fafc',
          boxShadow: isHovered ? '0 0 30px rgba(139, 92, 246, 0.6)' : '0 0 20px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {initials}
      </motion.div>

      {/* Role Badge */}
      <motion.div
        animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
        style={{
          display: 'inline-block',
          background: 'rgba(139, 92, 246, 0.2)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          color: '#a78bfa',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {role}
      </motion.div>

      <h3 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
        {name}
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
        {description}
      </p>

      {/* Social Icons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <motion.div
          whileHover={{ scale: 1.2 }}
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔗
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.2 }}
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          💼
        </motion.div>
      </div>
    </motion.div>
  );
};

// Premium Roadmap Phase Component
const RoadmapPhase = ({ phase, items, index }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{
        position: 'relative',
        paddingLeft: index % 2 === 0 ? '0' : '40px',
        paddingRight: index % 2 === 0 ? '40px' : '0'
      }}
    >
      {/* Timeline connector */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '2px',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.1) 100%)',
          transform: 'translateX(-50%)'
        }}
      />

      {/* Timeline dot */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '20px',
          width: '16px',
          height: '16px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)',
          zIndex: 2
        }}
      />

      {/* Phase card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow background */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 style={{
            color: '#a78bfa',
            fontSize: '14px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            {phase}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + idx * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  background: '#a78bfa',
                  borderRadius: '50%'
                }} />
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

function About() {
  const [ref, isVisible] = useScrollReveal();

  const roadmapPhases = [
    {
      phase: 'PHASE 1',
      items: ['Smart Attendance Tracking', 'Timetable Management', 'AI Assistant']
    },
    {
      phase: 'PHASE 2',
      items: ['POD.ai Integration', 'Smart Insights', 'Attendance Analytics']
    },
    {
      phase: 'PHASE 3',
      items: ['AI Prediction Engine', 'Cross-Platform Sync', 'APK + PWA Support']
    },
    {
      phase: 'PHASE 4',
      items: ['AI Study Planner', 'Smart Notifications', 'Academic Productivity Ecosystem']
    }
  ];

  return (
    <div className="about-view" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {/* Aurora orbs */}
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }}
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="about-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* HERO SECTION */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="about-hero-cinematic"
          style={{ marginBottom: '120px' }}
        >
          <div className="hero-content-wrapper">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="ai-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#a78bfa',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '24px'
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#a78bfa',
                  borderRadius: '50%'
                }}
              />
              Premium SaaS Platform
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontSize: 'clamp(36px, 8vw, 72px)',
                fontWeight: '800',
                color: '#f8fafc',
                lineHeight: '1.2',
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #a78bfa 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Smart Attendance <br />
              <span style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Reimagined.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <BlurRevealText delay={0.4}>
              <p style={{
                fontSize: '18px',
                color: '#94a3b8',
                lineHeight: '1.8',
                maxWidth: '700px',
                marginBottom: '40px'
              }}>
                TrackTaps is redefining academic productivity through intelligent attendance tracking, AI insights, and next-generation student tools. Built for students who demand excellence.
              </p>
            </BlurRevealText>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  color: '#f8fafc',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 50px rgba(139, 92, 246, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Explore Dashboard</span>
                <span>→</span>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* WHY TRACKTAPS SECTION */}
        <motion.section
          ref={ref}
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '120px' }}
        >
          <BlurRevealText>
            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: '60px',
              color: '#f8fafc'
            }}>
              Why TrackTaps?
            </h2>
          </BlurRevealText>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {[
              {
                icon: '🎯',
                title: 'Smart Tracking',
                desc: 'Effortlessly monitor attendance with intelligent automation and real-time insights.'
              },
              {
                icon: '🤖',
                title: 'AI Insights',
                desc: 'Get predictive attendance analysis and personalized academic recommendations.'
              },
              {
                icon: '📊',
                title: 'Productivity Ecosystem',
                desc: 'Built to simplify schedules, planning, attendance, and your entire academic life.'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.15 }}
                whileHover={{ y: -10 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: '20px',
                  padding: '40px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' }}>
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* TEAM SECTION */}
        <motion.section style={{ marginBottom: '120px' }}>
          <BlurRevealText>
            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: '60px',
              color: '#f8fafc'
            }}>
              Meet the Team
            </h2>
          </BlurRevealText>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            <TeamCard
              name="Mustansir Sanawad"
              role="Lead Developer"
              initials="MS"
              description="AU EV student at Medicaps University building the future of intelligent academic productivity systems."
            />
            <TeamCard
              name="Pranav Gohel"
              role="CFO"
              initials="PG"
              description="AU EV student at Medicaps University leading strategic growth and operational planning for TrackTaps."
            />
            <TeamCard
              name="Purandar Yadav"
              role="Marketing Executive"
              initials="PY"
              description="AU EV student at Medicaps University focused on community building and platform outreach."
            />
          </div>
        </motion.section>

        {/* FOUNDER QUOTE SECTION */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            marginBottom: '120px',
            textAlign: 'center',
            padding: '80px 40px',
            position: 'relative'
          }}
        >
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />
          <BlurRevealText>
            <h3 style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: '700',
              color: '#f8fafc',
              lineHeight: '1.4',
              maxWidth: '800px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 1
            }}>
              "We didn't just want another attendance tracker. We wanted to build a smarter academic ecosystem for students."
            </h3>
          </BlurRevealText>
        </motion.section>

        {/* ROADMAP SECTION */}
        <motion.section style={{ marginBottom: '120px' }}>
          <BlurRevealText>
            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: '80px',
              color: '#f8fafc'
            }}>
              Product Roadmap
            </h2>
          </BlurRevealText>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {roadmapPhases.map((phase, idx) => (
              <RoadmapPhase
                key={idx}
                phase={phase.phase}
                items={phase.items}
                index={idx}
              />
            ))}
          </div>
        </motion.section>

        {/* FINAL CTA SECTION */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            paddingBottom: '80px'
          }}
        >
          <BlurRevealText>
            <h2 style={{
              fontSize: '40px',
              fontWeight: '800',
              marginBottom: '16px',
              color: '#f8fafc'
            }}>
              Ready to Transform Your Attendance?
            </h2>
          </BlurRevealText>
          <BlurRevealText delay={0.2}>
            <p style={{
              fontSize: '18px',
              color: '#94a3b8',
              marginBottom: '40px'
            }}>
              Join thousands of students already using TrackTaps to master their academic journey.
            </p>
          </BlurRevealText>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: '#f8fafc',
                padding: '16px 40px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 50px rgba(139, 92, 246, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Get Started Now</span>
              <span>→</span>
            </Link>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

export default About;
