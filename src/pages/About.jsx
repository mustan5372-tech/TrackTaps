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

// Premium Founders & Core Team Card Component
const FounderCard = ({ name, role, description, initials, index }) => {
  const [ref, isVisible] = useScrollReveal();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      animate={isVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
        border: '1.5px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '24px',
        padding: '48px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Animated gradient border on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '24px',
            padding: '1.5px',
            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(168, 85, 247, 0.4) 100%)`,
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      )}

      {/* Spotlight effect on hover */}
      {isHovered && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            left: mousePosition.x - 150,
            top: mousePosition.y - 150,
            pointerEvents: 'none',
            filter: 'blur(40px)'
          }}
        />
      )}

      {/* Glow background */}
      <motion.div
        animate={isHovered ? { opacity: 0.8 } : { opacity: 0.3 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Avatar with premium glow */}
      <motion.div
        animate={isHovered ? { scale: 1.15, y: -10 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 28px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          fontWeight: '800',
          color: '#f8fafc',
          boxShadow: isHovered 
            ? '0 0 50px rgba(139, 92, 246, 0.8), 0 0 100px rgba(168, 85, 247, 0.4)' 
            : '0 0 30px rgba(139, 92, 246, 0.5)',
          position: 'relative',
          zIndex: 2
        }}
      >
        {initials}
      </motion.div>

      {/* Role Badge with animation */}
      <motion.div
        animate={isHovered ? { scale: 1.08, y: -5 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.5)',
          color: '#a78bfa',
          padding: '8px 20px',
          borderRadius: '24px',
          fontSize: '11px',
          fontWeight: '700',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          position: 'relative',
          zIndex: 1
        }}
      >
        {role}
      </motion.div>

      <motion.h3 
        animate={isHovered ? { y: -5 } : { y: 0 }}
        style={{ 
          color: '#f8fafc', 
          fontSize: '22px', 
          fontWeight: '800', 
          marginBottom: '12px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {name}
      </motion.h3>

      <motion.p 
        animate={isHovered ? { y: -3 } : { y: 0 }}
        style={{ 
          color: '#cbd5e1', 
          fontSize: '15px', 
          lineHeight: '1.7', 
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {description}
      </motion.p>

      {/* Social Icons with hover effects */}
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div
          whileHover={{ scale: 1.3, rotate: 10 }}
          style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            transition: 'all 0.3s'
          }}
        >
          🔗
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.3, rotate: -10 }}
          style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            transition: 'all 0.3s'
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40, filter: 'blur(10px)' }}
      animate={isVisible ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      style={{
        position: 'relative',
        paddingLeft: index % 2 === 0 ? '0' : '50px',
        paddingRight: index % 2 === 0 ? '50px' : '0'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated Timeline connector with glow */}
      <motion.div
        animate={isHovered ? { opacity: 1 } : { opacity: 0.5 }}
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.2) 100%)',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
        }}
      />

      {/* Animated Timeline dot with pulsing glow */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '24px',
          width: '20px',
          height: '20px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.9), 0 0 60px rgba(168, 85, 247, 0.5)',
          zIndex: 3
        }}
      />

      {/* Phase card with premium styling */}
      <motion.div
        whileHover={{ scale: 1.03, y: -8 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1.5px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '20px',
          padding: '36px',
          marginBottom: '50px',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer'
        }}
      >
        {/* Animated gradient border on hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '20px',
              padding: '1.5px',
              background: `linear-gradient(135deg, rgba(139, 92, 246, 0.6) 0%, rgba(168, 85, 247, 0.3) 100%)`,
              pointerEvents: 'none',
              zIndex: -1
            }}
          />
        )}

        {/* Pulsing glow background */}
        <motion.div
          animate={{ opacity: isHovered ? 0.8 : 0.4 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Floating particles effect */}
        {isHovered && (
          <>
            <motion.div
              animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'rgba(139, 92, 246, 0.6)',
                borderRadius: '50%',
                left: '20%',
                top: '30%',
                pointerEvents: 'none'
              }}
            />
            <motion.div
              animate={{ y: [0, -25, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              style={{
                position: 'absolute',
                width: '3px',
                height: '3px',
                background: 'rgba(168, 85, 247, 0.5)',
                borderRadius: '50%',
                right: '25%',
                top: '40%',
                pointerEvents: 'none'
              }}
            />
          </>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.h4 
            animate={isHovered ? { y: -5 } : { y: 0 }}
            style={{
              color: '#a78bfa',
              fontSize: '13px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '16px'
            }}
          >
            {phase}
          </motion.h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -15, filter: 'blur(5px)' }}
                animate={isVisible ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
                transition={{ delay: 0.25 + idx * 0.12 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#cbd5e1',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                <motion.span 
                  animate={isHovered ? { scale: 1.5 } : { scale: 1 }}
                  style={{
                    width: '8px',
                    height: '8px',
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                  }}
                />
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
      phase: 'PHASE 1 — FOUNDATION',
      items: ['Smart Attendance Tracking', 'Timetable System', 'Analytics Dashboard']
    },
    {
      phase: 'PHASE 2 — AI & AUTOMATION',
      items: ['AI Assistant', 'Attendance Insights', 'POD.ai Integration']
    },
    {
      phase: 'PHASE 3 — PLATFORM EXPANSION',
      items: ['Android APK', 'PWA Support', 'Cross-device Sync']
    },
    {
      phase: 'PHASE 4 — FUTURE ECOSYSTEM',
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

        {/* TEAM SECTION - FOUNDERS & CORE TEAM */}
        <motion.section style={{ marginBottom: '140px' }}>
          <BlurRevealText>
            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: '16px',
              color: '#f8fafc'
            }}>
              Founders & Core Team
            </h2>
          </BlurRevealText>

          <BlurRevealText delay={0.2}>
            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto 80px',
              lineHeight: '1.7'
            }}>
              Built by passionate AU EV students from Medicaps University focused on redefining academic productivity.
            </p>
          </BlurRevealText>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <FounderCard
              name="Mustansir Sanawad"
              role="Lead Developer"
              initials="MS"
              description="AU EV student at Medicaps University building the future of intelligent academic productivity systems through TrackTaps."
              index={0}
            />
            <FounderCard
              name="Pranav Gohel"
              role="CMO"
              initials="PG"
              description="AU EV student at Medicaps University leading operational strategy, growth planning, and business direction for TrackTaps."
              index={1}
            />
            <FounderCard
              name="Purandar Yadav"
              role="Marketing Executive"
              initials="PY"
              description="AU EV student at Medicaps University focused on community engagement, outreach, and growth of the TrackTaps ecosystem."
              index={2}
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
